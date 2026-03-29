require('dotenv').config();

const { sequelize } = require('../config/db');
const { User, Mandi, TimeSlot, Booking, CropCatalog, CropPrice, Notification, Issue, AuditLog } = require('../models');
const { Op } = require('sequelize');

const TEST_ADMINS = [
  {
    name: 'MandiBook Admin',
    role: 'admin',
    email: 'mandibook.admin@gmail.com',
    password: 'admin123',
    language: 'en',
    department: 'Platform Operations',
    twoFactorEnabled: true,
    profileComplete: true,
    status: 'active',
  },
  {
    name: 'Ayush Yogi',
    role: 'admin',
    email: 'ayushyogi400@gmail.com',
    password: 'ayush123',
    language: 'en',
    department: 'Platform Operations',
    twoFactorEnabled: true,
    profileComplete: true,
    status: 'active',
  },
];

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
  crops: ['Wheat', 'Soybean', 'Onion'],
  preferredMandis: [],
  profileComplete: true,
  status: 'active',
};

const SEEDED_MANDIS = [
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
  {
    code: 'UJN-AGAR-456006',
    name: 'Krishi Upaj Mandi Samiti, Ujjain',
    nameHi: 'कृषि उपज मंडी समिति, उज्जैन',
    address: 'Agar Road, Krishi Upaj Mandi, Ujjain',
    city: 'Ujjain',
    district: 'Ujjain',
    state: 'Madhya Pradesh',
    pincode: '456006',
    lat: 23.1896,
    lng: 75.8011,
    contactPhone: '07342550001',
    operatingHoursOpen: '05:00',
    operatingHoursClose: '18:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    prices: [
      {
        crop: 'Wheat',
        currentPrice: 2430,
        prevPrice: 2360,
      },
      {
        crop: 'Soybean',
        currentPrice: 4610,
        prevPrice: 4540,
      },
      {
        crop: 'Onion',
        currentPrice: 1820,
        prevPrice: 1780,
      },
      {
        crop: 'Potato',
        currentPrice: 1280,
        prevPrice: 1230,
      },
    ],
  },
  {
    code: 'MHD-456443',
    name: 'Krishi Upaj Mandi, Mahidpur',
    nameHi: 'कृषि उपज मंडी, महिदपुर',
    address: 'Mahidpur, Ujjain District, Madhya Pradesh',
    city: 'Mahidpur',
    district: 'Ujjain',
    state: 'Madhya Pradesh',
    pincode: '456443',
    lat: 23.4878,
    lng: 75.6565,
    contactPhone: '07355550001',
    operatingHoursOpen: '05:00',
    operatingHoursClose: '18:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    prices: [
      {
        crop: 'Wheat',
        currentPrice: 2370,
        prevPrice: 2310,
      },
      {
        crop: 'Soybean',
        currentPrice: 4520,
        prevPrice: 4460,
      },
      {
        crop: 'Garlic',
        currentPrice: 6020,
        prevPrice: 5940,
      },
      {
        crop: 'Onion',
        currentPrice: 1710,
        prevPrice: 1660,
      },
    ],
  },
  {
    code: 'DWS-MAKSI-455001',
    name: 'Krishi Upaj Mandi Samiti, Dewas',
    nameHi: 'कृषि उपज मंडी समिति, देवास',
    address: 'Maksi Road, Anaj Mandi (Near Shivom Toll Kata), Dewas',
    city: 'Dewas',
    district: 'Dewas',
    state: 'Madhya Pradesh',
    pincode: '455001',
    lat: 22.9717,
    lng: 76.0587,
    contactPhone: '07272550001',
    operatingHoursOpen: '05:00',
    operatingHoursClose: '18:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    prices: [
      {
        crop: 'Wheat',
        currentPrice: 2410,
        prevPrice: 2350,
      },
      {
        crop: 'Soybean',
        currentPrice: 4660,
        prevPrice: 4580,
      },
      {
        crop: 'Potato',
        currentPrice: 1290,
        prevPrice: 1250,
      },
      {
        crop: 'Onion',
        currentPrice: 1790,
        prevPrice: 1720,
      },
    ],
  },
  {
    code: 'DHR-JETAPUR-454001',
    name: 'Krishi Upaj Mandi, Dhar',
    nameHi: 'कृषि उपज मंडी, धार',
    address: 'Navin Mandi Jetapur, Dhar',
    city: 'Dhar',
    district: 'Dhar',
    state: 'Madhya Pradesh',
    pincode: '454001',
    lat: 22.6013,
    lng: 75.3025,
    contactPhone: '07292550001',
    operatingHoursOpen: '05:00',
    operatingHoursClose: '18:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    prices: [
      {
        crop: 'Wheat',
        currentPrice: 2380,
        prevPrice: 2325,
      },
      {
        crop: 'Soybean',
        currentPrice: 4590,
        prevPrice: 4510,
      },
      {
        crop: 'Garlic',
        currentPrice: 6110,
        prevPrice: 6040,
      },
      {
        crop: 'Onion',
        currentPrice: 1740,
        prevPrice: 1695,
      },
    ],
  },
  {
    code: 'BDN-454660',
    name: 'Krishi Upaj Mandi, Badnawar',
    nameHi: 'कृषि उपज मंडी, बदनावर',
    address: 'Badnawar, District Dhar, Madhya Pradesh',
    city: 'Badnawar',
    district: 'Dhar',
    state: 'Madhya Pradesh',
    pincode: '454660',
    lat: 23.0217,
    lng: 75.2327,
    contactPhone: '07295550001',
    operatingHoursOpen: '05:00',
    operatingHoursClose: '18:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    prices: [
      {
        crop: 'Wheat',
        currentPrice: 2360,
        prevPrice: 2300,
      },
      {
        crop: 'Soybean',
        currentPrice: 4550,
        prevPrice: 4480,
      },
      {
        crop: 'Potato',
        currentPrice: 1260,
        prevPrice: 1215,
      },
      {
        crop: 'Garlic',
        currentPrice: 5980,
        prevPrice: 5900,
      },
    ],
  },
];

const CROP_BASELINES = [
  { crop: 'Soybean', cropHi: 'सोयाबीन', category: 'oilseed', unit: 'quintal', minPrice: 4200 },
  { crop: 'Mustard', cropHi: 'सरसों', category: 'oilseed', unit: 'quintal', minPrice: 5100 },
  { crop: 'Groundnut', cropHi: 'मूंगफली', category: 'oilseed', unit: 'quintal', minPrice: 4700 },
  { crop: 'Linseed', cropHi: 'अलसी', category: 'oilseed', unit: 'quintal', minPrice: 5600 },
  { crop: 'Sunflower', cropHi: 'सूरजमुखी', category: 'oilseed', unit: 'quintal', minPrice: 4700 },
  { crop: 'Safflower', cropHi: 'कुसुम', category: 'oilseed', unit: 'quintal', minPrice: 4500 },
  { crop: 'Sesame', cropHi: 'तिल', category: 'oilseed', unit: 'quintal', minPrice: 7600 },
  { crop: 'Castor Seed', cropHi: 'अरंडी', category: 'oilseed', unit: 'quintal', minPrice: 5600 },
  { crop: 'Niger Seed', cropHi: 'रामतिल', category: 'oilseed', unit: 'quintal', minPrice: 6200 },
  { crop: 'Wheat', cropHi: 'गेहूं', category: 'cereal', unit: 'quintal', minPrice: 2200 },
  { crop: 'Sharbati Wheat', cropHi: 'शरबती गेहूं', category: 'cereal', unit: 'quintal', minPrice: 2850 },
  { crop: 'Rice (Paddy)', cropHi: 'धान', category: 'cereal', unit: 'quintal', minPrice: 2100 },
  { crop: 'Basmati Rice', cropHi: 'बासमती धान', category: 'cereal', unit: 'quintal', minPrice: 3200 },
  { crop: 'Maize', cropHi: 'मक्का', category: 'cereal', unit: 'quintal', minPrice: 1800 },
  { crop: 'Jowar', cropHi: 'ज्वार', category: 'cereal', unit: 'quintal', minPrice: 2500 },
  { crop: 'Bajra', cropHi: 'बाजरा', category: 'cereal', unit: 'quintal', minPrice: 2300 },
  { crop: 'Barley', cropHi: 'जौ', category: 'cereal', unit: 'quintal', minPrice: 1900 },
  { crop: 'Oats', cropHi: 'ओट्स', category: 'cereal', unit: 'quintal', minPrice: 2100 },
  { crop: 'Kodo Millet', cropHi: 'कोदो', category: 'millet', unit: 'quintal', minPrice: 2600 },
  { crop: 'Kutki Millet', cropHi: 'कुटकी', category: 'millet', unit: 'quintal', minPrice: 2800 },
  { crop: 'Ragi', cropHi: 'रागी', category: 'millet', unit: 'quintal', minPrice: 2900 },
  { crop: 'Gram', cropHi: 'चना', category: 'pulse', unit: 'quintal', minPrice: 4800 },
  { crop: 'Kabuli Chana', cropHi: 'काबुली चना', category: 'pulse', unit: 'quintal', minPrice: 6100 },
  { crop: 'Tur (Arhar)', cropHi: 'तुअर अरहर', category: 'pulse', unit: 'quintal', minPrice: 6200 },
  { crop: 'Urad', cropHi: 'उड़द', category: 'pulse', unit: 'quintal', minPrice: 6200 },
  { crop: 'Moong', cropHi: 'मूंग', category: 'pulse', unit: 'quintal', minPrice: 6400 },
  { crop: 'Masoor', cropHi: 'मसूर', category: 'pulse', unit: 'quintal', minPrice: 5600 },
  { crop: 'Field Pea', cropHi: 'मटर दाना', category: 'pulse', unit: 'quintal', minPrice: 3600 },
  { crop: 'Green Peas', cropHi: 'हरी मटर', category: 'pulse', unit: 'quintal', minPrice: 2800 },
  { crop: 'Lathyrus', cropHi: 'खेसारी', category: 'pulse', unit: 'quintal', minPrice: 3400 },
  { crop: 'Cotton', cropHi: 'कपास', category: 'cash_crop', unit: 'quintal', minPrice: 6800 },
  { crop: 'Sugarcane', cropHi: 'गन्ना', category: 'cash_crop', unit: 'quintal', minPrice: 320 },
  { crop: 'Garlic', cropHi: 'लहसुन', category: 'spice', unit: 'quintal', minPrice: 5200 },
  { crop: 'Coriander', cropHi: 'धनिया', category: 'spice', unit: 'quintal', minPrice: 6200 },
  { crop: 'Cumin', cropHi: 'जीरा', category: 'spice', unit: 'quintal', minPrice: 12800 },
  { crop: 'Fenugreek', cropHi: 'मेथी', category: 'spice', unit: 'quintal', minPrice: 5200 },
  { crop: 'Fennel', cropHi: 'सौंफ', category: 'spice', unit: 'quintal', minPrice: 10800 },
  { crop: 'Turmeric', cropHi: 'हल्दी', category: 'spice', unit: 'quintal', minPrice: 7600 },
  { crop: 'Chilli', cropHi: 'मिर्च', category: 'spice', unit: 'quintal', minPrice: 8200 },
  { crop: 'Ginger', cropHi: 'अदरक', category: 'spice', unit: 'quintal', minPrice: 3400 },
  { crop: 'Ajwain', cropHi: 'अजवाइन', category: 'spice', unit: 'quintal', minPrice: 9600 },
  { crop: 'Onion', cropHi: 'प्याज़', category: 'vegetable', unit: 'quintal', minPrice: 1600 },
  { crop: 'Potato', cropHi: 'आलू', category: 'vegetable', unit: 'quintal', minPrice: 1100 },
  { crop: 'Tomato', cropHi: 'टमाटर', category: 'vegetable', unit: 'quintal', minPrice: 1400 },
  { crop: 'Brinjal', cropHi: 'बैंगन', category: 'vegetable', unit: 'quintal', minPrice: 1800 },
  { crop: 'Okra', cropHi: 'भिंडी', category: 'vegetable', unit: 'quintal', minPrice: 2200 },
  { crop: 'Cabbage', cropHi: 'पत्ता गोभी', category: 'vegetable', unit: 'quintal', minPrice: 900 },
  { crop: 'Cauliflower', cropHi: 'फूल गोभी', category: 'vegetable', unit: 'quintal', minPrice: 1300 },
  { crop: 'Bottle Gourd', cropHi: 'लौकी', category: 'vegetable', unit: 'quintal', minPrice: 1200 },
  { crop: 'Ridge Gourd', cropHi: 'तोरई', category: 'vegetable', unit: 'quintal', minPrice: 1600 },
  { crop: 'Bitter Gourd', cropHi: 'करेला', category: 'vegetable', unit: 'quintal', minPrice: 2400 },
  { crop: 'Pumpkin', cropHi: 'कद्दू', category: 'vegetable', unit: 'quintal', minPrice: 900 },
  { crop: 'Cucumber', cropHi: 'खीरा', category: 'vegetable', unit: 'quintal', minPrice: 1200 },
  { crop: 'Spinach', cropHi: 'पालक', category: 'vegetable', unit: 'quintal', minPrice: 700 },
  { crop: 'Banana', cropHi: 'केला', category: 'fruit', unit: 'quintal', minPrice: 900 },
  { crop: 'Guava', cropHi: 'अमरूद', category: 'fruit', unit: 'quintal', minPrice: 1800 },
  { crop: 'Mango', cropHi: 'आम', category: 'fruit', unit: 'quintal', minPrice: 2400 },
  { crop: 'Papaya', cropHi: 'पपीता', category: 'fruit', unit: 'quintal', minPrice: 1200 },
  { crop: 'Lemon', cropHi: 'नींबू', category: 'fruit', unit: 'quintal', minPrice: 2600 },
  { crop: 'Orange', cropHi: 'संतरा', category: 'fruit', unit: 'quintal', minPrice: 2200 },
  { crop: 'Pomegranate', cropHi: 'अनार', category: 'fruit', unit: 'quintal', minPrice: 4600 },
];

const MOCK_MANDI_CODES = ['AZD-001', 'VSH-002', 'KYM-003', 'TST-642189'];
const MOCK_USER_EMAILS = [
  'arpit2005singh@gmail.com',
  'suresh@mandibook.in',
  'priya@mandibook.in',
  'ravi@mandibook.in',
  'ram.singh@example.com',
  'lakshmi.devi@example.com',
  'otp.farmer@example.com',
];
const MOCK_USER_PHONES = ['9111111111', '9222222222', '9333333333', '9571845422'];
const ALLOWED_CROPS = new Set(CROP_BASELINES.map((entry) => entry.crop.toLowerCase()));

const normalizeEmail = (email) => String(email).trim().toLowerCase();

async function cleanupExistingMockData() {
  const mockMandis = await Mandi.findAll({
    where: {
      [Op.or]: [
        { code: { [Op.in]: MOCK_MANDI_CODES } },
        { code: { [Op.like]: 'TST-%' } },
        { name: { [Op.iLike]: 'Test Geo Mandi%' } },
      ],
    },
    attributes: ['id', 'code'],
  });
  const mockMandiIds = mockMandis.map((mandi) => mandi.id);

  const userCandidates = await User.findAll({
    where: {
      [Op.or]: [
        { email: { [Op.in]: MOCK_USER_EMAILS.map(normalizeEmail) } },
        { phone: { [Op.in]: MOCK_USER_PHONES } },
      ],
    },
    attributes: ['id', 'email', 'phone'],
  });

  const mockUserIds = userCandidates
    .filter((user) => {
      const email = user.email ? normalizeEmail(user.email) : '';
      if (MOCK_USER_EMAILS.map(normalizeEmail).includes(email)) {
        return true;
      }

      if (MOCK_USER_PHONES.includes(user.phone || '')) {
        return email !== normalizeEmail(TEST_FARMER.email) && user.phone !== TEST_FARMER.phone;
      }

      return false;
    })
    .map((user) => user.id);

  if (mockUserIds.length > 0) {
    await Notification.destroy({
      where: {
        userId: { [Op.in]: mockUserIds },
      },
    });
  }

  if (mockUserIds.length > 0 || mockMandiIds.length > 0) {
    await Booking.destroy({
      where: {
        [Op.or]: [
          ...(mockUserIds.length > 0 ? [{ farmerId: { [Op.in]: mockUserIds } }] : []),
          ...(mockMandiIds.length > 0 ? [{ mandiId: { [Op.in]: mockMandiIds } }] : []),
        ],
      },
    });
  }

  if (mockMandiIds.length > 0) {
    await TimeSlot.destroy({
      where: {
        mandiId: { [Op.in]: mockMandiIds },
      },
    });

    await CropPrice.destroy({
      where: {
        mandiId: { [Op.in]: mockMandiIds },
      },
    });
  }

  const existingCropPrices = await CropPrice.findAll({ attributes: ['id', 'crop', 'mandiId'] });
  const obsoleteCropPriceIds = existingCropPrices
    .filter((entry) => !ALLOWED_CROPS.has(String(entry.crop || '').trim().toLowerCase()))
    .map((entry) => entry.id);

  if (obsoleteCropPriceIds.length > 0) {
    await CropPrice.destroy({ where: { id: { [Op.in]: obsoleteCropPriceIds } } });
  }

  if (mockUserIds.length > 0 || mockMandiIds.length > 0) {
    await Issue.destroy({
      where: {
        [Op.or]: [
          ...(mockUserIds.length > 0 ? [{ reporterId: { [Op.in]: mockUserIds } }] : []),
          ...(mockMandiIds.length > 0 ? [{ mandiId: { [Op.in]: mockMandiIds } }] : []),
        ],
      },
    });
  }

  if (mockUserIds.length > 0 || mockMandiIds.length > 0) {
    await AuditLog.destroy({
      where: {
        [Op.or]: [
          ...(mockUserIds.length > 0 ? [{ userId: { [Op.in]: mockUserIds } }] : []),
          ...(mockMandiIds.length > 0 ? [{ entity: 'Mandi', entityId: { [Op.in]: mockMandiIds } }] : []),
        ],
      },
    });
  }

  if (mockUserIds.length > 0) {
    await User.destroy({ where: { id: { [Op.in]: mockUserIds } } });
  }

  if (mockMandiIds.length > 0) {
    await Mandi.destroy({ where: { id: { [Op.in]: mockMandiIds } } });
  }

  const existingCatalogEntries = await CropCatalog.findAll({ attributes: ['id', 'crop'] });
  const obsoleteCatalogIds = existingCatalogEntries
    .filter((entry) => !ALLOWED_CROPS.has(String(entry.crop || '').trim().toLowerCase()))
    .map((entry) => entry.id);

  if (obsoleteCatalogIds.length > 0) {
    await CropCatalog.destroy({ where: { id: { [Op.in]: obsoleteCatalogIds } } });
  }

  const mandis = await Mandi.findAll({ attributes: ['id', 'crops'] });
  for (const mandi of mandis) {
    const filteredCrops = Array.from(
      new Set((mandi.crops || []).filter((crop) => ALLOWED_CROPS.has(String(crop || '').trim().toLowerCase())))
    );
    if (filteredCrops.length !== (mandi.crops || []).length) {
      await mandi.update({ crops: filteredCrops });
    }
  }
}

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
  let user = await User.scope('withPassword').findOne({ where: { email: normalizedEmail } });

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
    crops: payload.prices.map((entry) => entry.crop),
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

async function provisionSeedData({ syncDatabase = true } = {}) {
  if (syncDatabase) {
    await sequelize.authenticate();
    await sequelize.sync();
  }

  await cleanupExistingMockData();

  let primaryAdmin = null;
  for (const adminPayload of TEST_ADMINS) {
    const adminResult = await upsertUser(adminPayload);
    if (!primaryAdmin) {
      primaryAdmin = adminResult.user;
    }
    console.log(`${adminResult.created ? 'Created' : 'Updated'} admin: ${adminResult.user.email} / ${adminPayload.password}`);
  }

  const mandiResults = [];
  for (const mandiPayload of SEEDED_MANDIS) {
    const mandiResult = await upsertMandi(mandiPayload);
    mandiResults.push(mandiResult.mandi);
    console.log(`${mandiResult.created ? 'Created' : 'Updated'} mandi: ${mandiResult.mandi.name} (${mandiResult.mandi.code})`);
  }

  for (const catalogEntry of CROP_BASELINES) {
    const result = await upsertCatalogEntry(catalogEntry, primaryAdmin.id);
    console.log(`${result.created ? 'Created' : 'Updated'} crop baseline: ${result.catalogEntry.crop} @ min ₹${result.catalogEntry.minPrice}`);
  }

  for (const mandi of mandiResults) {
    for (const priceEntry of SEEDED_MANDIS.find((m) => m.code === mandi.code).prices) {
      const result = await upsertCropPrice(mandi, priceEntry, primaryAdmin.id);
      console.log(`${result.created ? 'Created' : 'Updated'} crop price: ${result.price.crop} @ ₹${result.price.currentPrice} @ ${mandi.name}`);
    }
  }

  const managerAssignments = [];
  for (const managerPayload of TEST_MANAGERS) {
    const managerResult = await upsertUser(managerPayload);
    const assignedMandiConfig = SEEDED_MANDIS.find((mandi) => normalizeEmail(mandi.managerEmail) === managerResult.user.email);
    const assignedMandi = mandiResults.find((mandi) => mandi.code === assignedMandiConfig?.code);
    if (!assignedMandi || !assignedMandiConfig) {
      throw new Error(`Unable to find configured seeded mandi for manager ${managerResult.user.email}`);
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
  TEST_ADMINS.forEach((adminPayload) => {
    console.log(`Admin login: ${adminPayload.email} / ${adminPayload.password}`);
  });
  managerAssignments.forEach((assignment) => {
    console.log(`Manager login: ${assignment.email} / ${assignment.password} @ ${assignment.mandi}`);
  });
  console.log(`Farmer OTP email login: ${TEST_FARMER.email}`);

  return {
    admins: TEST_ADMINS.length,
    mandis: mandiResults.length,
    cropCatalog: CROP_BASELINES.length,
    managers: managerAssignments.length,
    farmer: farmerResult.user.email,
  };
}

if (require.main === module) {
  provisionSeedData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\nProvisioning failed:\n', error);
      process.exit(1);
    });
}

module.exports = {
  provisionSeedData,
  TEST_ADMINS,
  TEST_MANAGERS,
  TEST_FARMER,
  SEEDED_MANDIS,
  CROP_BASELINES,
};
