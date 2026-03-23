const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Issue, AuditLog } = require('../models');
const { protect, authorize } = require('../middleware/auth');

// ─── Get all issues ─────────────────────────────────────────────────────────────
// GET /api/issues?status=xxx&priority=xxx&search=xxx&page=1&limit=20
router.get('/', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { status, priority, search, page = 1, limit = 20 } = req.query;
    const where = {};

    if (status && status !== 'all') where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { mandiName: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (req.user.role === 'manager' && req.user.mandiId) {
      where.mandiId = req.user.mandiId;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count: total, rows: issues } = await Issue.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    // Build base where for counts (keep manager filter)
    const baseWhere = { ...where };
    delete baseWhere.status;
    const counts = {
      open: await Issue.count({ where: { ...baseWhere, status: 'open' } }),
      'in-progress': await Issue.count({ where: { ...baseWhere, status: 'in-progress' } }),
      resolved: await Issue.count({ where: { ...baseWhere, status: 'resolved' } }),
      closed: await Issue.count({ where: { ...baseWhere, status: 'closed' } }),
    };

    res.json({ success: true, data: issues, counts, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
});

// ─── Create issue ───────────────────────────────────────────────────────────────
// POST /api/issues
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, description, mandiId, mandiName, priority } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const issue = await Issue.create({
      reporterId: req.user.id,
      reporterName: `${req.user.name} (${req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)})`,
      mandiId,
      mandiName,
      title,
      description,
      priority: priority || 'medium',
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Issue reported',
      entity: 'Issue',
      entityId: issue.id,
      details: title,
      type: 'system',
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: issue, message: 'Issue reported' });
  } catch (error) {
    next(error);
  }
});

// ─── Update issue status ────────────────────────────────────────────────────────
// PUT /api/issues/:id
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const issue = await Issue.findByPk(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

    const allowed = ['status', 'priority', 'assignedTo', 'resolution'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await issue.update(updates);
    res.json({ success: true, data: issue, message: 'Issue updated' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
