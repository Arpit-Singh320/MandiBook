const express = require('express');
const router = express.Router();
const { Op, fn, col } = require('sequelize');
const { Mandi, TimeSlot, Booking, AuditLog, User } = require('../models');
const { protect, authorize } = require('../middleware/auth');

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

    res.json({ success: true, data: mandis, total, page: parseInt(page), limit: parseInt(limit) });
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
    res.json({ success: true, data: mandi });
  } catch (error) {
    next(error);
  }
});

// ─── Create mandi (Admin) ───────────────────────────────────────────────────────
// POST /api/mandis
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const mandi = await Mandi.create(req.body);

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

    await mandi.update(req.body);

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

    const totalSlotCapacity = slots.reduce((s, sl) => s + sl.capacity, 0);
    const totalBooked = slots.reduce((s, sl) => s + sl.bookedCount, 0);
    const utilization = totalSlotCapacity > 0 ? ((totalBooked / totalSlotCapacity) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        todayBookings,
        todayCheckedIn,
        totalFarmers: totalFarmersResult,
        slotUtilization: parseFloat(utilization),
        availableSlots: totalSlotCapacity - totalBooked,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
