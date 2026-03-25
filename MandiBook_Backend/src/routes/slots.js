const express = require('express');
const router = express.Router();
const { TimeSlot, AuditLog, Mandi } = require('../models');
const { protect, authorize } = require('../middleware/auth');

const DEFAULT_SLOT_CAPACITY = 20;
const DEFAULT_SLOT_WINDOW_HOURS = 2;

const toMinutes = (timeString) => {
  const [hours = '0', minutes = '0'] = String(timeString).split(':');
  return Number(hours) * 60 + Number(minutes);
};

const toTimeString = (totalMinutes) => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const toSlotLabel = (startTime, endTime) => {
  const format = (value) => {
    const [hoursString, minutesString] = value.split(':');
    const hours = Number(hoursString);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const normalizedHours = hours % 12 || 12;
    return `${String(normalizedHours).padStart(2, '0')}:${minutesString} ${suffix}`;
  };

  return `${format(startTime)} - ${format(endTime)}`;
};

const ensureSlotsForDate = async (mandiId, date) => {
  const existingSlots = await TimeSlot.findAll({ where: { mandiId, date }, order: [['startTime', 'ASC']] });
  if (existingSlots.length > 0) {
    return existingSlots;
  }

  const mandi = await Mandi.findByPk(mandiId);
  if (!mandi || !mandi.isActive) {
    return existingSlots;
  }

  const today = new Date().toISOString().split('T')[0];
  if (!date || date < today) {
    return existingSlots;
  }

  const openMinutes = toMinutes(mandi.operatingHoursOpen || '06:00');
  const closeMinutes = toMinutes(mandi.operatingHoursClose || '16:00');
  const slotWindowMinutes = DEFAULT_SLOT_WINDOW_HOURS * 60;

  if (closeMinutes <= openMinutes) {
    return existingSlots;
  }

  const payload = [];
  for (let start = openMinutes; start + slotWindowMinutes <= closeMinutes; start += slotWindowMinutes) {
    const startTime = toTimeString(start);
    const endTime = toTimeString(start + slotWindowMinutes);
    payload.push({
      mandiId,
      date,
      startTime,
      endTime,
      label: toSlotLabel(startTime, endTime),
      capacity: DEFAULT_SLOT_CAPACITY,
      bookedCount: 0,
      isActive: true,
    });
  }

  if (payload.length === 0) {
    return existingSlots;
  }

  await TimeSlot.bulkCreate(payload);
  return TimeSlot.findAll({ where: { mandiId, date }, order: [['startTime', 'ASC']] });
};

// ─── Get slots for a mandi on a date ────────────────────────────────────────────
// GET /api/slots?mandiId=xxx&date=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const { mandiId, date } = req.query;
    if (!mandiId) return res.status(400).json({ success: false, message: 'mandiId is required' });

    const where = { mandiId };
    if (date) where.date = date;

    const slots = date
      ? await ensureSlotsForDate(mandiId, date)
      : await TimeSlot.findAll({ where, order: [['startTime', 'ASC']] });
    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
});

// ─── Create slot (Manager) ──────────────────────────────────────────────────────
// POST /api/slots
router.post('/', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { mandiId, date, startTime, endTime, label, capacity } = req.body;
    if (!mandiId || !date || !startTime || !endTime || !capacity) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const slot = await TimeSlot.create({
      mandiId, date, startTime, endTime,
      label: label || `${startTime} - ${endTime}`,
      capacity,
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: 'manager',
      action: 'Created time slot',
      entity: 'TimeSlot',
      entityId: slot.id,
      details: `${slot.label} on ${date}`,
      type: 'mandi',
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: slot, message: 'Slot created' });
  } catch (error) {
    next(error);
  }
});

// ─── Update slot (Manager) ──────────────────────────────────────────────────────
// PUT /api/slots/:id
router.put('/:id', protect, authorize('manager'), async (req, res, next) => {
  try {
    const slot = await TimeSlot.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    const allowed = ['capacity', 'label', 'startTime', 'endTime', 'isActive'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await slot.update(updates);
    res.json({ success: true, data: slot, message: 'Slot updated' });
  } catch (error) {
    next(error);
  }
});

// ─── Toggle slot active (Manager) ───────────────────────────────────────────────
// PUT /api/slots/:id/toggle
router.put('/:id/toggle', protect, authorize('manager'), async (req, res, next) => {
  try {
    const slot = await TimeSlot.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    await slot.update({ isActive: !slot.isActive });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: 'manager',
      action: `${slot.isActive ? 'Activated' : 'Deactivated'} slot`,
      entity: 'TimeSlot',
      entityId: slot.id,
      details: `${slot.label} @ mandiId ${slot.mandiId}`,
      type: 'mandi',
      ipAddress: req.ip,
    });

    res.json({ success: true, data: slot, message: `Slot ${slot.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    next(error);
  }
});

// ─── Delete slot (Manager) ──────────────────────────────────────────────────────
// DELETE /api/slots/:id
router.delete('/:id', protect, authorize('manager'), async (req, res, next) => {
  try {
    const slot = await TimeSlot.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    if (slot.bookedCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete a slot with existing bookings' });
    }

    await slot.destroy();
    res.json({ success: true, message: 'Slot deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
