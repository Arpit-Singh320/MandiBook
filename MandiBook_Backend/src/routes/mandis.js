const express = require('express');
const router = express.Router();
const { Op, fn, col } = require('sequelize');
const { Mandi, TimeSlot, Booking, AuditLog, User } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { resolveCoordinatesForMandi } = require('../utils/geocoding');

const normalizeWeekday = (dateString) => new Date(`${dateString}T00:00:00Z`).toLocaleDateString('en-US', {
  weekday: 'long',
  timeZone: 'UTC',
}).toLowerCase();

const sanitizeMandiPayload = (payload = {}) => {
  const allowedFields = [
    'name',
    'nameHi',
    'code',
    'address',
    'city',
    'district',
    'state',
    'pincode',
    'lat',
    'lng',
    'contactPhone',
    'crops',
    'operatingHoursOpen',
    'operatingHoursClose',
    'workingDays',
    'holidays',
    'isActive',
    'rating',
  ];

  const sanitized = {};
  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  }

  if (Array.isArray(sanitized.workingDays)) {
    sanitized.workingDays = [...new Set(sanitized.workingDays.map((day) => String(day).trim().toLowerCase()).filter(Boolean))];
  }

  if (Array.isArray(sanitized.crops)) {
    sanitized.crops = [...new Set(sanitized.crops.map((crop) => String(crop).trim()).filter(Boolean))];
  }

  if (Array.isArray(sanitized.holidays)) {
    sanitized.holidays = [...new Set(sanitized.holidays.map((holiday) => String(holiday).trim()).filter(Boolean))];
  }

  if (sanitized.lat !== undefined) {
    const parsedLat = Number(sanitized.lat);
    sanitized.lat = Number.isFinite(parsedLat) ? parsedLat : sanitized.lat;
  }

  if (sanitized.lng !== undefined) {
    const parsedLng = Number(sanitized.lng);
    sanitized.lng = Number.isFinite(parsedLng) ? parsedLng : sanitized.lng;
  }

  return sanitized;
};

const GEO_INPUT_FIELDS = ['name', 'address', 'city', 'district', 'state', 'pincode'];

const hasGeoFieldChange = (payload = {}) => GEO_INPUT_FIELDS.some((field) => payload[field] !== undefined);

const withResolvedCoordinates = async (payload, existingMandi = null) => {
  const sanitized = sanitizeMandiPayload(payload);
  const shouldResolveCoordinates = !existingMandi || sanitized.lat !== undefined || sanitized.lng !== undefined || hasGeoFieldChange(payload);

  if (!shouldResolveCoordinates) {
    return sanitized;
  }

  const effectivePayload = {
    ...(existingMandi ? existingMandi.toJSON() : {}),
    ...sanitized,
  };

  const coordinates = await resolveCoordinatesForMandi(effectivePayload);
  if (coordinates) {
    sanitized.lat = coordinates.lat;
    sanitized.lng = coordinates.lng;
    return sanitized;
  }

  if (!existingMandi && hasGeoFieldChange(sanitized)) {
    const error = new Error('Unable to resolve mandi coordinates from the provided address. Please provide valid latitude and longitude.');
    error.statusCode = 400;
    throw error;
  }

  if (existingMandi && hasGeoFieldChange(payload) && sanitized.lat === undefined && sanitized.lng === undefined) {
    const error = new Error('Unable to update mandi coordinates from the provided address. Please provide valid latitude and longitude.');
    error.statusCode = 400;
    throw error;
  }

  return sanitized;
};

const attachManagersToMandis = async (mandis) => {
  const mandiList = Array.isArray(mandis) ? mandis : [mandis];
  if (mandiList.length === 0) return [];

  const mandiIds = mandiList.map((mandi) => mandi.id);
  const managers = await User.findAll({
    where: {
      role: 'manager',
      mandiId: { [Op.in]: mandiIds },
    },
    attributes: ['id', 'name', 'email', 'phone', 'designation', 'status', 'mandiId'],
    order: [['createdAt', 'ASC']],
  });

  const managersByMandiId = managers.reduce((map, manager) => {
    const mandiManagers = map.get(manager.mandiId) || [];
    mandiManagers.push(manager.toJSON());
    map.set(manager.mandiId, mandiManagers);
    return map;
  }, new Map());

  return mandiList.map((mandi) => {
    const json = mandi.toJSON();
    const mandiManagers = managersByMandiId.get(json.id) || [];
    return {
      ...json,
      manager: mandiManagers[0] || json.manager || null,
      managers: mandiManagers,
      managerCount: mandiManagers.length,
      managerIds: mandiManagers.map((manager) => manager.id),
    };
  });
};

// ─── Get all mandis (public + filtered) ─────────────────────────────────────────
// GET /api/mandis?search=xxx&state=xxx&active=true&page=1&limit=20
router.get('/', async (req, res, next) => {
  try {
    const { search, state, active, page = 1, limit = 20 } = req.query;
    const where = {};

    if (active !== undefined) where.isActive = active === 'true';
    if (state) where.state = { [Op.iLike]: `%${state}%` };
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
        { state: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count: total, rows: mandis } = await Mandi.findAndCountAll({
      where,
      include: [{ model: User, as: 'manager', attributes: ['id', 'name', 'email'] }],
      order: [['name', 'ASC']],
      offset,
      limit: parseInt(limit),
    });

    const enrichedMandis = await attachManagersToMandis(mandis);

    res.json({ success: true, data: enrichedMandis, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
});

// ─── Get nearby mandis (Farmer) ─────────────────────────────────────────────────
// GET /api/mandis/nearby?lat=xx&lng=xx&radius=25
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radius = 25 } = req.query;

    let mandis = await Mandi.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
    let results = mandis.map((m) => m.toJSON());

    if (lat && lng) {
      results = results.map((m) => {
        if (m.lat && m.lng) {
          const R = 6371;
          const dLat = ((m.lat - parseFloat(lat)) * Math.PI) / 180;
          const dLng = ((m.lng - parseFloat(lng)) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((parseFloat(lat) * Math.PI) / 180) *
              Math.cos((m.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          m.distance = parseFloat((R * c).toFixed(1));
        } else {
          m.distance = null;
        }
        return m;
      });
      results = results
        .filter((m) => m.distance !== null && m.distance <= parseFloat(radius))
        .sort((a, b) => a.distance - b.distance);
    }

    const today = new Date().toISOString().split('T')[0];
    const enriched = await Promise.all(
      results.map(async (m) => {
        const slots = await TimeSlot.findAll({ where: { mandiId: m.id, date: today, isActive: true } });
        const slotsToday = slots.reduce((sum, s) => sum + Math.max(0, s.capacity - s.bookedCount), 0);
        return { ...m, slotsToday };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
});

// ─── Get single mandi ───────────────────────────────────────────────────────────
// GET /api/mandis/:id
router.get('/:id', async (req, res, next) => {
  try {
    const mandi = await Mandi.findByPk(req.params.id, {
      include: [{ model: User, as: 'manager', attributes: ['id', 'name', 'email', 'phone'] }],
    });
    if (!mandi) return res.status(404).json({ success: false, message: 'Mandi not found' });
    const [enrichedMandi] = await attachManagersToMandis([mandi]);
    res.json({ success: true, data: enrichedMandi });
  } catch (error) {
    next(error);
  }
});

// ─── Create mandi (Admin) ───────────────────────────────────────────────────────
// POST /api/mandis
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const mandiPayload = await withResolvedCoordinates(req.body);
    const mandi = await Mandi.create(mandiPayload);

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: 'admin',
      action: 'Registered new mandi',
      entity: 'Mandi',
      entityId: mandi.id,
      details: `${mandi.name}, ${mandi.state}`,
      type: 'mandi',
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: mandi, message: 'Mandi created' });
  } catch (error) {
    next(error);
  }
});

// ─── Update mandi (Admin) ───────────────────────────────────────────────────────
// PUT /api/mandis/:id
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const mandi = await Mandi.findByPk(req.params.id);
    if (!mandi) return res.status(404).json({ success: false, message: 'Mandi not found' });

    const mandiPayload = await withResolvedCoordinates(req.body, mandi);
    await mandi.update(mandiPayload);

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: 'admin',
      action: 'Updated mandi',
      entity: 'Mandi',
      entityId: mandi.id,
      details: mandi.name,
      type: 'mandi',
      ipAddress: req.ip,
    });

    res.json({ success: true, data: mandi, message: 'Mandi updated' });
  } catch (error) {
    next(error);
  }
});

// ─── Update mandi operations (Manager/Admin) ─────────────────────────────────────
// PUT /api/mandis/:id/operations
router.put('/:id/operations', protect, authorize('manager', 'admin'), async (req, res, next) => {
  try {
    const mandi = await Mandi.findByPk(req.params.id);
    if (!mandi) return res.status(404).json({ success: false, message: 'Mandi not found' });

    if (req.user.role === 'manager' && (!req.user.mandiId || req.user.mandiId !== mandi.id)) {
      return res.status(403).json({ success: false, message: 'You can only update operations for your assigned mandi' });
    }

    const updates = sanitizeMandiPayload(req.body);
    const allowedFields = ['crops', 'operatingHoursOpen', 'operatingHoursClose', 'workingDays', 'holidays', 'contactPhone'];
    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    await mandi.update(filteredUpdates);

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Updated mandi operations',
      entity: 'Mandi',
      entityId: mandi.id,
      details: `${mandi.name} operations updated`,
      type: 'mandi',
      ipAddress: req.ip,
    });

    const [enrichedMandi] = await attachManagersToMandis([mandi]);
    res.json({ success: true, data: enrichedMandi, message: 'Mandi operations updated' });
  } catch (error) {
    next(error);
  }
});

// ─── Toggle mandi active status (Admin) ─────────────────────────────────────────
// PUT /api/mandis/:id/toggle
router.put('/:id/toggle', protect, authorize('admin'), async (req, res, next) => {
  try {
    const mandi = await Mandi.findByPk(req.params.id);
    if (!mandi) return res.status(404).json({ success: false, message: 'Mandi not found' });

    await mandi.update({ isActive: !mandi.isActive });
    res.json({ success: true, data: mandi, message: `Mandi ${mandi.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    next(error);
  }
});

// ─── Get mandi stats ────────────────────────────────────────────────────────────
// GET /api/mandis/:id/stats
router.get('/:id/stats', protect, authorize('manager', 'admin'), async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const mandiId = req.params.id;

    if (req.user.role === 'manager' && (!req.user.mandiId || req.user.mandiId !== mandiId)) {
      return res.status(403).json({ success: false, message: 'You can only view stats for your assigned mandi' });
    }

    const mandi = await Mandi.findByPk(mandiId);
    if (!mandi) return res.status(404).json({ success: false, message: 'Mandi not found' });

    const [todayBookings, todayCheckedIn, slots] = await Promise.all([
      Booking.count({ where: { mandiId, date: today } }),
      Booking.count({ where: { mandiId, date: today, status: 'checked-in' } }),
      TimeSlot.findAll({ where: { mandiId, date: today, isActive: true } }),
    ]);

    const totalFarmersResult = await Booking.count({
      where: { mandiId },
      distinct: true,
      col: 'farmerId',
    });

    const managerCount = await User.count({ where: { role: 'manager', mandiId } });

    const totalSlotCapacity = slots.reduce((s, sl) => s + sl.capacity, 0);
    const totalBooked = slots.reduce((s, sl) => s + sl.bookedCount, 0);
    const utilization = totalSlotCapacity > 0 ? ((totalBooked / totalSlotCapacity) * 100).toFixed(1) : 0;
    const weekday = normalizeWeekday(today);
    const workingToday = (mandi.workingDays || []).includes(weekday) && !(mandi.holidays || []).includes(today);

    res.json({
      success: true,
      data: {
        todayBookings,
        todayCheckedIn,
        totalFarmers: totalFarmersResult,
        managerCount,
        slotUtilization: parseFloat(utilization),
        availableSlots: totalSlotCapacity - totalBooked,
        workingToday,
        operatingHoursOpen: mandi.operatingHoursOpen,
        operatingHoursClose: mandi.operatingHoursClose,
        workingDays: mandi.workingDays,
        crops: mandi.crops,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
