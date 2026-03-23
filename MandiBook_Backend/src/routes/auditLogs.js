const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { AuditLog } = require('../models');
const { protect, authorize } = require('../middleware/auth');

// ─── Get audit logs (Admin only) ────────────────────────────────────────────────
// GET /api/audit-logs?type=xxx&search=xxx&page=1&limit=30
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { type, search, page = 1, limit = 30 } = req.query;
    const where = {};

    if (type && type !== 'all') where.type = type;
    if (search) {
      where[Op.or] = [
        { action: { [Op.iLike]: `%${search}%` } },
        { userName: { [Op.iLike]: `%${search}%` } },
        { details: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count: total, rows: logs } = await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    res.json({ success: true, data: logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
