const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// ─── Get all users (Admin) ──────────────────────────────────────────────────────
// GET /api/users?role=farmer&search=xxx&status=active&page=1&limit=20
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { role, search, status, page = 1, limit = 20 } = req.query;
    const where = {};

    if (role && role !== 'all') where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { village: { [Op.iLike]: `%${search}%` } },
        { district: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count: total, rows: users } = await User.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    const counts = {
      all: await User.count(),
      farmer: await User.count({ where: { role: 'farmer' } }),
      manager: await User.count({ where: { role: 'manager' } }),
      admin: await User.count({ where: { role: 'admin' } }),
    };

    res.json({ success: true, data: users, total, counts, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
});

// ─── Get single user ────────────────────────────────────────────────────────────
// GET /api/users/:id
router.get('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// ─── Update own profile ─────────────────────────────────────────────────────────
// PUT /api/users/profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const allowed = ['name', 'village', 'district', 'state', 'language', 'crops', 'priceAlertCrops', 'designation'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await req.user.update(updates);
    const user = await User.findByPk(req.user.id);
    res.json({ success: true, data: user, message: 'Profile updated' });
  } catch (error) {
    next(error);
  }
});

// ─── Update preferred mandis ────────────────────────────────────────────────────
// PUT /api/users/preferred-mandis
router.put('/preferred-mandis', protect, authorize('farmer'), async (req, res, next) => {
  try {
    const { preferredMandis } = req.body;
    await req.user.update({ preferredMandis });
    const user = await User.findByPk(req.user.id);
    res.json({ success: true, data: user, message: 'Preferred mandis updated' });
  } catch (error) {
    next(error);
  }
});

// ─── Suspend/activate user (Admin) ──────────────────────────────────────────────
// PUT /api/users/:id/status
router.put('/:id/status', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active or suspended' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await user.update({ status });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: `${status === 'suspended' ? 'Suspended' : 'Activated'} user`,
      entity: 'User',
      entityId: user.id,
      details: `${user.name} (${user.role})`,
      type: 'user',
      ipAddress: req.ip,
    });

    res.json({ success: true, data: user, message: `User ${status}` });
  } catch (error) {
    next(error);
  }
});

// ─── Create manager (Admin) ─────────────────────────────────────────────────────
// POST /api/users/manager
router.post('/manager', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password, phone, mandiId, designation } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ where: { email, role: 'manager' } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Manager with this email already exists' });
    }

    const user = await User.create({
      name, email, password, phone,
      role: 'manager',
      mandiId,
      designation,
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: 'admin',
      action: 'Created manager account',
      entity: 'User',
      entityId: user.id,
      details: `${name} — ${email}`,
      type: 'user',
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
      message: 'Manager created',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
