require('dotenv').config();

const BASE_URL = process.env.TEST_API_BASE_URL || `http://localhost:${process.env.PORT || 5001}/api`;
const MANAGER_EMAIL = process.env.TEST_MANAGER_EMAIL || 'arpit2005singh@gmail.com';
const MANAGER_PASSWORD = process.env.TEST_MANAGER_PASSWORD || 'arpit123';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'mandibook.admin@gmail.com';

const results = [];

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { ok: response.ok, status: response.status, data };
}

function logResult(name, passed, details) {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (!passed && details) {
    console.log('   ', typeof details === 'string' ? details : JSON.stringify(details, null, 2));
  }
}

(async () => {
  try {
    console.log(`\nRunning API smoke tests against ${BASE_URL}\n`);

    const health = await request('/health');
    logResult('GET /health', health.ok, health.data);
    if (!health.ok) process.exit(1);

    const mandis = await request('/mandis');
    logResult('GET /mandis', mandis.ok, mandis.data);

    const prices = await request('/prices');
    logResult('GET /prices', prices.ok, prices.data);

    const managerLogin = await request('/auth/manager/login', {
      method: 'POST',
      body: JSON.stringify({ email: MANAGER_EMAIL, password: MANAGER_PASSWORD }),
    });
    logResult('POST /auth/manager/login', managerLogin.ok, managerLogin.data);

    let managerToken = null;
    let managerMandiId = null;
    if (managerLogin.ok && managerLogin.data?.token) {
      managerToken = managerLogin.data.token;
      managerMandiId = managerLogin.data.user?.mandiId || null;
    }

    if (managerToken) {
      const me = await request('/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      logResult('GET /auth/me (manager)', me.ok, me.data);

      const dashboard = await request('/dashboard/manager', {
        method: 'GET',
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      logResult('GET /dashboard/manager', dashboard.ok, dashboard.data);

      if (managerMandiId) {
        const slots = await request(`/slots?mandiId=${managerMandiId}`);
        logResult('GET /slots?mandiId=...', slots.ok, slots.data);

        const bookings = await request(`/bookings/mandi/${managerMandiId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${managerToken}` },
        });
        logResult('GET /bookings/mandi/:mandiId', bookings.ok, bookings.data);
      }

      const logout = await request('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      logResult('POST /auth/logout', logout.ok, logout.data);
    }

    console.log('\nManual flows to verify separately:');
    console.log(`- Farmer OTP login via Twilio`);
    console.log(`- Admin login + Brevo 2FA using ${ADMIN_EMAIL}`);

    const failed = results.filter((item) => !item.passed);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);

    process.exit(failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\nSmoke test runner crashed:\n', error);
    process.exit(1);
  }
})();
