const express = require('express');
const router = express.Router();
const { Op, fn, col, literal, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { User, Booking, Mandi, CropPrice, CropCatalog, Issue, TimeSlot, AuditLog } = require('../models');
const { protect, authorize } = require('../middleware/auth');

const weekdayForDate = (dateString) => new Date(`${dateString}T00:00:00Z`).toLocaleDateString('en-US', {
  weekday: 'long',
  timeZone: 'UTC',
}).toLowerCase();

const summarizeSlotUtilization = (slots) => {
  const totalCapacity = slots.reduce((sum, slot) => sum + slot.capacity, 0);
  const totalBooked = slots.reduce((sum, slot) => sum + slot.bookedCount, 0);
  const availableSlots = Math.max(0, totalCapacity - totalBooked);

  return {
    totalSlots: slots.length,
    totalCapacity,
    totalBooked,
    availableSlots,
    utilization: totalCapacity > 0 ? Number(((totalBooked / totalCapacity) * 100).toFixed(1)) : 0,
  };
};

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
    if (!mandiId) {
      return res.status(400).json({ success: false, message: 'Manager is not assigned to any mandi' });
    }

    const today = new Date().toISOString().split('T')[0];
    const weekday = weekdayForDate(today);

    const [mandi, todayBookings, todayCheckedIn, totalConfirmed, totalPending, totalCompleted, totalCancelled] = await Promise.all([
      Mandi.findByPk(mandiId),
      Booking.count({ where: { mandiId, date: today } }),
      Booking.count({ where: { mandiId, date: today, status: 'checked-in' } }),
      Booking.count({ where: { mandiId, date: today, status: 'confirmed' } }),
      Booking.count({ where: { mandiId, date: today, status: 'pending' } }),
      Booking.count({ where: { mandiId, date: today, status: 'completed' } }),
      Booking.count({ where: { mandiId, date: today, status: 'cancelled' } }),
    ]);

    if (!mandi) {
      return res.status(404).json({ success: false, message: 'Assigned mandi not found' });
    }

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

    const [wheatPrice, slots, prices, managerCount, openIssues, catalogEntries] = await Promise.all([
      CropPrice.findOne({ where: { mandiId, crop: 'Wheat' } }),
      TimeSlot.findAll({ where: { mandiId, date: today }, order: [['startTime', 'ASC']] }),
      CropPrice.findAll({ where: { mandiId }, order: [['crop', 'ASC']] }),
      User.count({ where: { role: 'manager', mandiId } }),
      Issue.count({ where: { mandiId, status: { [Op.in]: ['open', 'in-progress'] } } }),
      CropCatalog.findAll({ where: { isActive: true }, attributes: ['crop', 'minPrice'] }),
    ]);

    const slotSummary = summarizeSlotUtilization(slots.filter((slot) => slot.isActive));
    const workingToday = (mandi.workingDays || []).includes(weekday) && !(mandi.holidays || []).includes(today);
    const catalogMap = new Map(catalogEntries.map((entry) => [String(entry.crop).toLowerCase(), entry]));
    const priceSummary = prices.reduce((summary, price) => {
      const catalogEntry = catalogMap.get(String(price.crop).toLowerCase());
      if (!catalogEntry) {
        summary.missingCatalogCount += 1;
      }
      const minPrice = catalogEntry?.minPrice ?? price.minPrice;
      if (minPrice !== undefined && minPrice !== null && price.currentPrice < minPrice) {
        summary.outOfRangeCount += 1;
      }
      summary.totalPrice += price.currentPrice;
      return summary;
    }, { totalPrice: 0, outOfRangeCount: 0, missingCatalogCount: 0 });

    const alerts = [];
    if (!workingToday) {
      alerts.push({ type: 'warning', message: 'This mandi is marked closed today based on its configured working days/holidays.' });
    }
    if (slotSummary.availableSlots === 0 && slotSummary.totalSlots > 0) {
      alerts.push({ type: 'warning', message: 'All active slots are fully booked for today.' });
    }
    if (priceSummary.outOfRangeCount > 0) {
      alerts.push({ type: 'warning', message: `${priceSummary.outOfRangeCount} mandi crop prices are below admin-defined minimum baselines.` });
    }
    if (openIssues > 0) {
      alerts.push({ type: 'info', message: `${openIssues} issue(s) are currently open for this mandi.` });
    }

    res.json({
      success: true,
      data: {
        stats: {
          todayBookings,
          activeFarmers,
          avgWheatPrice: wheatPrice?.currentPrice || 0,
          avgCropPrice: prices.length > 0 ? Math.round(priceSummary.totalPrice / prices.length) : 0,
          availableSlots: slotSummary.availableSlots,
          managerCount,
          openIssues,
        },
        mandiInfo: {
          id: mandi.id,
          name: mandi.name,
          city: mandi.city,
          district: mandi.district,
          state: mandi.state,
          crops: mandi.crops,
          operatingHoursOpen: mandi.operatingHoursOpen,
          operatingHoursClose: mandi.operatingHoursClose,
          workingDays: mandi.workingDays,
          workingToday,
          managerCount,
        },
        todayBreakdown: {
          checkedIn: todayCheckedIn,
          confirmed: totalConfirmed,
          pending: totalPending,
          completed: totalCompleted,
          cancelled: totalCancelled,
        },
        slotSummary,
        priceSummary: {
          totalCrops: prices.length,
          avgPrice: prices.length > 0 ? Math.round(priceSummary.totalPrice / prices.length) : 0,
          outOfRangeCount: priceSummary.outOfRangeCount,
          missingCatalogCount: priceSummary.missingCatalogCount,
        },
        topCrops: topCrops.map((c) => ({ crop: c.cropType, count: parseInt(c.count), totalQty: parseFloat(c.totalQty || 0) })),
        recentBookings,
        alerts,
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

    const [totalMandis, activeMandis, totalFarmers, totalManagers, totalBookingsToday, openIssues, totalCatalogCrops] = await Promise.all([
      Mandi.count(),
      Mandi.count({ where: { isActive: true } }),
      User.count({ where: { role: 'farmer' } }),
      User.count({ where: { role: 'manager' } }),
      Booking.count({ where: { date: today } }),
      Issue.count({ where: { status: { [Op.in]: ['open', 'in-progress'] } } }),
      CropCatalog.count(),
    ]);

    // Monthly bookings
    const monthBucketExpression = `TO_CHAR("date", 'YYYY-MM')`;
    const monthlyBookings = await Booking.findAll({
      attributes: [
        [literal(monthBucketExpression), 'month'],
        [fn('COUNT', col('id')), 'bookings'],
        [fn('COUNT', fn('DISTINCT', col('farmerId'))), 'farmers'],
      ],
      group: [literal(monthBucketExpression)],
      order: [[literal(monthBucketExpression), 'ASC']],
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

    const [recentActivity, mandis, prices] = await Promise.all([
      AuditLog.findAll({
        order: [['createdAt', 'DESC']],
        limit: 8,
        attributes: ['id', 'action', 'entity', 'details', 'type', 'createdAt', 'userName', 'userRole'],
      }),
      Mandi.findAll({ order: [['name', 'ASC']] }),
      CropPrice.findAll({ attributes: ['mandiId', 'crop', 'currentPrice', 'minPrice'] }),
    ]);

    const managerCounts = await User.findAll({
      where: { role: 'manager' },
      attributes: ['mandiId', [fn('COUNT', col('id')), 'count']],
      group: ['mandiId'],
      raw: true,
    });
    const managerCountMap = new Map(managerCounts.map((item) => [item.mandiId, parseInt(item.count)]));

    const pricesByMandi = prices.reduce((map, price) => {
      const mandiPrices = map.get(price.mandiId) || [];
      mandiPrices.push(price);
      map.set(price.mandiId, mandiPrices);
      return map;
    }, new Map());

    const mandiHealth = mandis.map((mandi) => {
      const mandiPrices = pricesByMandi.get(mandi.id) || [];
      const outOfRangeCount = mandiPrices.filter((price) => {
        if (price.minPrice === null || price.minPrice === undefined) return false;
        return price.currentPrice < price.minPrice;
      }).length;

      return {
        id: mandi.id,
        name: mandi.name,
        city: mandi.city,
        state: mandi.state,
        isActive: mandi.isActive,
        managerCount: managerCountMap.get(mandi.id) || 0,
        configuredCrops: mandi.crops.length,
        workingDays: mandi.workingDays,
        outOfRangePrices: outOfRangeCount,
      };
    });

    const compliance = {
      mandisWithoutManagers: mandiHealth.filter((mandi) => mandi.managerCount === 0).length,
      mandisAtManagerLimit: mandiHealth.filter((mandi) => mandi.managerCount >= 3).length,
      mandisMissingPrices: mandiHealth.filter((mandi) => mandi.configuredCrops > 0 && !pricesByMandi.get(mandi.id)?.length).length,
      mandisWithOutOfRangePrices: mandiHealth.filter((mandi) => mandi.outOfRangePrices > 0).length,
    };

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
          totalCatalogCrops,
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
        recentActivity,
        mandiHealth,
        compliance,
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
    if (!mandiId) {
      return res.status(400).json({ success: false, message: 'Manager is not assigned to any mandi' });
    }

    const mandi = await Mandi.findByPk(mandiId);
    if (!mandi) {
      return res.status(404).json({ success: false, message: 'Assigned mandi not found' });
    }

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
    const [topCrops, priceEntries, weeklySlots, openIssues] = await Promise.all([
      Booking.findAll({
        where: { mandiId, date: { [Op.gte]: weekStart } },
        attributes: ['cropType', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('estimatedQuantity')), 'totalQty']],
        group: ['cropType'],
        order: [[fn('SUM', col('estimatedQuantity')), 'DESC']],
        limit: 6,
        raw: true,
      }),
      CropPrice.findAll({ where: { mandiId }, order: [['crop', 'ASC']] }),
      TimeSlot.findAll({ where: { mandiId, date: { [Op.gte]: weekStart } } }),
      Issue.count({ where: { mandiId, status: { [Op.in]: ['open', 'in-progress'] } } }),
    ]);

    const totalBookings = weeklyData.reduce((s, d) => s + d.bookings, 0);
    const totalCheckins = weeklyData.reduce((s, d) => s + d.checkins, 0);
    const checkinRate = totalBookings > 0 ? ((totalCheckins / totalBookings) * 100).toFixed(1) : 0;

    const uniqueFarmers = await Booking.count({
      where: { mandiId, date: { [Op.gte]: weekStart } },
      distinct: true,
      col: 'farmerId',
    });

    const slotSummary = summarizeSlotUtilization(weeklySlots.filter((slot) => slot.isActive));

    res.json({
      success: true,
      data: {
        summary: {
          totalBookings,
          uniqueFarmers,
          checkinRate: parseFloat(checkinRate),
          openIssues,
        },
        mandiInfo: {
          id: mandi.id,
          name: mandi.name,
          city: mandi.city,
          state: mandi.state,
          operatingHoursOpen: mandi.operatingHoursOpen,
          operatingHoursClose: mandi.operatingHoursClose,
          workingDays: mandi.workingDays,
        },
        slotSummary,
        priceSummary: {
          totalCrops: priceEntries.length,
          avgPrice: priceEntries.length > 0 ? Math.round(priceEntries.reduce((sum, price) => sum + price.currentPrice, 0) / priceEntries.length) : 0,
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
    const [totalBookings, totalFarmers, activeMandis, totalManagers, openIssues, totalCatalogCrops] = await Promise.all([
      Booking.count(),
      User.count({ where: { role: 'farmer' } }),
      Mandi.count({ where: { isActive: true } }),
      User.count({ where: { role: 'manager' } }),
      Issue.count({ where: { status: { [Op.in]: ['open', 'in-progress'] } } }),
      CropCatalog.count(),
    ]);

    const [bookingStatusBreakdown, managerDistribution, cropCoverage, recentActivity] = await Promise.all([
      Booking.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      User.findAll({
        where: { role: 'manager' },
        attributes: ['mandiId', [fn('COUNT', col('id')), 'count']],
        group: ['mandiId'],
        raw: true,
      }),
      sequelize.query(`
        SELECT m.id, m.name, m.city, m.state,
               COUNT(cp.id) AS price_count,
               COUNT(DISTINCT u.id) AS manager_count
        FROM mandis m
        LEFT JOIN crop_prices cp ON cp."mandiId" = m.id
        LEFT JOIN users u ON u."mandiId" = m.id AND u.role = 'manager'
        GROUP BY m.id, m.name, m.city, m.state
        ORDER BY m.name ASC
      `, { type: QueryTypes.SELECT }),
      AuditLog.findAll({
        order: [['createdAt', 'DESC']],
        limit: 10,
        attributes: ['id', 'action', 'entity', 'details', 'type', 'createdAt', 'userName', 'userRole'],
      }),
    ]);

    res.json({
      success: true,
      data: {
        platformSummary: {
          platformBookings: totalBookings,
          totalFarmers,
          activeMandis,
          totalManagers,
          openIssues,
          totalCatalogCrops,
        },
        totalFarmers,
        activeMandis,
        totalManagers,
        openIssues,
        bookingStatusBreakdown: bookingStatusBreakdown.map((entry) => ({ status: entry.status, count: parseInt(entry.count) })),
        managerDistribution: managerDistribution.map((entry) => ({ mandiId: entry.mandiId, managerCount: parseInt(entry.count) })),
        cropCoverage: cropCoverage.map((entry) => ({
          id: entry.id,
          name: entry.name,
          city: entry.city,
          state: entry.state,
          priceCount: parseInt(entry.price_count),
          managerCount: parseInt(entry.manager_count),
        })),
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
