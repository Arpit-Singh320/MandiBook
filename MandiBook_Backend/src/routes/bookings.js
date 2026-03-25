const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const QRCode = require('qrcode');
const { Booking, TimeSlot, Mandi, Notification, AuditLog, User } = require('../models');
const { protect, authorize } = require('../middleware/auth');

// Helper: generate booking number
const generateBookingNumber = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = String(Math.floor(Math.random() * 9000) + 1000);
  return `BK-${y}-${m}-${d}-${r}`;
};

// ─── Create Booking (Farmer) ────────────────────────────────────────────────────
// POST /api/bookings
router.post('/', protect, authorize('farmer'), async (req, res, next) => {
  try {
    const { mandiId, slotId, date, cropType, estimatedQuantity, vehicleNumber } = req.body;

    if (!mandiId || !slotId || !date || !cropType || !estimatedQuantity) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    const slot = await TimeSlot.findByPk(slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Time slot not found' });
    if (!slot.isActive) return res.status(400).json({ success: false, message: 'Time slot is inactive' });
    if (slot.bookedCount >= slot.capacity) {
      return res.status(400).json({ success: false, message: 'Time slot is full' });
    }

    const mandi = await Mandi.findByPk(mandiId);
    if (!mandi) return res.status(404).json({ success: false, message: 'Mandi not found' });

    const bookingNumber = generateBookingNumber();

    // Rich QR payload with full booking metadata
    const qrPayload = {
      v: 1,
      bn: bookingNumber,
      fid: req.user.id,
      fn: req.user.name,
      fp: req.user.phone || '',
      mid: mandiId,
      mn: mandi.name,
      sid: slotId,
      sl: slot.label || `${slot.startTime} - ${slot.endTime}`,
      d: date,
      ct: cropType,
      eq: estimatedQuantity,
      vn: vehicleNumber || '',
      ts: new Date().toISOString(),
      chk: Buffer.from(`${bookingNumber}:${req.user.id}:${mandiId}`).toString('base64').slice(0, 12),
    };
    const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: { dark: '#15803d', light: '#ffffff' },
    });

    const booking = await Booking.create({
      bookingNumber,
      farmerId: req.user.id,
      mandiId,
      slotId,
      date,
      timeSlot: slot.label || `${slot.startTime} - ${slot.endTime}`,
      cropType,
      estimatedQuantity,
      vehicleNumber: vehicleNumber || '',
      status: 'confirmed',
      qrCodeData,
    });

    await slot.increment('bookedCount');

    await Notification.create({
      userId: req.user.id,
      type: 'booking-confirmed',
      title: 'Booking Confirmed',
      message: `Your slot at ${mandi.name} on ${date} (${booking.timeSlot}) is confirmed.`,
      actionUrl: '/farmer/bookings',
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: 'farmer',
      action: 'Booking created',
      entity: 'Booking',
      entityId: booking.id,
      details: `${bookingNumber} @ ${mandi.name}`,
      type: 'booking',
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: booking, message: 'Booking confirmed' });
  } catch (error) {
    next(error);
  }
});

// ─── Get Farmer's Bookings ──────────────────────────────────────────────────────
// GET /api/bookings/my?status=all&search=xxx&page=1&limit=20
router.get('/my', protect, authorize('farmer'), async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const where = { farmerId: req.user.id };

    if (status && status !== 'all') where.status = status;
    if (search) {
      where[Op.or] = [
        { bookingNumber: { [Op.iLike]: `%${search}%` } },
        { cropType: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count: total, rows: bookings } = await Booking.findAndCountAll({
      where,
      include: [{ model: Mandi, as: 'mandi', attributes: ['id', 'name', 'city'] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    res.json({ success: true, data: bookings, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
});

// ─── Get Mandi Bookings (Manager) ───────────────────────────────────────────────
// GET /api/bookings/mandi/:mandiId?status=all&search=xxx&date=YYYY-MM-DD
router.get('/mandi/:mandiId', protect, authorize('manager', 'admin'), async (req, res, next) => {
  try {
    if (req.user.role === 'manager' && (!req.user.mandiId || req.user.mandiId !== req.params.mandiId)) {
      return res.status(403).json({ success: false, message: 'You can only view bookings for your assigned mandi' });
    }

    const { status, search, date, page = 1, limit = 50 } = req.query;
    const where = { mandiId: req.params.mandiId };

    if (status && status !== 'all') where.status = status;
    if (date) where.date = date;
    if (search) {
      where[Op.or] = [
        { bookingNumber: { [Op.iLike]: `%${search}%` } },
        { cropType: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count: total, rows: bookings } = await Booking.findAndCountAll({
      where,
      include: [{ model: User, as: 'farmer', attributes: ['id', 'name', 'phone'] }],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    const dateWhere = date ? { mandiId: req.params.mandiId, date } : { mandiId: req.params.mandiId };
    const summary = {
      total: await Booking.count({ where: dateWhere }),
      checkedIn: await Booking.count({ where: { ...dateWhere, status: 'checked-in' } }),
      confirmed: await Booking.count({ where: { ...dateWhere, status: 'confirmed' } }),
      pending: await Booking.count({ where: { ...dateWhere, status: 'pending' } }),
      cancelled: await Booking.count({ where: { ...dateWhere, status: 'cancelled' } }),
    };

    res.json({ success: true, data: bookings, summary, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
});

// ─── Cancel Booking (Farmer) ────────────────────────────────────────────────────
// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', protect, authorize('farmer'), async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ where: { id: req.params.id, farmerId: req.user.id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (!['confirmed', 'pending'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Only confirmed/pending bookings can be cancelled' });
    }

    await booking.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: req.body.reason || 'Cancelled by farmer',
    });

    await TimeSlot.decrement('bookedCount', { where: { id: booking.slotId } });

    const mandi = await Mandi.findByPk(booking.mandiId);

    await Notification.create({
      userId: req.user.id,
      type: 'booking-cancelled',
      title: 'Booking Cancelled',
      message: `Your booking ${booking.bookingNumber} at ${mandi?.name || 'Mandi'} has been cancelled.`,
      actionUrl: '/farmer/bookings',
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: 'farmer',
      action: 'Cancelled booking',
      entity: 'Booking',
      entityId: booking.id,
      details: `${booking.bookingNumber} @ ${mandi?.name || 'Mandi'}`,
      type: 'booking',
      ipAddress: req.ip,
    });

    res.json({ success: true, data: booking, message: 'Booking cancelled successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── Check-in Booking (Manager) ─────────────────────────────────────────────────
// PUT /api/bookings/:id/checkin
router.put('/:id/checkin', protect, authorize('manager'), async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: User, as: 'farmer', attributes: ['id', 'name'] }],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!req.user.mandiId || booking.mandiId !== req.user.mandiId) {
      return res.status(403).json({ success: false, message: 'You can only check in bookings for your assigned mandi' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Only confirmed bookings can be checked in' });
    }

    await booking.update({ status: 'checked-in', checkedInAt: new Date() });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: 'manager',
      action: 'Checked in farmer',
      entity: 'Booking',
      entityId: booking.id,
      details: `${booking.bookingNumber} ${booking.farmer?.name || ''}`,
      type: 'booking',
      ipAddress: req.ip,
    });

    res.json({ success: true, data: booking, message: 'Farmer checked in' });
  } catch (error) {
    next(error);
  }
});

// ─── Complete Booking (Manager) ─────────────────────────────────────────────────
// PUT /api/bookings/:id/complete
router.put('/:id/complete', protect, authorize('manager'), async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!req.user.mandiId || booking.mandiId !== req.user.mandiId) {
      return res.status(403).json({ success: false, message: 'You can only complete bookings for your assigned mandi' });
    }

    if (booking.status !== 'checked-in') {
      return res.status(400).json({ success: false, message: 'Only checked-in bookings can be completed' });
    }

    await booking.update({ status: 'completed', completedAt: new Date() });
    res.json({ success: true, data: booking, message: 'Booking completed' });
  } catch (error) {
    next(error);
  }
});

// ─── Get single booking ─────────────────────────────────────────────────────────
// GET /api/bookings/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Mandi, as: 'mandi', attributes: ['id', 'name', 'city', 'address'] },
        { model: User, as: 'farmer', attributes: ['id', 'name', 'phone'] },
      ],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
