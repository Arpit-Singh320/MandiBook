require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

const BASE_URL = process.env.TEST_API_BASE_URL || `http://localhost:${process.env.PORT || 5001}/api`;
const OUTPUT_ROOT = path.join(__dirname, 'output');
const SESSION_CACHE_PATH = path.join(OUTPUT_ROOT, 'session-cache.json');
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const RUN_OUTPUT_DIR = path.join(OUTPUT_ROOT, RUN_ID);

const ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'mandibook.admin@gmail.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
};

const PRIMARY_MANAGER = {
  email: process.env.TEST_MANAGER_EMAIL || 'arpit2005singh@gmail.com',
  password: process.env.TEST_MANAGER_PASSWORD || 'arpit123',
};

const SECONDARY_MANAGER = {
  email: process.env.TEST_SECOND_MANAGER_EMAIL || 'deependrasastiya17@gmail.com',
  password: process.env.TEST_SECOND_MANAGER_PASSWORD || 'deependra123',
};

const FARMER = {
  email: process.env.TEST_FARMER_EMAIL || 'arpit@compliledger.com',
  phone: process.env.TEST_FARMER_PHONE || '9444444444',
  name: process.env.TEST_FARMER_NAME || 'Arpit Farmer',
};

const rl = readline.createInterface({ input, output });
const results = [];
let requestCounter = 0;
const NETWORK_RETRY_ATTEMPTS = 3;
const NETWORK_RETRY_DELAY_MS = 750;

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryNetworkError(error) {
  const causeCode = error?.cause?.code;
  return error?.name === 'TypeError' && ['UND_ERR_SOCKET', 'ECONNRESET', 'ECONNREFUSED'].includes(causeCode);
}

function maskHeaders(headers = {}) {
  const clone = { ...headers };
  if (clone.Authorization) {
    clone.Authorization = 'Bearer ***';
  }
  return clone;
}

async function recordArtifact(label, payload) {
  requestCounter += 1;
  const fileName = `${String(requestCounter).padStart(3, '0')}-${slugify(label)}.json`;
  await writeJson(path.join(RUN_OUTPUT_DIR, fileName), payload);
}

function logAssertion(name, passed, details) {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (!passed && details) {
    console.log(typeof details === 'string' ? details : JSON.stringify(details, null, 2));
  }
}

async function request(label, endpoint, options = {}) {
  const startedAt = Date.now();
  const { token, body, headers, ...rest } = options;
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  for (let attempt = 1; attempt <= NETWORK_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...rest,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      const artifact = {
        label,
        endpoint,
        method: rest.method || 'GET',
        attempt,
        request: {
          headers: maskHeaders(requestHeaders),
          body: body ?? null,
        },
        response: {
          ok: response.ok,
          status: response.status,
          data,
        },
        durationMs: Date.now() - startedAt,
        recordedAt: new Date().toISOString(),
      };

      await recordArtifact(label, artifact);
      return artifact.response;
    } catch (error) {
      if (!shouldRetryNetworkError(error) || attempt === NETWORK_RETRY_ATTEMPTS) {
        const artifact = {
          label,
          endpoint,
          method: rest.method || 'GET',
          attempt,
          request: {
            headers: maskHeaders(requestHeaders),
            body: body ?? null,
          },
          error: {
            name: error?.name,
            message: error?.message,
            cause: error?.cause ? {
              code: error.cause.code,
              message: error.cause.message,
            } : null,
          },
          durationMs: Date.now() - startedAt,
          recordedAt: new Date().toISOString(),
        };
        await recordArtifact(`${label}-network-error`, artifact);
        throw error;
      }

      await sleep(NETWORK_RETRY_DELAY_MS * attempt);
    }
  }
}

async function promptForOtp(label) {
  const value = await rl.question(`${label}: `);
  return String(value || '').trim();
}

function getDebugOtp(response, envValue) {
  return response?.data?.debugOtp || envValue || null;
}

async function loadSessionCache() {
  return readJson(SESSION_CACHE_PATH, { sessions: {} });
}

async function saveSessionCache(cache) {
  await writeJson(SESSION_CACHE_PATH, cache);
}

async function validateSession(actor, token, expectedRole) {
  if (!token) return null;
  const me = await request(`${actor}-session-validate`, '/auth/me', { token });
  if (!me.ok || me.data?.user?.role !== expectedRole) {
    return null;
  }
  return { token, user: me.data.user };
}

async function ensureAdminSession(sessionCache) {
  const cached = await validateSession('admin', sessionCache.sessions?.admin?.token, 'admin');
  if (cached) {
    return cached;
  }

  const login = await request('admin-login-start', '/auth/admin/login', {
    method: 'POST',
    body: ADMIN,
  });
  if (!login.ok) {
    throw new Error(`Admin login failed: ${login.status} ${JSON.stringify(login.data)}`);
  }

  const otp = getDebugOtp(login, process.env.TEST_ADMIN_2FA_CODE) || await promptForOtp('Enter admin OTP');
  const verify = await request('admin-login-verify-2fa', '/auth/admin/verify-2fa', {
    method: 'POST',
    body: {
      tempUserId: login.data.tempUserId,
      otpRequestId: login.data.otpRequestId,
      code: otp,
    },
  });

  if (!verify.ok || !verify.data?.token) {
    throw new Error(`Admin 2FA failed: ${verify.status} ${JSON.stringify(verify.data)}`);
  }

  sessionCache.sessions.admin = { token: verify.data.token, email: ADMIN.email };
  await saveSessionCache(sessionCache);
  return { token: verify.data.token, user: verify.data.user };
}

async function ensureManagerSession(sessionCache, key, credentials) {
  const cached = await validateSession(key, sessionCache.sessions?.[key]?.token, 'manager');
  if (cached) {
    return cached;
  }

  const login = await request(`${key}-login`, '/auth/manager/login', {
    method: 'POST',
    body: credentials,
  });
  if (!login.ok || !login.data?.token) {
    throw new Error(`Manager login failed for ${credentials.email}: ${login.status} ${JSON.stringify(login.data)}`);
  }

  sessionCache.sessions[key] = { token: login.data.token, email: credentials.email };
  await saveSessionCache(sessionCache);
  return { token: login.data.token, user: login.data.user };
}

async function completeFarmerProfileIfNeeded(token, email) {
  const me = await request('farmer-auth-me-initial', '/auth/me', { token });
  if (!me.ok) {
    throw new Error(`Failed to fetch farmer profile: ${me.status} ${JSON.stringify(me.data)}`);
  }

  if (me.data?.user?.profileComplete) {
    return me.data.user;
  }

  const response = await request('farmer-complete-profile', '/auth/complete-profile', {
    method: 'PUT',
    token,
    body: {
      name: FARMER.name,
      phone: FARMER.phone,
      email,
      village: 'Test Village',
      district: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
      landHolding: 3.5,
      farmSize: 'Medium (2-10 acres)',
      crops: ['Wheat', 'Rice'],
      preferredMandis: [],
      language: 'en',
    },
  });

  if (!response.ok) {
    throw new Error(`Farmer profile completion failed: ${response.status} ${JSON.stringify(response.data)}`);
  }

  return response.data?.user;
}

async function ensureFarmerSession(sessionCache) {
  const cached = await validateSession('farmer', sessionCache.sessions?.farmer?.token, 'farmer');
  if (cached) {
    const user = await completeFarmerProfileIfNeeded(cached.token, FARMER.email);
    return { token: cached.token, user };
  }

  const sendOtp = await request('farmer-send-email-otp', '/auth/farmer/send-email-otp', {
    method: 'POST',
    body: { email: FARMER.email },
  });
  if (!sendOtp.ok || !sendOtp.data?.otpRequestId) {
    throw new Error(`Farmer email OTP request failed: ${sendOtp.status} ${JSON.stringify(sendOtp.data)}`);
  }

  const otp = getDebugOtp(sendOtp, process.env.TEST_FARMER_EMAIL_OTP) || await promptForOtp('Enter farmer OTP');
  const verify = await request('farmer-verify-email-otp', '/auth/farmer/verify-email-otp', {
    method: 'POST',
    body: {
      email: FARMER.email,
      otp,
      otpRequestId: sendOtp.data.otpRequestId,
    },
  });

  if (!verify.ok || !verify.data?.token) {
    throw new Error(`Farmer email OTP verification failed: ${verify.status} ${JSON.stringify(verify.data)}`);
  }

  sessionCache.sessions.farmer = { token: verify.data.token, email: FARMER.email };
  await saveSessionCache(sessionCache);
  const user = await completeFarmerProfileIfNeeded(verify.data.token, FARMER.email);
  return { token: verify.data.token, user };
}

function assertOk(label, response) {
  logAssertion(label, response.ok, response.data);
  return response.ok;
}

(async () => {
  const sessionCache = await loadSessionCache();
  const summary = {
    baseUrl: BASE_URL,
    runId: RUN_ID,
    startedAt: new Date().toISOString(),
  };

  try {
    await ensureDir(RUN_OUTPUT_DIR);

    const publicHealth = await request('public-health', '/health');
    assertOk('GET /health', publicHealth);

    const publicMandis = await request('public-mandis', '/mandis');
    assertOk('GET /mandis', publicMandis);

    const publicNearby = await request('public-nearby-mandis', '/mandis/nearby?lat=28.7041&lng=77.1025&radius=50');
    assertOk('GET /mandis/nearby', publicNearby);

    const publicPrices = await request('public-prices', '/prices');
    assertOk('GET /prices', publicPrices);

    const publicCatalog = await request('public-price-catalog', '/prices/catalog?active=true');
    assertOk('GET /prices/catalog', publicCatalog);

    const publicOverview = await request('public-prices-overview', '/prices/overview');
    assertOk('GET /prices/overview', publicOverview);

    const adminSession = await ensureAdminSession(sessionCache);
    const primaryManagerSession = await ensureManagerSession(sessionCache, 'primaryManager', PRIMARY_MANAGER);
    const secondaryManagerSession = await ensureManagerSession(sessionCache, 'secondaryManager', SECONDARY_MANAGER);
    const farmerSession = await ensureFarmerSession(sessionCache);

    const adminMe = await request('admin-auth-me', '/auth/me', { token: adminSession.token });
    assertOk('GET /auth/me (admin)', adminMe);

    const adminDashboard = await request('admin-dashboard', '/dashboard/admin', { token: adminSession.token });
    assertOk('GET /dashboard/admin', adminDashboard);

    const adminAnalytics = await request('admin-dashboard-analytics', '/dashboard/analytics', { token: adminSession.token });
    assertOk('GET /dashboard/analytics', adminAnalytics);

    const adminReports = await request('admin-dashboard-reports', '/dashboard/admin/reports', { token: adminSession.token });
    assertOk('GET /dashboard/admin/reports', adminReports);

    const adminUsers = await request('admin-users-list', '/users?role=all&limit=50', { token: adminSession.token });
    assertOk('GET /users', adminUsers);

    const primaryManagerUser = adminUsers.data?.data?.find((user) => user.email === PRIMARY_MANAGER.email);
    const secondaryManagerUser = adminUsers.data?.data?.find((user) => user.email === SECONDARY_MANAGER.email);

    if (!primaryManagerUser || !secondaryManagerUser) {
      throw new Error('Expected manager users were not found. Run the provisioning script first.');
    }

    const adminUserDetail = await request('admin-user-detail-primary-manager', `/users/${primaryManagerUser.id}`, { token: adminSession.token });
    assertOk('GET /users/:id', adminUserDetail);

    const secondManagerSuspend = await request('admin-suspend-second-manager', `/users/${secondaryManagerUser.id}/status`, {
      method: 'PUT',
      token: adminSession.token,
      body: { status: 'suspended' },
    });
    assertOk('PUT /users/:id/status suspend', secondManagerSuspend);

    const secondManagerActivate = await request('admin-activate-second-manager', `/users/${secondaryManagerUser.id}/status`, {
      method: 'PUT',
      token: adminSession.token,
      body: { status: 'active' },
    });
    assertOk('PUT /users/:id/status activate', secondManagerActivate);

    const adminAuditLogs = await request('admin-audit-logs', '/audit-logs?limit=25', { token: adminSession.token });
    assertOk('GET /audit-logs', adminAuditLogs);

    const existingMandis = publicMandis.data?.data || [];
    const createdMandiCode = `TST-${Date.now().toString().slice(-6)}`;
    const createMandi = await request('admin-create-mandi-address-geocode', '/mandis', {
      method: 'POST',
      token: adminSession.token,
      body: {
        name: `Test Geo Mandi ${createdMandiCode}`,
        code: createdMandiCode,
        address: 'Azadpur Mandi, GT Karnal Road',
        city: 'Delhi',
        district: 'North Delhi',
        state: 'Delhi',
        pincode: '110033',
        lat: 28.7183,
        lng: 77.181,
        contactPhone: '01100000000',
        crops: ['Wheat'],
        operatingHoursOpen: '05:00',
        operatingHoursClose: '18:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      },
    });
    assertOk('POST /mandis', createMandi);

    const createdMandi = createMandi.data?.data;
    if (!createdMandi?.id) {
      throw new Error('Failed to create the test mandi.');
    }
    logAssertion('Mandi geocoding stored coordinates', Number.isFinite(createdMandi.lat) && Number.isFinite(createdMandi.lng), createdMandi);

    const publicSingleMandi = await request('public-single-mandi', `/mandis/${createdMandi.id}`);
    assertOk('GET /mandis/:id', publicSingleMandi);

    const adminAssignPrimary = await request('admin-assign-primary-manager', `/users/manager/${primaryManagerUser.id}/assignment`, {
      method: 'PUT',
      token: adminSession.token,
      body: { mandiId: createdMandi.id, designation: 'Lead Mandi Manager' },
    });
    assertOk('PUT /users/manager/:id/assignment primary', adminAssignPrimary);

    const adminAssignSecondary = await request('admin-assign-secondary-manager', `/users/manager/${secondaryManagerUser.id}/assignment`, {
      method: 'PUT',
      token: adminSession.token,
      body: { mandiId: createdMandi.id, designation: 'Mandi Operations Manager' },
    });
    assertOk('PUT /users/manager/:id/assignment secondary', adminAssignSecondary);

    const adminMandiStats = await request('admin-mandi-stats', `/mandis/${createdMandi.id}/stats`, { token: adminSession.token });
    assertOk('GET /mandis/:id/stats (admin)', adminMandiStats);

    const createdCatalog = await request('admin-create-crop-catalog', '/prices/catalog', {
      method: 'POST',
      token: adminSession.token,
      body: {
        crop: `Test Millet ${createdMandiCode}`,
        category: 'test',
        unit: 'quintal',
        minPrice: 1500,
        isActive: true,
      },
    });
    assertOk('POST /prices/catalog', createdCatalog);

    const catalogId = createdCatalog.data?.data?.id;
    if (!catalogId) {
      throw new Error('Failed to create catalog entry for test flow.');
    }

    const updateCatalog = await request('admin-update-crop-catalog', `/prices/catalog/${catalogId}`, {
      method: 'PUT',
      token: adminSession.token,
      body: {
        cropHi: 'परीक्षण बाजरा',
      },
    });
    assertOk('PUT /prices/catalog/:id', updateCatalog);

    const refreshedPrimaryManager = await ensureManagerSession(sessionCache, 'primaryManager', PRIMARY_MANAGER);
    const refreshedSecondaryManager = await ensureManagerSession(sessionCache, 'secondaryManager', SECONDARY_MANAGER);

    const primaryManagerMe = await request('primary-manager-auth-me', '/auth/me', { token: refreshedPrimaryManager.token });
    assertOk('GET /auth/me (primary manager)', primaryManagerMe);

    const secondaryManagerMe = await request('secondary-manager-auth-me', '/auth/me', { token: refreshedSecondaryManager.token });
    assertOk('GET /auth/me (secondary manager)', secondaryManagerMe);

    const managerDashboard = await request('manager-dashboard', '/dashboard/manager', { token: refreshedPrimaryManager.token });
    assertOk('GET /dashboard/manager', managerDashboard);

    const managerReports = await request('manager-dashboard-reports', '/dashboard/manager/reports', { token: refreshedPrimaryManager.token });
    assertOk('GET /dashboard/manager/reports', managerReports);

    const managerMandiStats = await request('manager-mandi-stats', `/mandis/${createdMandi.id}/stats`, { token: refreshedPrimaryManager.token });
    assertOk('GET /mandis/:id/stats (manager)', managerMandiStats);

    const managerOperations = await request('manager-update-mandi-operations', `/mandis/${createdMandi.id}/operations`, {
      method: 'PUT',
      token: refreshedPrimaryManager.token,
      body: {
        contactPhone: '01111111111',
        crops: ['Wheat', `Test Millet ${createdMandiCode}`],
      },
    });
    assertOk('PUT /mandis/:id/operations', managerOperations);

    const bookingDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    const autoSlots = await request('public-slots-list-initial', `/slots?mandiId=${createdMandi.id}&date=${bookingDate}`);
    assertOk('GET /slots?mandiId=...&date=...', autoSlots);

    const slotCreate = await request('manager-create-slot', '/slots', {
      method: 'POST',
      token: refreshedPrimaryManager.token,
      body: {
        mandiId: createdMandi.id,
        date: bookingDate,
        startTime: '17:00',
        endTime: '18:00',
        label: '05:00 PM - 06:00 PM',
        capacity: 12,
      },
    });
    assertOk('POST /slots', slotCreate);

    const createdSlot = slotCreate.data?.data;
    if (!createdSlot?.id) {
      throw new Error('Failed to create manager test slot.');
    }

    const slotUpdate = await request('manager-update-slot', `/slots/${createdSlot.id}`, {
      method: 'PUT',
      token: refreshedPrimaryManager.token,
      body: {
        capacity: 10,
        label: '05:00 PM - 06:00 PM Test',
      },
    });
    assertOk('PUT /slots/:id', slotUpdate);

    const slotToggleOff = await request('manager-toggle-slot-off', `/slots/${createdSlot.id}/toggle`, {
      method: 'PUT',
      token: refreshedPrimaryManager.token,
    });
    assertOk('PUT /slots/:id/toggle off', slotToggleOff);

    const slotToggleOn = await request('manager-toggle-slot-on', `/slots/${createdSlot.id}/toggle`, {
      method: 'PUT',
      token: refreshedPrimaryManager.token,
    });
    assertOk('PUT /slots/:id/toggle on', slotToggleOn);

    const cancellationSlotCreate = await request('manager-create-cancellation-slot', '/slots', {
      method: 'POST',
      token: refreshedPrimaryManager.token,
      body: {
        mandiId: createdMandi.id,
        date: bookingDate,
        startTime: '18:00',
        endTime: '19:00',
        label: '06:00 PM - 07:00 PM Cancel',
        capacity: 8,
      },
    });
    assertOk('POST /slots cancellation slot', cancellationSlotCreate);

    const deletableSlot = await request('manager-create-deletable-slot', '/slots', {
      method: 'POST',
      token: refreshedPrimaryManager.token,
      body: {
        mandiId: createdMandi.id,
        date: bookingDate,
        startTime: '19:00',
        endTime: '20:00',
        label: '07:00 PM - 08:00 PM',
        capacity: 8,
      },
    });
    assertOk('POST /slots second slot', deletableSlot);

    if (deletableSlot.data?.data?.id) {
      const slotDelete = await request('manager-delete-slot', `/slots/${deletableSlot.data.data.id}`, {
        method: 'DELETE',
        token: refreshedPrimaryManager.token,
      });
      assertOk('DELETE /slots/:id', slotDelete);
    }

    const managerPricesList = await request('manager-prices-list', `/prices?mandiId=${createdMandi.id}`);
    assertOk('GET /prices?mandiId=...', managerPricesList);

    const managerCreatePrice = await request('manager-create-price', '/prices', {
      method: 'POST',
      token: refreshedPrimaryManager.token,
      body: {
        crop: `Test Millet ${createdMandiCode}`,
        mandiId: createdMandi.id,
        currentPrice: 2000,
      },
    });
    assertOk('POST /prices', managerCreatePrice);

    const priceId = managerCreatePrice.data?.data?.id;
    if (priceId) {
      const managerUpdatePrice = await request('manager-update-price', `/prices/${priceId}`, {
        method: 'PUT',
        token: refreshedPrimaryManager.token,
        body: { currentPrice: 2200 },
      });
      assertOk('PUT /prices/:id', managerUpdatePrice);
    }

    const managerBookingsBefore = await request('manager-bookings-before-farmer', `/bookings/mandi/${createdMandi.id}?date=${bookingDate}`, {
      token: refreshedPrimaryManager.token,
    });
    assertOk('GET /bookings/mandi/:mandiId', managerBookingsBefore);

    const managerIssuesBefore = await request('manager-issues-list-before', '/issues?status=all&limit=20', {
      token: refreshedPrimaryManager.token,
    });
    assertOk('GET /issues (manager)', managerIssuesBefore);

    const managerBroadcast = await request('manager-notification-broadcast', '/notifications/broadcast', {
      method: 'POST',
      token: refreshedPrimaryManager.token,
      body: {
        title: 'Manager Test Broadcast',
        message: 'This is a manager-scoped broadcast test.',
      },
    });
    assertOk('POST /notifications/broadcast (manager)', managerBroadcast);

    const farmerMe = await request('farmer-auth-me', '/auth/me', { token: farmerSession.token });
    assertOk('GET /auth/me (farmer)', farmerMe);

    const farmerDashboard = await request('farmer-dashboard', '/dashboard/farmer', { token: farmerSession.token });
    assertOk('GET /dashboard/farmer', farmerDashboard);

    const farmerPreferredMandis = await request('farmer-update-preferred-mandis', '/users/preferred-mandis', {
      method: 'PUT',
      token: farmerSession.token,
      body: {
        preferredMandis: [createdMandi.id, ...(existingMandis[0]?.id ? [existingMandis[0].id] : [])],
      },
    });
    assertOk('PUT /users/preferred-mandis', farmerPreferredMandis);

    const farmerProfileUpdate = await request('farmer-profile-update', '/users/profile', {
      method: 'PUT',
      token: farmerSession.token,
      body: {
        crops: ['Wheat', 'Rice', `Test Millet ${createdMandiCode}`],
        language: 'en',
      },
    });
    assertOk('PUT /users/profile', farmerProfileUpdate);

    const nearbyAfterCreate = await request('public-nearby-created-mandi-check', `/mandis/nearby?lat=${createdMandi.lat}&lng=${createdMandi.lng}&radius=25`);
    assertOk('GET /mandis/nearby after mandi creation', nearbyAfterCreate);
    logAssertion(
      'Created mandi appears in nearby search',
      Array.isArray(nearbyAfterCreate.data?.data) && nearbyAfterCreate.data.data.some((mandi) => mandi.id === createdMandi.id),
      nearbyAfterCreate.data
    );

    const slotsForFarmer = await request('farmer-slots-list', `/slots?mandiId=${createdMandi.id}&date=${bookingDate}`);
    assertOk('GET /slots for farmer booking', slotsForFarmer);

    const bookingSlotId = createdSlot.id;
    const farmerCreateBooking = await request('farmer-create-booking', '/bookings', {
      method: 'POST',
      token: farmerSession.token,
      body: {
        mandiId: createdMandi.id,
        slotId: bookingSlotId,
        date: bookingDate,
        cropType: `Test Millet ${createdMandiCode}`,
        estimatedQuantity: 25,
        vehicleNumber: 'MP09AA0001',
      },
    });
    assertOk('POST /bookings', farmerCreateBooking);

    const activeBookingId = farmerCreateBooking.data?.data?.id;
    if (!activeBookingId) {
      throw new Error('Failed to create booking for check-in/complete flow.');
    }

    const farmerBookingDetail = await request('farmer-booking-detail', `/bookings/${activeBookingId}`, {
      token: farmerSession.token,
    });
    assertOk('GET /bookings/:id', farmerBookingDetail);

    const farmerCreateCancellableBooking = await request('farmer-create-booking-for-cancel', '/bookings', {
      method: 'POST',
      token: farmerSession.token,
      body: {
        mandiId: createdMandi.id,
        slotId: cancellationSlotCreate.data?.data?.id,
        date: bookingDate,
        cropType: 'Wheat',
        estimatedQuantity: 10,
        vehicleNumber: 'MP09AA0002',
      },
    });
    assertOk('POST /bookings second booking for cancel flow', farmerCreateCancellableBooking);

    const farmerBookings = await request('farmer-bookings-list', '/bookings/my?status=all', {
      token: farmerSession.token,
    });
    assertOk('GET /bookings/my', farmerBookings);

    const cancellableBookingId = farmerCreateCancellableBooking.data?.data?.id;
    const cancellableBooking = Array.isArray(farmerBookings.data?.data)
      ? farmerBookings.data.data.find((booking) => booking.id === cancellableBookingId)
      : null;

    if (cancellableBooking?.id) {
      const farmerCancelBooking = await request('farmer-cancel-booking', `/bookings/${cancellableBooking.id}/cancel`, {
        method: 'PUT',
        token: farmerSession.token,
        body: { reason: 'Automated flow cancellation check' },
      });
      assertOk('PUT /bookings/:id/cancel', farmerCancelBooking);
    } else {
      logAssertion('PUT /bookings/:id/cancel', false, 'Expected cancellable booking was not found in the farmer booking list.');
    }

    const farmerIssue = await request('farmer-create-issue', '/issues', {
      method: 'POST',
      token: farmerSession.token,
      body: {
        title: 'Automated farmer issue',
        description: 'Testing farmer issue creation flow.',
        mandiId: createdMandi.id,
        mandiName: createdMandi.name,
        priority: 'medium',
      },
    });
    assertOk('POST /issues (farmer)', farmerIssue);

    const farmerNotifications = await request('farmer-notifications-list', '/notifications?limit=20', {
      token: farmerSession.token,
    });
    assertOk('GET /notifications (farmer)', farmerNotifications);

    const firstFarmerNotificationId = farmerNotifications.data?.data?.[0]?.id;
    if (firstFarmerNotificationId) {
      const markRead = await request('farmer-notification-read', `/notifications/${firstFarmerNotificationId}/read`, {
        method: 'PUT',
        token: farmerSession.token,
      });
      assertOk('PUT /notifications/:id/read', markRead);
    }

    const markAllRead = await request('farmer-notifications-read-all', '/notifications/read-all', {
      method: 'PUT',
      token: farmerSession.token,
    });
    assertOk('PUT /notifications/read-all', markAllRead);

    const managerBookingsAfter = await request('manager-bookings-after-farmer', `/bookings/mandi/${createdMandi.id}?date=${bookingDate}`, {
      token: refreshedPrimaryManager.token,
    });
    assertOk('GET /bookings/mandi/:mandiId after farmer booking', managerBookingsAfter);

    const managerCheckin = await request('manager-checkin-booking', `/bookings/${activeBookingId}/checkin`, {
      method: 'PUT',
      token: refreshedPrimaryManager.token,
    });
    assertOk('PUT /bookings/:id/checkin', managerCheckin);

    const managerComplete = await request('manager-complete-booking', `/bookings/${activeBookingId}/complete`, {
      method: 'PUT',
      token: refreshedPrimaryManager.token,
    });
    assertOk('PUT /bookings/:id/complete', managerComplete);

    const managerIssueUpdateTarget = farmerIssue.data?.data?.id;
    if (managerIssueUpdateTarget) {
      const managerUpdateIssue = await request('manager-update-issue', `/issues/${managerIssueUpdateTarget}`, {
        method: 'PUT',
        token: refreshedPrimaryManager.token,
        body: {
          status: 'resolved',
          resolution: 'Resolved during automated manager flow.',
        },
      });
      assertOk('PUT /issues/:id (manager)', managerUpdateIssue);
    }

    const managerNotifications = await request('manager-notifications-list', '/notifications?limit=20', {
      token: refreshedPrimaryManager.token,
    });
    assertOk('GET /notifications (manager)', managerNotifications);

    const adminIssues = await request('admin-issues-list', '/issues?status=all&limit=20', {
      token: adminSession.token,
    });
    assertOk('GET /issues (admin)', adminIssues);

    const adminBroadcast = await request('admin-notification-broadcast', '/notifications/broadcast', {
      method: 'POST',
      token: adminSession.token,
      body: {
        title: 'Admin Test Broadcast',
        message: 'This is an admin broadcast test.',
        target: 'managers',
      },
    });
    assertOk('POST /notifications/broadcast (admin)', adminBroadcast);

    const mandiToggleOff = await request('admin-toggle-mandi-off', `/mandis/${createdMandi.id}/toggle`, {
      method: 'PUT',
      token: adminSession.token,
    });
    assertOk('PUT /mandis/:id/toggle off', mandiToggleOff);

    const mandiToggleOn = await request('admin-toggle-mandi-on', `/mandis/${createdMandi.id}/toggle`, {
      method: 'PUT',
      token: adminSession.token,
    });
    assertOk('PUT /mandis/:id/toggle on', mandiToggleOn);

    const finalAdminReports = await request('admin-dashboard-reports-final', '/dashboard/admin/reports', {
      token: adminSession.token,
    });
    assertOk('GET /dashboard/admin/reports final', finalAdminReports);

    summary.completedAt = new Date().toISOString();
    summary.failed = results.filter((result) => !result.passed);
    summary.totalAssertions = results.length;
    summary.passedAssertions = results.length - summary.failed.length;
    summary.outputDir = RUN_OUTPUT_DIR;
    summary.sessionCachePath = SESSION_CACHE_PATH;
    summary.createdMandiId = createdMandi.id;

    await writeJson(path.join(RUN_OUTPUT_DIR, 'summary.json'), summary);

    console.log(`\nArtifacts written to: ${RUN_OUTPUT_DIR}`);
    console.log(`Session cache written to: ${SESSION_CACHE_PATH}`);
    console.log(`${summary.passedAssertions}/${summary.totalAssertions} assertions passed.`);

    process.exit(summary.failed.length > 0 ? 1 : 0);
  } catch (error) {
    await writeJson(path.join(RUN_OUTPUT_DIR, 'summary.json'), {
      baseUrl: BASE_URL,
      runId: RUN_ID,
      failed: true,
      error: {
        message: error.message,
        stack: error.stack,
      },
      assertions: results,
    });
    console.error('\nComprehensive flow runner crashed:\n', error);
    process.exit(1);
  } finally {
    await rl.close();
  }
})();
