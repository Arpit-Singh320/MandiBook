const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { CropPrice, CropCatalog, Mandi, AuditLog } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const {
  notifyFarmersAboutPriceChange,
  notifyFarmersAboutPriceRemoval,
  notifyManagersAboutCatalogChange,
  notifyManagersAboutCatalogDeletion,
  notifyManagersAboutAdminPriceChange,
  notifyManagersAboutAdminPriceRemoval,
} = require('../utils/price-notifications');

const normalizeCropName = (value) => String(value).trim();

const findCatalogEntryByCrop = async (crop) => {
  const normalizedCrop = normalizeCropName(crop);
  return CropCatalog.findOne({
    where: {
      crop: { [Op.iLike]: normalizedCrop },
    },
  });
};

const ensurePriceAtOrAboveMinimum = (price, minPrice) => Number(price) >= Number(minPrice);

const formatCatalogBaseline = (minPrice, maxPrice) => maxPrice !== undefined && maxPrice !== null
  ? `min ₹${minPrice}, max ₹${maxPrice}`
  : `min ₹${minPrice}`;

const removeCropFromMandiIfUnused = async (mandiId, crop) => {
  const mandi = await Mandi.findByPk(mandiId);
  if (!mandi) return;

  const remaining = await CropPrice.count({
    where: {
      mandiId,
      crop: { [Op.iLike]: crop },
    },
  });

  if (remaining === 0 && Array.isArray(mandi.crops) && mandi.crops.includes(crop)) {
    await mandi.update({ crops: mandi.crops.filter((entry) => entry !== crop) });
  }
};

// ─── Crop catalog (Admin-managed baselines) ─────────────────────────────────────
// GET /api/prices/catalog
router.get('/catalog', async (req, res, next) => {
  try {
    const { active } = req.query;
    const where = {};
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const crops = await CropCatalog.findAll({ where, order: [['crop', 'ASC']] });
    res.json({ success: true, data: crops });
  } catch (error) {
    next(error);
  }
});

// POST /api/prices/catalog
router.post('/catalog', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { crop, cropHi, category, unit, minPrice, maxPrice, isActive } = req.body;
    if (!crop || minPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Crop and minPrice are required' });
    }

    if (Number(minPrice) < 0) {
      return res.status(400).json({ success: false, message: 'minPrice must be 0 or greater' });
    }
    if (maxPrice !== undefined && maxPrice !== null && Number(maxPrice) <= Number(minPrice)) {
      return res.status(400).json({ success: false, message: 'maxPrice must be greater than minPrice when provided' });
    }

    const existing = await findCatalogEntryByCrop(crop);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Crop already exists in the admin catalog' });
    }

    const catalogEntry = await CropCatalog.create({
      crop: normalizeCropName(crop),
      cropHi: cropHi || '',
      category: category || 'general',
      unit: unit || 'quintal',
      minPrice: Number(minPrice),
      maxPrice: maxPrice !== undefined && maxPrice !== null ? Number(maxPrice) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: req.user.id,
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: 'admin',
      action: 'Created crop catalog entry',
      entity: 'CropCatalog',
      entityId: catalogEntry.id,
      details: `${catalogEntry.crop} (${formatCatalogBaseline(catalogEntry.minPrice, catalogEntry.maxPrice)})`,
      type: 'price',
      ipAddress: req.ip,
    });

    await notifyManagersAboutCatalogChange({
      crop: catalogEntry.crop,
      baselineMinPrice: catalogEntry.minPrice,
      baselineMaxPrice: catalogEntry.maxPrice,
      actionLabel: 'added baseline for',
      actorName: req.user.name,
    });

    res.status(201).json({ success: true, data: catalogEntry, message: 'Crop catalog entry created' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/prices/catalog/:id
router.put('/catalog/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const catalogEntry = await CropCatalog.findByPk(req.params.id);
    if (!catalogEntry) {
      return res.status(404).json({ success: false, message: 'Crop catalog entry not found' });
    }

    const updates = {};
    const allowedFields = ['cropHi', 'category', 'unit', 'isActive'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.crop !== undefined) {
      const normalizedCrop = normalizeCropName(req.body.crop);
      const existing = await findCatalogEntryByCrop(normalizedCrop);
      if (existing && existing.id !== catalogEntry.id) {
        return res.status(400).json({ success: false, message: 'Another crop already exists with this name' });
      }
      updates.crop = normalizedCrop;
    }

    const nextMinPrice = req.body.minPrice !== undefined ? Number(req.body.minPrice) : catalogEntry.minPrice;
    const nextMaxPrice = req.body.maxPrice !== undefined
      ? (req.body.maxPrice === null || req.body.maxPrice === '' ? null : Number(req.body.maxPrice))
      : catalogEntry.maxPrice;
    if (Number(nextMinPrice) < 0) {
      return res.status(400).json({ success: false, message: 'minPrice must be 0 or greater' });
    }
    if (nextMaxPrice !== null && nextMaxPrice !== undefined && Number(nextMaxPrice) <= Number(nextMinPrice)) {
      return res.status(400).json({ success: false, message: 'maxPrice must be greater than minPrice when provided' });
    }
    updates.minPrice = nextMinPrice;
    updates.maxPrice = nextMaxPrice;

    await catalogEntry.update(updates);

    await CropPrice.update({
      minPrice: catalogEntry.minPrice,
      maxPrice: catalogEntry.maxPrice,
      unit: catalogEntry.unit,
      category: catalogEntry.category,
      cropHi: catalogEntry.cropHi,
    }, {
      where: {
        crop: { [Op.iLike]: catalogEntry.crop },
      },
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: 'admin',
      action: 'Updated crop catalog entry',
      entity: 'CropCatalog',
      entityId: catalogEntry.id,
      details: `${catalogEntry.crop} (${formatCatalogBaseline(catalogEntry.minPrice, catalogEntry.maxPrice)})`,
      type: 'price',
      ipAddress: req.ip,
    });

    await notifyManagersAboutCatalogChange({
      crop: catalogEntry.crop,
      baselineMinPrice: catalogEntry.minPrice,
      baselineMaxPrice: catalogEntry.maxPrice,
      actionLabel: 'updated baseline for',
      actorName: req.user.name,
    });

    res.json({ success: true, data: catalogEntry, message: 'Crop catalog entry updated' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/prices/catalog/:id
router.delete('/catalog/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const catalogEntry = await CropCatalog.findByPk(req.params.id);
    if (!catalogEntry) {
      return res.status(404).json({ success: false, message: 'Crop catalog entry not found' });
    }

    const affectedPrices = await CropPrice.findAll({
      where: {
        crop: { [Op.iLike]: catalogEntry.crop },
      },
      include: [{ model: Mandi, as: 'mandi', attributes: ['id', 'name'] }],
    });

    const affectedMandiIds = Array.from(new Set(affectedPrices.map((price) => price.mandiId).filter(Boolean)));

    await CropPrice.destroy({
      where: {
        crop: { [Op.iLike]: catalogEntry.crop },
      },
    });

    for (const mandiId of affectedMandiIds) {
      await removeCropFromMandiIfUnused(mandiId, catalogEntry.crop);
    }

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: 'admin',
      action: 'Deleted crop catalog entry',
      entity: 'CropCatalog',
      entityId: catalogEntry.id,
      details: catalogEntry.crop,
      type: 'price',
      ipAddress: req.ip,
    });

    await catalogEntry.destroy();

    await notifyManagersAboutCatalogDeletion({
      crop: catalogEntry.crop,
      actorName: req.user.name,
    });

    res.json({ success: true, message: 'Crop catalog entry deleted' });
  } catch (error) {
    next(error);
  }
});

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
    const [catalogEntries, prices] = await Promise.all([
      CropCatalog.findAll({ order: [['crop', 'ASC']] }),
      CropPrice.findAll({
        include: [{ model: Mandi, as: 'mandi', attributes: ['id', 'name', 'city'] }],
        order: [['crop', 'ASC']],
      }),
    ]);

    const grouped = {};

    catalogEntries.forEach((entry) => {
      grouped[entry.crop.toLowerCase()] = {
        crop: entry.crop,
        cropHi: entry.cropHi,
        unit: entry.unit,
        category: entry.category,
        minPrice: entry.minPrice,
        maxPrice: entry.maxPrice,
        isActive: entry.isActive,
        prices: [],
      };
    });

    prices.forEach((p) => {
      const key = p.crop.toLowerCase();
      if (!grouped[key]) {
        grouped[key] = {
          crop: p.crop,
          cropHi: p.cropHi,
          unit: p.unit,
          category: p.category,
          minPrice: p.minPrice,
          maxPrice: p.maxPrice,
          isActive: true,
          prices: [],
        };
      }

      grouped[key].prices.push({
        mandiId: p.mandi?.id,
        mandi: p.mandi ? `${p.mandi.name}, ${p.mandi.city}` : 'Unknown',
        price: p.currentPrice,
        prevPrice: p.prevPrice,
        minPrice: p.minPrice,
        maxPrice: p.maxPrice,
        changePercent: p.getChangePercent(),
        trend: p.getTrend(),
      });
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (error) {
    next(error);
  }
});

// ─── Update crop price (Manager/Admin) ───────────────────────────────────────────
// PUT /api/prices/:id
router.put('/:id', protect, authorize('manager', 'admin'), async (req, res, next) => {
  try {
    const { currentPrice } = req.body;
    if (!currentPrice || Number(currentPrice) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required' });
    }

    const price = await CropPrice.findByPk(req.params.id);
    if (!price) return res.status(404).json({ success: false, message: 'Price entry not found' });
    const mandi = await Mandi.findByPk(price.mandiId);
    if (!mandi) return res.status(404).json({ success: false, message: 'Assigned mandi not found' });
    if (req.user.role === 'manager' && (!req.user.mandiId || price.mandiId !== req.user.mandiId)) {
      return res.status(403).json({ success: false, message: 'You can only update prices for your assigned mandi' });
    }

    const catalogEntry = await findCatalogEntryByCrop(price.crop);
    const minPrice = catalogEntry?.minPrice ?? price.minPrice;
    const maxPrice = catalogEntry?.maxPrice ?? price.maxPrice;
    const previousPrice = price.currentPrice;

    if (minPrice !== undefined && minPrice !== null && !ensurePriceAtOrAboveMinimum(currentPrice, minPrice)) {
      return res.status(400).json({ success: false, message: `Price for ${price.crop} must be at least ₹${minPrice}` });
    }

    await price.update({
      prevPrice: price.currentPrice,
      currentPrice: Number(currentPrice),
      minPrice,
      maxPrice,
      unit: catalogEntry?.unit || price.unit,
      category: catalogEntry?.category || price.category,
      cropHi: catalogEntry?.cropHi || price.cropHi,
      updatedBy: req.user.id,
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: `Updated ${price.crop} price to ₹${currentPrice}`,
      entity: 'CropPrice',
      entityId: price.id,
      details: `${price.crop} @ mandiId ${price.mandiId}`,
      type: 'price',
      ipAddress: req.ip,
    });

    await notifyFarmersAboutPriceChange({
      mandi,
      crop: price.crop,
      previousPrice,
      currentPrice: price.currentPrice,
      actorName: req.user.name,
    });

    if (req.user.role === 'admin') {
      await notifyManagersAboutAdminPriceChange({
        mandi,
        crop: price.crop,
        previousPrice,
        currentPrice: price.currentPrice,
        actorName: req.user.name,
      });
    }

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
    const { crop, mandiId, currentPrice } = req.body;
    if (!crop || !mandiId || !currentPrice) {
      return res.status(400).json({ success: false, message: 'Crop, mandiId, and currentPrice are required' });
    }

    if (req.user.role === 'manager') {
      if (!req.user.mandiId || req.user.mandiId !== mandiId) {
        return res.status(403).json({ success: false, message: 'You can only create prices for your assigned mandi' });
      }
    }

    const mandi = await Mandi.findByPk(mandiId);
    if (!mandi) {
      return res.status(404).json({ success: false, message: 'Assigned mandi not found' });
    }

    const catalogEntry = await findCatalogEntryByCrop(crop);
    if (!catalogEntry || !catalogEntry.isActive) {
      return res.status(400).json({ success: false, message: 'Crop must be introduced and activated by admin before mandi pricing can be added' });
    }

    if (!ensurePriceAtOrAboveMinimum(currentPrice, catalogEntry.minPrice)) {
      return res.status(400).json({ success: false, message: `Price for ${catalogEntry.crop} must be at least ₹${catalogEntry.minPrice}` });
    }

    const existing = await CropPrice.findOne({ where: { crop: { [Op.iLike]: catalogEntry.crop }, mandiId } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Price entry already exists for this crop and mandi' });
    }

    const price = await CropPrice.create({
      crop: catalogEntry.crop,
      cropHi: catalogEntry.cropHi || '',
      category: catalogEntry.category || 'general',
      unit: catalogEntry.unit || 'quintal',
      mandiId,
      currentPrice: Number(currentPrice),
      prevPrice: Number(currentPrice),
      minPrice: catalogEntry.minPrice,
      maxPrice: catalogEntry.maxPrice,
      updatedBy: req.user.id,
    });

    if (!mandi.crops.includes(catalogEntry.crop)) {
      await mandi.update({ crops: [...mandi.crops, catalogEntry.crop] });
    }

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: `Created ${catalogEntry.crop} mandi price`,
      entity: 'CropPrice',
      entityId: price.id,
      details: `${catalogEntry.crop} @ mandiId ${mandiId}`,
      type: 'price',
      ipAddress: req.ip,
    });

    await notifyFarmersAboutPriceChange({
      mandi,
      crop: price.crop,
      previousPrice: price.prevPrice,
      currentPrice: price.currentPrice,
      actorName: req.user.name,
    });

    if (req.user.role === 'admin') {
      await notifyManagersAboutAdminPriceChange({
        mandi,
        crop: price.crop,
        previousPrice: price.prevPrice,
        currentPrice: price.currentPrice,
        actorName: req.user.name,
      });
    }

    res.status(201).json({ success: true, data: price, message: 'Price entry created' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/prices/:id
router.delete('/:id', protect, authorize('manager', 'admin'), async (req, res, next) => {
  try {
    const price = await CropPrice.findByPk(req.params.id);
    if (!price) return res.status(404).json({ success: false, message: 'Price entry not found' });

    const mandi = await Mandi.findByPk(price.mandiId);
    if (!mandi) return res.status(404).json({ success: false, message: 'Assigned mandi not found' });

    if (req.user.role === 'manager' && (!req.user.mandiId || req.user.mandiId !== price.mandiId)) {
      return res.status(403).json({ success: false, message: 'You can only delete prices for your assigned mandi' });
    }

    const crop = price.crop;
    const priceId = price.id;

    await price.destroy();
    await removeCropFromMandiIfUnused(mandi.id, crop);

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: `Deleted ${crop} price entry`,
      entity: 'CropPrice',
      entityId: priceId,
      details: `${crop} @ mandiId ${mandi.id}`,
      type: 'price',
      ipAddress: req.ip,
    });

    await notifyFarmersAboutPriceRemoval({
      mandi,
      crop,
      actorName: req.user.name,
    });

    if (req.user.role === 'admin') {
      await notifyManagersAboutAdminPriceRemoval({
        mandi,
        crop,
        actorName: req.user.name,
      });
    }

    res.json({ success: true, message: 'Price entry deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
