const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { CropPrice, Mandi, AuditLog } = require('../models');
const { protect, authorize } = require('../middleware/auth');

// ─── Get crop prices (public) ───────────────────────────────────────────────────
// GET /api/prices?mandiId=xxx&crop=xxx&search=xxx
router.get('/', async (req, res, next) => {
  try {
    const { mandiId, crop, search } = req.query;
    const where = {};

    if (mandiId) where.mandiId = mandiId;
    if (crop) where.crop = { [Op.iLike]: `%${crop}%` };
    if (search) where.crop = { [Op.iLike]: `%${search}%` };

    const prices = await CropPrice.findAll({
      where,
      include: [{ model: Mandi, as: 'mandi', attributes: ['id', 'name', 'city'] }],
      order: [['crop', 'ASC']],
    });

    const data = prices.map((p) => {
      const json = p.toJSON();
      json.changePercent = p.getChangePercent();
      json.trend = p.getTrend();
      return json;
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// ─── Get prices grouped by crop (Admin cross-mandi comparison) ──────────────────
// GET /api/prices/overview
router.get('/overview', async (req, res, next) => {
  try {
    const prices = await CropPrice.findAll({
      include: [{ model: Mandi, as: 'mandi', attributes: ['id', 'name', 'city'] }],
      order: [['crop', 'ASC']],
    });

    const grouped = {};
    prices.forEach((p) => {
      if (!grouped[p.crop]) {
        grouped[p.crop] = { crop: p.crop, unit: p.unit, prices: [] };
      }
      grouped[p.crop].prices.push({
        mandiId: p.mandi?.id,
        mandi: p.mandi ? `${p.mandi.name}, ${p.mandi.city}` : 'Unknown',
        price: p.currentPrice,
        prevPrice: p.prevPrice,
        changePercent: p.getChangePercent(),
        trend: p.getTrend(),
      });
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (error) {
    next(error);
  }
});

// ─── Update crop price (Manager) ────────────────────────────────────────────────
// PUT /api/prices/:id
router.put('/:id', protect, authorize('manager'), async (req, res, next) => {
  try {
    const { currentPrice } = req.body;
    if (!currentPrice || currentPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required' });
    }

    const price = await CropPrice.findByPk(req.params.id);
    if (!price) return res.status(404).json({ success: false, message: 'Price entry not found' });

    await price.update({
      prevPrice: price.currentPrice,
      currentPrice,
      updatedBy: req.user.id,
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: 'manager',
      action: `Updated ${price.crop} price to ₹${currentPrice}`,
      entity: 'CropPrice',
      entityId: price.id,
      details: `${price.crop} @ mandiId ${price.mandiId}`,
      type: 'price',
      ipAddress: req.ip,
    });

    const json = price.toJSON();
    json.changePercent = price.getChangePercent();
    json.trend = price.getTrend();
    res.json({ success: true, data: json, message: 'Price updated' });
  } catch (error) {
    next(error);
  }
});

// ─── Create crop price entry (Manager/Admin) ────────────────────────────────────
// POST /api/prices
router.post('/', protect, authorize('manager', 'admin'), async (req, res, next) => {
  try {
    const { crop, mandiId, currentPrice, unit, category, cropHi } = req.body;
    if (!crop || !mandiId || !currentPrice) {
      return res.status(400).json({ success: false, message: 'Crop, mandiId, and currentPrice are required' });
    }

    const existing = await CropPrice.findOne({ where: { crop, mandiId } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Price entry already exists for this crop and mandi' });
    }

    const price = await CropPrice.create({
      crop,
      cropHi: cropHi || '',
      category: category || 'general',
      unit: unit || 'quintal',
      mandiId,
      currentPrice,
      prevPrice: currentPrice,
      updatedBy: req.user.id,
    });

    res.status(201).json({ success: true, data: price, message: 'Price entry created' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
