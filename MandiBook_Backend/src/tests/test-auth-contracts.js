require('dotenv').config();

const buildUniquePhone = (seed = '') => {
  const numericSeed = `${Date.now()}${process.pid}${seed}`.replace(/\D/g, '');
  return `9${numericSeed.slice(-9).padStart(9, '0')}`;
};

const BASE_URL = process.env.TEST_API_BASE_URL || `http://localhost:${process.env.PORT || 5001}/api`;
const MANAGER_EMAIL = process.env.TEST_MANAGER_EMAIL || 'arpit2005singh@gmail.com';
const MANAGER_PASSWORD = process.env.TEST_MANAGER_PASSWORD || 'arpit123';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'mandibook.admin@gmail.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';
const FARMER_EMAIL = process.env.TEST_FARMER_EMAIL || 'arpit@compliledger.com';
const FARMER_PHONE = process.env.TEST_FARMER_PHONE || '9571945422';
const FARMER_NAME = process.env.TEST_FARMER_NAME || 'Arpit Farmer';
const FARMER_OTP = process.env.TEST_FARMER_EMAIL_OTP || null;
const ADMIN_OTP = process.env.TEST_ADMIN_2FA_CODE || null;

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

function getOtpFromResponse(response, fallbackOtp) {
  return response?.data?.debugOtp || fallbackOtp;
}

async function loginAdminWithFallbacks() {
  const candidates = [
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    { email: 'ayushyogi400@gmail.com', password: 'ayush123' },
    { email: 'admin@mandibook.in', password: 'admin123' },
  ];

  for (const candidate of candidates) {
    const response = await request('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(candidate),
    });

    if (response.ok) {
      return { response, credentials: candidate };
    }
  }

  const response = await request('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(candidates[0]),
  });
  return { response, credentials: candidates[0] };
 }

(async () => {
  try {
    console.log(`\nRunning auth contract tests against ${BASE_URL}\n`);

    const health = await request('/health');
    logResult('GET /health', health.ok, health.data);
    if (!health.ok) process.exit(1);

    const managerLogin = await request('/auth/manager/login', {
      method: 'POST',
      body: JSON.stringify({ email: MANAGER_EMAIL, password: MANAGER_PASSWORD }),
    });
    logResult('POST /auth/manager/login', managerLogin.ok, managerLogin.data);

    if (managerLogin.ok && managerLogin.data?.token) {
      const managerToken = managerLogin.data.token;

      const meBeforeLogout = await request('/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      logResult('GET /auth/me before logout', meBeforeLogout.ok, meBeforeLogout.data);

      const logout = await request('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      logResult('POST /auth/logout', logout.ok, logout.data);

      const meAfterLogout = await request('/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      logResult('GET /auth/me after logout is invalidated', meAfterLogout.status === 401, meAfterLogout.data);
    }

    const farmerOtpRequest = await request('/auth/farmer/send-email-otp', {
      method: 'POST',
      body: JSON.stringify({ email: FARMER_EMAIL }),
    });
    logResult(
      'POST /auth/farmer/send-email-otp returns otpRequestId',
      farmerOtpRequest.ok && Boolean(farmerOtpRequest.data?.otpRequestId),
      farmerOtpRequest.data
    );

    if (farmerOtpRequest.ok && farmerOtpRequest.data?.otpRequestId) {
      const otpValue = getOtpFromResponse(farmerOtpRequest, FARMER_OTP);

      if (otpValue) {
        const farmerVerify = await request('/auth/farmer/verify-email-otp', {
          method: 'POST',
          body: JSON.stringify({
            email: FARMER_EMAIL,
            otp: otpValue,
            otpRequestId: farmerOtpRequest.data.otpRequestId,
          }),
        });
        logResult('POST /auth/farmer/verify-email-otp', farmerVerify.ok, farmerVerify.data);

        if (farmerVerify.ok && farmerVerify.data?.token) {
          const farmerToken = farmerVerify.data.token;

          const completeProfile = await request('/auth/complete-profile', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${farmerToken}` },
            body: JSON.stringify({
              name: FARMER_NAME,
              phone: FARMER_PHONE,
              email: FARMER_EMAIL,
              village: 'Test Village',
              district: 'Test District',
              state: 'Madhya Pradesh',
              pincode: '452003',
              farmSize: 'Medium (2-10 acres)',
              crops: ['Wheat', 'Maize'],
              language: 'en',
            }),
          });
          logResult('PUT /auth/complete-profile links farmer identity', completeProfile.ok, completeProfile.data);

          const meAfterCompletion = await request('/auth/me', {
            method: 'GET',
            headers: { Authorization: `Bearer ${farmerToken}` },
          });
          logResult(
            'GET /auth/me returns completed farmer profile',
            meAfterCompletion.ok && meAfterCompletion.data?.user?.profileComplete === true && meAfterCompletion.data?.user?.phone === FARMER_PHONE,
            meAfterCompletion.data
          );
        }
      } else {
        logResult(
          'Farmer email OTP verification skipped (no debug OTP or TEST_FARMER_EMAIL_OTP provided)',
          true,
          'Set OTP_DEBUG_BYPASS_DELIVERY=true or TEST_FARMER_EMAIL_OTP to run the full farmer verification flow.'
        );
      }
    }

    const { response: adminLogin, credentials: adminCredentials } = await loginAdminWithFallbacks();
    logResult(
      'POST /auth/admin/login starts 2FA',
      adminLogin.ok && adminLogin.data?.requires2FA === true && Boolean(adminLogin.data?.otpRequestId),
      adminLogin.ok ? { ...adminLogin.data, email: adminCredentials.email } : adminLogin.data
    );

    if (adminLogin.ok && adminLogin.data?.tempUserId && adminLogin.data?.otpRequestId) {
      const adminOtpValue = getOtpFromResponse(adminLogin, ADMIN_OTP);

      if (adminOtpValue) {
        const adminVerify = await request('/auth/admin/verify-2fa', {
          method: 'POST',
          body: JSON.stringify({
            tempUserId: adminLogin.data.tempUserId,
            otpRequestId: adminLogin.data.otpRequestId,
            code: adminOtpValue,
          }),
        });
        logResult('POST /auth/admin/verify-2fa', adminVerify.ok, adminVerify.data);
      } else {
        logResult(
          'Admin 2FA verification skipped (no debug OTP or TEST_ADMIN_2FA_CODE provided)',
          true,
          'Set OTP_DEBUG_BYPASS_DELIVERY=true or TEST_ADMIN_2FA_CODE to run the full admin verification flow.'
        );
      }
    }

    const failed = results.filter((item) => !item.passed);
    console.log(`\n${results.length - failed.length}/${results.length} auth checks passed.`);
    process.exit(failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\nAuth contract test runner crashed:\n', error);
    process.exit(1);
  }
})();
