const express = require('express');
const router = express.Router();
const { Op, fn, col, literal, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { User, Booking, Mandi, CropPrice, Issue, TimeSlot } = require('../models');
const { protect, authorize } = require('../middleware/auth');

// ─── Farmer Dashboard Stats ─────────────────────────────────────────────────────
// GET /api/dashboard/farmer
router.get('/farmer', protect, authorize('farmer'), async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [totalBookings, upcomingBookings, completedBookings, cancelledBookings, qrScans] = await Promise.all([
      Booking.count({ where: { farmerId } }),
      Booking.count({ where: { farmerId, date: { [Op.gte]: today }, status: { [Op.in]: ['confirmed', 'pending'] } } }),
      Booking.count({ where: { farmerId, status: 'completed' } }),
      Booking.count({ where: { farmerId, status: 'cancelled' } }),
      Booking.count({ where: { farmerId, status: 'checked-in' } }),
    ]);

    const upcoming = await Booking.findAll({
      where: { farmerId, date: { [Op.gte]: today }, status: { [Op.in]: ['confirmed', 'pending'] } },
      include: [{ model: Mandi, as: 'mandi', attributes: ['id', 'name', 'city'] }],
      order: [['date', 'ASC']],
      limit: 5,
    });

    // Avg price for crops farmer has booked
    const recentCrops = await Booking.findAll({
      where: { farmerId },
      attributes: [[fn('DISTINCT', col('cropType')), 'cropType']],
      raw: true,
    });
    const cropNames = recentCrops.map((c) => c.cropType);
    let avgPrice = 0;
    if (cropNames.length > 0) {
      const result = await CropPrice.findOne({
        where: { crop: { [Op.in]: cropNames } },
        attributes: [[fn('AVG', col('currentPrice')), 'avg']],
        raw: true,
      });
      avgPrice = result?.avg ? Math.round(parseFloat(result.avg)) : 0;
    }

    res.json({
      success: true,
      data: {
        stats: {
          activeBookings: upcomingBookings,
          totalVisits: completedBookings + qrScans,
          avgPricePerQuintal: avgPrice,
          qrScans,
        },
        upcomingBookings: upcoming,
        totalBookings,
        completedBookings,
        cancelledBookings,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Manager Dashboard Stats ────────────────────────────────────────────────────
// GET /api/dashboard/manager
router.get('/manager', protect, authorize('manager'), async (req, res, next) => {
  try {
    const mandiId = req.user.mandiId;
    const today = new Date().toISOString().split('T')[0];

    const [todayBookings, todayCheckedIn, totalConfirmed, totalPending] = await Promise.all([
      Booking.count({ where: { mandiId, date: today } }),
      Booking.count({ where: { mandiId, date: today, status: 'checked-in' } }),
      Booking.count({ where: { mandiId, date: today, status: 'confirmed' } }),
      Booking.count({ where: { mandiId, date: today, status: 'pending' } }),
    ]);

    const activeFarmers = await Booking.count({ where: { mandiId }, distinct: true, col: 'farmerId' });

    // Top crops today
    const topCrops = await Booking.findAll({
      where: { mandiId, date: today },
      attributes: ['cropType', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('estimatedQuantity')), 'totalQty']],
      group: ['cropType'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 5,
      raw: true,
    });

    const recentBookings = await Booking.findAll({
      where: { mandiId, date: today },
      include: [{ model: User, as: 'farmer', attributes: ['id', 'name', 'phone'] }],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    const wheatPrice = await CropPrice.findOne({ where: { mandiId, crop: 'Wheat' } });

    // Available slots today
    const slots = await TimeSlot.findAll({ where: { mandiId, date: today, isActive: true } });
    const availableSlots = slots.reduce((sum, s) => sum + Math.max(0, s.capacity - s.bookedCount), 0);

    res.json({
      success: true,
      data: {
        stats: {
          todayBookings,
          activeFarmers,
          avgWheatPrice: wheatPrice?.currentPrice || 0,
          availableSlots,
        },
        todayCheckedIn,
        totalConfirmed,
        totalPending,
        topCrops: topCrops.map((c) => ({ crop: c.cropType, count: parseInt(c.count), totalQty: parseFloat(c.totalQty || 0) })),
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Admin Dashboard Stats ──────────────────────────────────────────────────────
// GET /api/dashboard/admin
router.get('/admin', protect, authorize('admin'), async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [totalMandis, activeMandis, totalFarmers, totalManagers, totalBookingsToday, openIssues] = await Promise.all([
      Mandi.count(),
      Mandi.count({ where: { isActive: true } }),
      User.count({ where: { role: 'farmer' } }),
      User.count({ where: { role: 'manager' } }),
      Booking.count({ where: { date: today } }),
      Issue.count({ where: { status: { [Op.in]: ['open', 'in-progress'] } } }),
    ]);

    // Monthly bookings
    const monthlyBookings = await Booking.findAll({
      attributes: [
        [fn('SUBSTRING', col('date'), 1, 7), 'month'],
        [fn('COUNT', col('id')), 'bookings'],
        [fn('COUNT', fn('DISTINCT', col('farmerId'))), 'farmers'],
      ],
      group: [literal("SUBSTRING(\"date\"::text, 1, 7)")],
      order: [[literal("SUBSTRING(\"date\"::text, 1, 7)"), 'ASC']],
      limit: 6,
      raw: true,
    });

    // Top mandis by bookings
    const topMandis = await Booking.findAll({
      attributes: [
        'mandiId',
        [fn('COUNT', col('Booking.id')), 'bookings'],
        [fn('COUNT', fn('DISTINCT', col('farmerId'))), 'farmers'],
      ],
      include: [{ model: Mandi, as: 'mandi', attributes: ['name', 'city', 'state'] }],
      group: ['mandiId', 'mandi.id'],
      order: [[fn('COUNT', col('Booking.id')), 'DESC']],
      limit: 5,
      raw: true,
      nest: true,
    });

    // Avg crop price
    const avgPriceResult = await CropPrice.findOne({
      attributes: [[fn('AVG', col('currentPrice')), 'avg']],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalMandis,
          activeMandis,
          totalFarmers,
          totalManagers,
          totalBookingsToday,
          openIssues,
          avgCropPrice: avgPriceResult?.avg ? Math.round(parseFloat(avgPriceResult.avg)) : 0,
        },
        monthlyBookings: monthlyBookings.map((m) => ({
          month: m.month,
          bookings: parseInt(m.bookings),
          farmers: parseInt(m.farmers),
        })),
        topMandis: topMandis.map((t) => ({
          name: t.mandi?.name,
          city: t.mandi?.city,
          state: t.mandi?.state,
          bookings: parseInt(t.bookings),
          farmers: parseInt(t.farmers),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Analytics data (Admin) ─────────────────────────────────────────────────────
// GET /api/dashboard/analytics
router.get('/analytics', protect, authorize('admin'), async (req, res, next) => {
  try {
    // Bookings by state via Mandi join
    const byState = await sequelize.query(`
      SELECT m.state, COUNT(DISTINCT m.id) as mandis, COUNT(b.id) as bookings
      FROM mandis m
      LEFT JOIN bookings b ON b."mandiId" = m.id
      GROUP BY m.state
      ORDER BY bookings DESC
      LIMIT 10
    `, { type: QueryTypes.SELECT });

    // Platform utilization
    const utilResult = await TimeSlot.findOne({
      where: { isActive: true },
      attributes: [[fn('SUM', col('capacity')), 'total'], [fn('SUM', col('bookedCount')), 'booked']],
      raw: true,
    });

    const util = utilResult?.total > 0
      ? ((utilResult.booked / utilResult.total) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        byState: byState.map((s) => ({ state: s.state, mandis: parseInt(s.mandis), bookings: parseInt(s.bookings) })),
        platformUtilization: parseFloat(util),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Manager Reports (weekly data) ──────────────────────────────────────────────
// GET /api/dashboard/manager/reports
router.get('/manager/reports', protect, authorize('manager'), async (req, res, next) => {
  try {
    const mandiId = req.user.mandiId;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const weeklyData = await Promise.all(
      days.map(async (date) => {
        const [bookings, checkins] = await Promise.all([
          Booking.count({ where: { mandiId, date } }),
          Booking.count({ where: { mandiId, date, status: { [Op.in]: ['checked-in', 'completed'] } } }),
        ]);
        const dayName = new Date(date).toLocaleDateString('en', { weekday: 'short' });
        return { day: dayName, date, bookings, checkins };
      })
    );

    const weekStart = days[0];
    const topCrops = await Booking.findAll({
      where: { mandiId, date: { [Op.gte]: weekStart } },
      attributes: ['cropType', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('estimatedQuantity')), 'totalQty']],
      group: ['cropType'],
      order: [[fn('SUM', col('estimatedQuantity')), 'DESC']],
      limit: 6,
      raw: true,
    });

    const totalBookings = weeklyData.reduce((s, d) => s + d.bookings, 0);
    const totalCheckins = weeklyData.reduce((s, d) => s + d.checkins, 0);
    const checkinRate = totalBookings > 0 ? ((totalCheckins / totalBookings) * 100).toFixed(1) : 0;

    const uniqueFarmers = await Booking.count({
      where: { mandiId, date: { [Op.gte]: weekStart } },
      distinct: true,
      col: 'farmerId',
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalBookings,
          uniqueFarmers,
          checkinRate: parseFloat(checkinRate),
        },
        weeklyData,
        topCrops: topCrops.map((c) => ({
          crop: c.cropType,
          count: parseInt(c.count),
          totalQty: parseFloat(c.totalQty || 0),
          share: totalBookings > 0 ? Math.round((parseInt(c.count) / totalBookings) * 100) : 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Admin Reports (summary stats) ──────────────────────────────────────────────
// GET /api/dashboard/admin/reports
router.get('/admin/reports', protect, authorize('admin'), async (req, res, next) => {
  try {
    const [totalBookings, totalFarmers, activeMandis] = await Promise.all([
      Booking.count(),
      User.count({ where: { role: 'farmer' } }),
      Mandi.count({ where: { isActive: true } }),
    ]);

    res.json({
      success: true,
      data: {
        platformBookings: totalBookings,
        totalFarmers,
        activeMandis,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
