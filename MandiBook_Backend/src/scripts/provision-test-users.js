require('dotenv').config();

const { sequelize } = require('../config/db');
const { User, Mandi, CropCatalog, CropPrice } = require('../models');
const { Op } = require('sequelize');

const TEST_ADMIN = {
  name: 'MandiBook Admin',
  role: 'admin',
  email: 'mandibook.admin@gmail.com',
  password: 'admin123',
  language: 'en',
  department: 'Platform Operations',
  twoFactorEnabled: true,
  profileComplete: true,
  status: 'active',
};

const TEST_MANAGERS = [
  {
    name: 'Arpit Singh',
    role: 'manager',
    email: 'arpit2005singh@gmail.com',
    password: 'arpit123',
    phone: '9555000001',
    language: 'en',
    designation: 'Mandi Manager',
    profileComplete: true,
    status: 'active',
  },
  {
    name: 'Deependra Sastiya',
    role: 'manager',
    email: 'deependrasastiya17@gmail.com',
    password: 'deependra123',
    phone: '9555000002',
    language: 'en',
    designation: 'Assistant Mandi Manager',
    profileComplete: true,
    status: 'active',
  },
];

const TEST_FARMER = {
  name: 'Arpit Farmer',
  role: 'farmer',
  email: 'arpit@compliledger.com',
  phone: '9444444444',
  language: 'en',
  village: 'Test Village',
  district: 'Indore',
  state: 'Madhya Pradesh',
  pincode: '452001',
  landHolding: 3.5,
  farmSize: 'Medium (2-10 acres)',
  crops: ['Wheat', 'Rice'],
  preferredMandis: [],
  profileComplete: true,
  status: 'active',
};

const INDORE_MANDIS = [
  {
    code: 'IND-CHHAWNI-452001',
    name: 'Indore mandi',
    nameHi: 'इंदौर मंडी',
    address: 'Chhawni',
    city: 'Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452001',
    lat: 22.7196,
    lng: 75.8577,
    contactPhone: '07312550001',
    operatingHoursOpen: '05:00',
    operatingHoursClose: '18:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    managerEmail: 'arpit2005singh@gmail.com',
    managerDesignation: 'Lead Mandi Manager',
    prices: [
      {
        crop: 'Wheat',
        currentPrice: 2450,
        prevPrice: 2380,
      },
      {
        crop: 'Soybean',
        currentPrice: 4680,
        prevPrice: 4590,
      },
      {
        crop: 'Onion',
        currentPrice: 1880,
        prevPrice: 1810,
      },
    ],
  },
  {
    code: 'IND-CHOITHRAM-452014',
    name: 'Mandi indore',
    nameHi: 'मंडी इंदौर',
    address: '263, Sabji Mandi, Choithram Mandi',
    city: 'Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452014',
    lat: 22.6915,
    lng: 75.8278,
    contactPhone: '07312550002',
    operatingHoursOpen: '05:00',
    operatingHoursClose: '18:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    managerEmail: 'deependrasastiya17@gmail.com',
    managerDesignation: 'Mandi Operations Manager',
    prices: [
      {
        crop: 'Wheat',
        currentPrice: 2390,
        prevPrice: 2320,
      },
      {
        crop: 'Potato',
        currentPrice: 1320,
        prevPrice: 1260,
      },
      {
        crop: 'Garlic',
        currentPrice: 6180,
        prevPrice: 6075,
      },
      {
        crop: 'Onion',
        currentPrice: 1760,
        prevPrice: 1690,
      },
    ],
  },
];

const CROP_BASELINES = [
  {
    crop: 'Wheat',
    cropHi: 'गेहूं',
    category: 'cereal',
    unit: 'quintal',
    minPrice: 2200,
  },
  {
    crop: 'Soybean',
    cropHi: 'सोयाबीन',
    category: 'oilseed',
    unit: 'quintal',
    minPrice: 4200,
  },
  {
    crop: 'Onion',
    cropHi: 'प्याज़',
    category: 'vegetable',
    unit: 'quintal',
    minPrice: 1600,
  },
  {
    crop: 'Potato',
    cropHi: 'आलू',
    category: 'vegetable',
    unit: 'quintal',
    minPrice: 1100,
  },
  {
    crop: 'Garlic',
    cropHi: 'लहसुन',
    category: 'spice',
    unit: 'quintal',
    minPrice: 5200,
  },
];

const normalizeEmail = (email) => String(email).trim().toLowerCase();

async function syncMandiManagerLinks(mandiId) {
  if (!mandiId) return;

  const mandi = await Mandi.findByPk(mandiId);
  if (!mandi) return;

  const managers = await User.findAll({
    where: { role: 'manager', mandiId },
    order: [['createdAt', 'ASC']],
  });

  const managerIds = managers.map((manager) => manager.id).slice(0, 3);
  await mandi.update({
    managerIds,
    managerId: managerIds[0] || null,
  });
}

async function upsertUser({ role, email, ...payload }) {
  const normalizedEmail = normalizeEmail(email);
  let user = await User.scope('withPassword').findOne({ where: { role, email: normalizedEmail } });

  if (!user) {
    user = await User.create({
      ...payload,
      role,
      email: normalizedEmail,
    });
    return { user, created: true };
  }

  user.set({
    ...payload,
    role,
    email: normalizedEmail,
  });
  await user.save();
  return { user, created: false };
}

async function upsertMandi(payload) {
  let mandi = await Mandi.findOne({ where: { code: payload.code } });

  if (!mandi) {
    mandi = await Mandi.create({
      ...payload,
      managerIds: [],
      managerId: null,
      holidays: [],
      isActive: true,
      rating: 0,
      crops: payload.prices.map((entry) => entry.crop),
    });
    return { mandi, created: true };
  }

  await mandi.update({
    name: payload.name,
    nameHi: payload.nameHi,
    address: payload.address,
    city: payload.city,
    district: payload.district,
    state: payload.state,
    pincode: payload.pincode,
    lat: payload.lat,
    lng: payload.lng,
    contactPhone: payload.contactPhone,
    operatingHoursOpen: payload.operatingHoursOpen,
    operatingHoursClose: payload.operatingHoursClose,
    workingDays: payload.workingDays,
    isActive: true,
    crops: Array.from(new Set([...(mandi.crops || []), ...payload.prices.map((entry) => entry.crop)])),
  });

  return { mandi, created: false };
}

async function upsertCatalogEntry(entry, createdBy) {
  const existing = await CropCatalog.findOne({
    where: {
      crop: { [Op.iLike]: entry.crop },
    },
  });

  if (!existing) {
    const catalogEntry = await CropCatalog.create({
      ...entry,
      maxPrice: null,
      isActive: true,
      createdBy,
    });
    return { catalogEntry, created: true };
  }

  await existing.update({
    crop: entry.crop,
    cropHi: entry.cropHi,
    category: entry.category,
    unit: entry.unit,
    minPrice: entry.minPrice,
    maxPrice: null,
    isActive: true,
    createdBy,
  });

  return { catalogEntry: existing, created: false };
}

async function upsertCropPrice(mandi, priceEntry, updatedBy) {
  const catalogEntry = await CropCatalog.findOne({
    where: {
      crop: { [Op.iLike]: priceEntry.crop },
    },
  });

  const existing = await CropPrice.findOne({
    where: {
      mandiId: mandi.id,
      crop: { [Op.iLike]: priceEntry.crop },
    },
  });

  const payload = {
    crop: catalogEntry?.crop || priceEntry.crop,
    cropHi: catalogEntry?.cropHi || '',
    category: catalogEntry?.category || 'general',
    unit: catalogEntry?.unit || 'quintal',
    mandiId: mandi.id,
    currentPrice: priceEntry.currentPrice,
    prevPrice: priceEntry.prevPrice,
    minPrice: catalogEntry?.minPrice ?? null,
    maxPrice: null,
    updatedBy,
  };

  if (!existing) {
    const createdPrice = await CropPrice.create(payload);
    return { price: createdPrice, created: true };
  }

  await existing.update(payload);
  return { price: existing, created: false };
}

async function pickManagerMandis() {
  const mandis = await Mandi.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']],
  });

  if (mandis.length === 0) {
    throw new Error('No active mandis found. Create at least one mandi before provisioning manager accounts.');
  }

  const preferred = mandis.find((mandi) => mandi.name.toLowerCase().includes('azadpur')) || mandis[0];
  const fallback = mandis.find((mandi) => mandi.id !== preferred.id) || preferred;

  return { preferred, fallback, all: mandis };
}

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const adminResult = await upsertUser(TEST_ADMIN);
    console.log(`${adminResult.created ? 'Created' : 'Updated'} admin: ${adminResult.user.email} / ${TEST_ADMIN.password}`);

    const mandiResults = [];
    for (const mandiPayload of INDORE_MANDIS) {
      const mandiResult = await upsertMandi(mandiPayload);
      mandiResults.push(mandiResult.mandi);
      console.log(`${mandiResult.created ? 'Created' : 'Updated'} mandi: ${mandiResult.mandi.name} (${mandiResult.mandi.code})`);
    }

    for (const catalogEntry of CROP_BASELINES) {
      const result = await upsertCatalogEntry(catalogEntry, adminResult.user.id);
      console.log(`${result.created ? 'Created' : 'Updated'} crop baseline: ${result.catalogEntry.crop} @ min ₹${result.catalogEntry.minPrice}`);
    }

    for (const mandi of mandiResults) {
      for (const priceEntry of INDORE_MANDIS.find((m) => m.code === mandi.code).prices) {
        const result = await upsertCropPrice(mandi, priceEntry, adminResult.user.id);
        console.log(`${result.created ? 'Created' : 'Updated'} crop price: ${result.price.crop} @ ₹${result.price.currentPrice} @ ${mandi.name}`);
      }
    }

    const managerAssignments = [];
    for (const managerPayload of TEST_MANAGERS) {
      const managerResult = await upsertUser(managerPayload);
      const assignedMandiConfig = INDORE_MANDIS.find((mandi) => normalizeEmail(mandi.managerEmail) === managerResult.user.email);
      const assignedMandi = mandiResults.find((mandi) => mandi.code === assignedMandiConfig?.code);
      if (!assignedMandi || !assignedMandiConfig) {
        throw new Error(`Unable to find configured Indore mandi for manager ${managerResult.user.email}`);
      }
      managerResult.user.mandiId = assignedMandi.id;
      managerResult.user.designation = assignedMandiConfig.managerDesignation;
      if (!managerResult.user.managingSince) {
        managerResult.user.managingSince = new Date();
      }
      await managerResult.user.save();
      await syncMandiManagerLinks(assignedMandi.id);
      managerAssignments.push({
        email: managerResult.user.email,
        password: managerPayload.password,
        mandi: assignedMandi.name,
      });
      console.log(`${managerResult.created ? 'Created' : 'Updated'} manager: ${managerResult.user.email} / ${managerPayload.password} -> ${assignedMandi.name}`);
    }

    const farmerPayload = {
      ...TEST_FARMER,
      preferredMandis: mandiResults.map((mandi) => mandi.id),
    };
    const farmerResult = await upsertUser(farmerPayload);
    console.log(`${farmerResult.created ? 'Created' : 'Updated'} farmer: ${farmerResult.user.email} (OTP login, no password endpoint)`);

    console.log('\nProvisioning complete.');
    console.log(`Admin login: ${TEST_ADMIN.email} / ${TEST_ADMIN.password}`);
    managerAssignments.forEach((assignment) => {
      console.log(`Manager login: ${assignment.email} / ${assignment.password} @ ${assignment.mandi}`);
    });
    console.log(`Farmer OTP email login: ${TEST_FARMER.email}`);

    process.exit(0);
  } catch (error) {
    console.error('\nProvisioning failed:\n', error);
    process.exit(1);
  }
})();
