const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Notification, User, Booking } = require('../models');
const { protect, authorize } = require('../middleware/auth');

// ─── Get my notifications ───────────────────────────────────────────────────────
// GET /api/notifications?page=1&limit=30
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const where = { userId: req.user.id };
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count: total, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    const unreadCount = await Notification.count({ where: { userId: req.user.id, isRead: false } });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
});

// ─── Mark notification as read ──────────────────────────────────────────────────
// PUT /api/notifications/:id/read
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    await notification.update({ isRead: true });
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

// ─── Mark all notifications as read ─────────────────────────────────────────────
// PUT /api/notifications/read-all
router.put('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// ─── Send broadcast ─────────────────────────────────────────────────────────────
// POST /api/notifications/broadcast
router.post('/broadcast', protect, authorize('manager', 'admin'), async (req, res, next) => {
  try {
    const { message, title, target } = req.body;
    if (!message || !title) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    let recipientIds = [];
    if (req.user.role === 'manager') {
      const bookings = await Booking.findAll({
        where: { mandiId: req.user.mandiId },
        attributes: ['farmerId'],
        group: ['farmerId'],
      });
      recipientIds = bookings.map((b) => b.farmerId);
    } else {
      const where = {};
      if (target === 'farmers') where.role = 'farmer';
      else if (target === 'managers') where.role = 'manager';
      const users = await User.findAll({ where, attributes: ['id'] });
      recipientIds = users.map((u) => u.id);
    }

    const notifications = recipientIds.map((userId) => ({
      userId,
      type: 'announcement',
      title,
      message,
    }));

    if (notifications.length > 0) {
      await Notification.bulkCreate(notifications);
    }

    res.json({ success: true, message: `Broadcast sent to ${notifications.length} users` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
