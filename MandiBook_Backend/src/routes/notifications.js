const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Notification, User, Booking } = require('../models');
const { sendEmail } = require('../config/brevo');
const { protect, authorize } = require('../middleware/auth');

const sendBroadcastEmailsBestEffort = async (recipients, subject, getHtmlContent) => {
  await Promise.all(
    recipients
      .filter((user) => user?.email)
      .map(async (user) => {
        try {
          await sendEmail(user.email, user.name || 'MandiBook User', subject, getHtmlContent(user));
        } catch (error) {
          console.error(`[Notifications] Broadcast email failed for ${user.email}:`, error.message);
        }
      }),
  );
};

const uniqueRecipientsById = (users = []) => {
  const seen = new Set();
  return users.filter((user) => {
    if (!user?.id || seen.has(user.id)) return false;
    seen.add(user.id);
    return true;
  });
};

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

    let recipients = [];
    if (req.user.role === 'manager') {
      const bookings = await Booking.findAll({
        where: { mandiId: req.user.mandiId },
        attributes: ['farmerId'],
        group: ['farmerId'],
      });
      const farmerIds = bookings.map((b) => b.farmerId).filter(Boolean);
      const bookedFarmers = farmerIds.length
        ? await User.findAll({
            where: {
              id: { [Op.in]: farmerIds },
              role: 'farmer',
              status: 'active',
            },
            attributes: ['id', 'name', 'email'],
          })
        : [];
      const preferredFarmers = req.user.mandiId
        ? await User.findAll({
            where: {
              role: 'farmer',
              status: 'active',
              preferredMandis: { [Op.contains]: [req.user.mandiId] },
            },
            attributes: ['id', 'name', 'email'],
          })
        : [];
      recipients = uniqueRecipientsById([...bookedFarmers, ...preferredFarmers]);
    } else {
      const where = {};
      if (target === 'farmers') where.role = 'farmer';
      else if (target === 'managers') where.role = 'manager';
      recipients = uniqueRecipientsById(await User.findAll({
        where: {
          ...where,
          status: 'active',
        },
        attributes: ['id', 'name', 'email'],
      }));
    }

    const notifications = recipients.map((user) => ({
      userId: user.id,
      type: 'announcement',
      title,
      message,
    }));

    if (notifications.length > 0) {
      await Notification.bulkCreate(notifications);
      await sendBroadcastEmailsBestEffort(
        recipients,
        `MandiBook Update — ${title}`,
        (user) => `
          <html>
            <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 24px;">
              <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                  <div style="width: 40px; height: 40px; border-radius: 12px; background: #166534; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">M</div>
                  <div>
                    <h2 style="margin: 0; color: #166534;">MandiBook Announcement</h2>
                    <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">Shared from the ${req.user.role === 'admin' ? 'admin' : 'manager'} portal</p>
                  </div>
                </div>
                <p style="margin: 0 0 12px; color: #374151;">Hello ${user.name || 'MandiBook User'},</p>
                <p style="margin: 0 0 12px; color: #111827; font-size: 18px; font-weight: 600;">${title}</p>
                <div style="padding: 16px; background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0; margin: 16px 0; color: #166534; white-space: pre-line;">${message}</div>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">You can also view this update inside your MandiBook notifications panel.</p>
              </div>
            </body>
          </html>
        `,
      );
    }

    res.json({ success: true, message: `Broadcast sent to ${notifications.length} users` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
