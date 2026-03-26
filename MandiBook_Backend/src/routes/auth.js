const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, AuditLog, OtpRequest } = require('../models');
const generateToken = require('../utils/generateToken');
const generateOTP = require('../utils/generateOTP');
const { sendOTP, verifyOTP } = require('../config/twilio');
const { sendEmailOTP } = require('../config/brevo');
const { protect } = require('../middleware/auth');
const { normalizeIdentifier, hashOtpCode, createOtpRequestId, isOtpDebugBypassEnabled } = require('../utils/otp-request');

// ── Helper: build farmer user response payload ──────────────────────────────
const farmerPayload = (user) => ({
  id: user.id,
  name: user.name,
  role: user.role,
  phone: user.phone,
  email: user.email,
  language: user.language,
  avatar: user.avatar,
  profileComplete: user.profileComplete,
  village: user.village,
  district: user.district,
  state: user.state,
  pincode: user.pincode,
  landHolding: user.landHolding,
  farmSize: user.farmSize,
  preferredMandis: user.preferredMandis,
  crops: user.crops,
  priceAlertCrops: user.priceAlertCrops,
  createdAt: user.createdAt,
});

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_EXPIRY_SECONDS = Math.floor(OTP_EXPIRY_MS / 1000);
const OTP_RESEND_AFTER_SECONDS = 30;
const OTP_MAX_ATTEMPTS = 5;

const isLocalOtpFallbackEnabled = () => process.env.NODE_ENV !== 'production' && process.env.OTP_ALLOW_LOCAL_FALLBACK !== 'false';

const buildOtpDispatchError = (emailResult) => ({
  success: false,
  error: emailResult.error || 'OTP delivery failed',
  message: emailResult.error || 'OTP delivery failed',
  code: emailResult.code || 'otp_delivery_failed',
  statusCode: emailResult.statusCode || 500,
});

const issueOtpRequest = async ({ purpose, identifier, userId, recipientName, metadata = {} }) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  await OtpRequest.update(
    { status: 'cancelled', consumed: true, consumedAt: new Date() },
    {
      where: {
        purpose,
        identifier: normalizedIdentifier,
        consumed: false,
        status: { [Op.in]: ['created', 'sent'] },
      },
    }
  );

  const otp = generateOTP(6);
  const requestId = createOtpRequestId(purpose === 'admin_email_2fa' ? 'admin_otp' : 'farmer_otp');

  const otpRequest = await OtpRequest.create({
    requestId,
    purpose,
    channel: 'email',
    identifier: normalizedIdentifier,
    userId: userId || null,
    otpHash: hashOtpCode({ code: otp, requestId, purpose, identifier: normalizedIdentifier }),
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
    resendCount: 0,
    lastSentAt: new Date(),
    consumed: false,
    status: 'created',
    deliveryProvider: 'brevo',
    metadata,
  });

  let emailResult = { success: true, messageId: 'debug-bypass' };
  const debugBypassEnabled = isOtpDebugBypassEnabled();

  if (!debugBypassEnabled) {
    emailResult = await sendEmailOTP(normalizedIdentifier, recipientName, otp);
  }

  if (!emailResult.success) {
    if (isLocalOtpFallbackEnabled()) {
      console.warn(`OTP email delivery failed for ${normalizedIdentifier}; using local fallback in ${process.env.NODE_ENV || 'development'} mode.`);

      await otpRequest.update({
        status: 'sent',
        deliveryProvider: 'local-fallback',
        deliveryReference: emailResult.error || 'local-fallback',
      });

      return {
        success: true,
        otpRequestId: otpRequest.requestId,
        expiresInSeconds: OTP_EXPIRY_SECONDS,
        resendAfterSeconds: OTP_RESEND_AFTER_SECONDS,
        debugOtp: otp,
        fallbackDelivery: true,
      };
    }

    await otpRequest.update({ status: 'cancelled' });
    return buildOtpDispatchError(emailResult);
  }

  await otpRequest.update({
    status: 'sent',
    deliveryReference: emailResult.messageId || null,
  });

  return {
    success: true,
    otpRequestId: otpRequest.requestId,
    expiresInSeconds: OTP_EXPIRY_SECONDS,
    resendAfterSeconds: OTP_RESEND_AFTER_SECONDS,
    ...(debugBypassEnabled ? { debugOtp: otp } : {}),
  };
};

const validateOtpRequest = async ({ otpRequestId, purpose, identifier, code, userId }) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const otpRequest = await OtpRequest.findOne({ where: { requestId: otpRequestId, purpose } });

  if (!otpRequest) {
    return { success: false, status: 400, message: 'Invalid OTP request' };
  }

  if (otpRequest.identifier !== normalizedIdentifier) {
    return { success: false, status: 400, message: 'OTP request does not match this identifier' };
  }

  if (userId && otpRequest.userId && otpRequest.userId !== userId) {
    return { success: false, status: 400, message: 'OTP request does not match this user' };
  }

  if (otpRequest.consumed || otpRequest.status === 'verified') {
    return { success: false, status: 400, message: 'OTP has already been used' };
  }

  if (otpRequest.expiresAt < new Date()) {
    await otpRequest.update({ status: 'expired' });
    return { success: false, status: 400, message: 'OTP expired' };
  }

  if (otpRequest.status === 'blocked' || otpRequest.attempts >= otpRequest.maxAttempts) {
    await otpRequest.update({ status: 'blocked' });
    return { success: false, status: 429, message: 'Too many invalid attempts. Request a new OTP.' };
  }

  const isValid = otpRequest.otpHash === hashOtpCode({
    code,
    requestId: otpRequest.requestId,
    purpose,
    identifier: normalizedIdentifier,
  });

  if (!isValid) {
    const attempts = otpRequest.attempts + 1;
    await otpRequest.update({
      attempts,
      status: attempts >= otpRequest.maxAttempts ? 'blocked' : otpRequest.status,
    });

    return {
      success: false,
      status: attempts >= otpRequest.maxAttempts ? 429 : 400,
      message: attempts >= otpRequest.maxAttempts ? 'Too many invalid attempts. Request a new OTP.' : 'Invalid OTP',
    };
  }

  return { success: true, otpRequest };
};

// ─── Farmer: Send Phone OTP (Twilio) ─────────────────────────────────────────
// POST /api/auth/farmer/send-otp
router.post('/farmer/send-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number is required' });
    }

    const formattedPhone = `+91${phone}`;
    const result = await sendOTP(formattedPhone);

    if (!result.success) {
      return res.status(result.statusCode || 500).json({
        success: false,
        message: result.error || 'Failed to send OTP',
        error: result.error,
        code: result.code,
      });
    }

    res.json({ success: true, message: 'OTP sent successfully', method: 'phone', status: result.status });
  } catch (error) {
    next(error);
  }
});

// ─── Farmer: Send Email OTP (Brevo) ──────────────────────────────────────────
// POST /api/auth/farmer/send-email-otp
router.post('/farmer/send-email-otp', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    const normalizedEmail = normalizeIdentifier(email);

    let user = await User.findOne({ where: { email: normalizedEmail, role: 'farmer' } });
    if (!user) {
      user = await User.create({
        name: '',
        role: 'farmer',
        email: normalizedEmail,
        language: 'en',
        profileComplete: false,
      });
    }

    const otpDispatch = await issueOtpRequest({
      purpose: 'farmer_email_login',
      identifier: normalizedEmail,
      userId: user.id,
      recipientName: user.name || 'Farmer',
      metadata: { role: 'farmer' },
    });

    if (!otpDispatch.success) {
      return res.status(otpDispatch.statusCode || 500).json({
        success: false,
        message: otpDispatch.message || 'Failed to send email OTP',
        error: otpDispatch.error,
        code: otpDispatch.code,
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to email',
      method: 'email',
      otpRequestId: otpDispatch.otpRequestId,
      expiresInSeconds: otpDispatch.expiresInSeconds,
      resendAfterSeconds: otpDispatch.resendAfterSeconds,
      ...(otpDispatch.debugOtp ? { debugOtp: otpDispatch.debugOtp } : {}),
    });
  } catch (error) {
    next(error);
  }
});

// ─── Farmer: Verify Phone OTP & Login/Register ──────────────────────────────
// POST /api/auth/farmer/verify-otp
router.post('/farmer/verify-otp', async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const formattedPhone = `+91${phone}`;
    const result = await verifyOTP(formattedPhone, otp);

    if (!result.success) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    let user = await User.findOne({ where: { phone, role: 'farmer' } });
    let isNew = false;

    if (!user) {
      user = await User.create({
        name: '',
        role: 'farmer',
        phone,
        language: 'hi',
        profileComplete: false,
      });
      isNew = true;
    }

    // Track login
    user.lastLoginIp = req.ip;
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user.id, user.role, user.tokenVersion);

    await AuditLog.create({
      userId: user.id,
      userName: user.name || `Farmer ${phone.slice(-4)}`,
      userRole: 'farmer',
      action: isNew ? 'Registered via phone OTP' : 'Logged in via phone OTP',
      entity: 'Farmer Portal',
      entityId: user.id,
      type: 'login',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: isNew ? 'Registration successful' : 'Login successful',
      isNew,
      profileComplete: user.profileComplete,
      token,
      user: farmerPayload(user),
    });
  } catch (error) {
    next(error);
  }
});

// ─── Farmer: Verify Email OTP & Login/Register ──────────────────────────────
// POST /api/auth/farmer/verify-email-otp
router.post('/farmer/verify-email-otp', async (req, res, next) => {
  try {
    const { email, otp, otpRequestId } = req.body;
    if (!email || !otp || !otpRequestId) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and otpRequestId are required' });
    }

    const normalizedEmail = normalizeIdentifier(email);
    const validation = await validateOtpRequest({
      otpRequestId,
      purpose: 'farmer_email_login',
      identifier: normalizedEmail,
      code: otp,
    });

    if (!validation.success) {
      return res.status(validation.status).json({ success: false, message: validation.message });
    }

    let user = await User.findOne({ where: { email: normalizedEmail, role: 'farmer' } });
    if (!user) {
      user = await User.create({
        name: '',
        role: 'farmer',
        email: normalizedEmail,
        language: 'en',
        profileComplete: false,
      });
    }

    const isNew = !user.name || user.name === '';

    await validation.otpRequest.update({
      consumed: true,
      consumedAt: new Date(),
      status: 'verified',
      userId: user.id,
    });

    user.lastLoginIp = req.ip;
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user.id, user.role, user.tokenVersion);

    await AuditLog.create({
      userId: user.id,
      userName: user.name || normalizedEmail,
      userRole: 'farmer',
      action: isNew ? 'Registered via email OTP' : 'Logged in via email OTP',
      entity: 'Farmer Portal',
      entityId: user.id,
      type: 'login',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: isNew ? 'Registration successful' : 'Login successful',
      isNew,
      profileComplete: user.profileComplete,
      token,
      user: farmerPayload(user),
    });
  } catch (error) {
    next(error);
  }
});

// ─── Profile Completion (any role, primarily farmer) ─────────────────────────
// PUT /api/auth/complete-profile
router.put('/complete-profile', protect, async (req, res, next) => {
  try {
    const { name, phone, email, village, district, state, pincode, landHolding, farmSize, crops, preferredMandis, language } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const normalizedEmail = email ? normalizeIdentifier(email) : null;
    const normalizedPhone = typeof phone === 'string' ? phone.replace(/\D/g, '') : null;

    if (req.user.role === 'farmer') {
      if (!req.user.phone && !normalizedPhone) {
        return res.status(400).json({ success: false, message: 'Phone number is required to complete your profile' });
      }

      if (!req.user.email && !normalizedEmail) {
        return res.status(400).json({ success: false, message: 'Email address is required to complete your profile' });
      }
    }

    if (normalizedPhone && !/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number is required' });
    }

    if (normalizedEmail) {
      const existingEmailUser = await User.findOne({ where: { email: normalizedEmail, id: { [Op.ne]: req.user.id } } });
      if (existingEmailUser) {
        return res.status(400).json({ success: false, message: 'Email address is already linked to another account' });
      }
    }

    if (normalizedPhone) {
      const existingPhoneUser = await User.findOne({ where: { phone: normalizedPhone, id: { [Op.ne]: req.user.id } } });
      if (existingPhoneUser) {
        return res.status(400).json({ success: false, message: 'Phone number is already linked to another account' });
      }
    }

    const updates = { name: name.trim(), profileComplete: true };
    if (normalizedPhone) updates.phone = normalizedPhone;
    if (normalizedEmail) updates.email = normalizedEmail;
    if (village) updates.village = village;
    if (district) updates.district = district;
    if (state) updates.state = state;
    if (pincode) updates.pincode = pincode;
    if (landHolding !== undefined) updates.landHolding = landHolding;
    if (farmSize) updates.farmSize = farmSize;
    if (crops) updates.crops = crops;
    if (preferredMandis) updates.preferredMandis = preferredMandis;
    if (language) updates.language = language;

    await req.user.update(updates);

    await AuditLog.create({
      userId: req.user.id,
      userName: name,
      userRole: req.user.role,
      action: 'Completed profile',
      entity: 'User',
      entityId: req.user.id,
      type: 'user',
      ipAddress: req.ip,
    });

    const refreshed = await User.findByPk(req.user.id);

    res.json({
      success: true,
      message: 'Profile completed',
      user: farmerPayload(refreshed),
    });
  } catch (error) {
    next(error);
  }
});

// ─── Manager: Login ─────────────────────────────────────────────────────────────
// POST /api/auth/manager/login
router.post('/manager/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = normalizeIdentifier(email);
    const user = await User.scope('withPassword').findOne({ where: { email: normalizedEmail, role: 'manager' } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Track login
    user.lastLoginIp = req.ip;
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user.id, user.role, user.tokenVersion);

    await AuditLog.create({
      userId: user.id,
      userName: user.name,
      userRole: 'manager',
      action: 'Logged in',
      entity: 'Manager Portal',
      entityId: user.id,
      type: 'login',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        language: user.language,
        mandiId: user.mandiId,
        designation: user.designation,
        managingSince: user.managingSince,
        profileComplete: user.profileComplete,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Admin: Login (Step 1 — credentials) ────────────────────────────────────────
// POST /api/auth/admin/login
router.post('/admin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = normalizeIdentifier(email);
    const user = await User.scope('withPassword').findOne({ where: { email: normalizedEmail, role: 'admin' } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const otpDispatch = await issueOtpRequest({
      purpose: 'admin_email_2fa',
      identifier: normalizedEmail,
      userId: user.id,
      recipientName: user.name,
      metadata: { role: 'admin' },
    });

    if (!otpDispatch.success) {
      return res.status(otpDispatch.statusCode || 500).json({
        success: false,
        message: otpDispatch.message || 'Failed to send 2FA code',
        error: otpDispatch.error,
        code: otpDispatch.code,
      });
    }

    res.json({
      success: true,
      message: '2FA code sent to email',
      requires2FA: true,
      tempUserId: user.id,
      otpRequestId: otpDispatch.otpRequestId,
      expiresInSeconds: otpDispatch.expiresInSeconds,
      resendAfterSeconds: otpDispatch.resendAfterSeconds,
      ...(otpDispatch.debugOtp ? { debugOtp: otpDispatch.debugOtp } : {}),
    });
  } catch (error) {
    next(error);
  }
});

// ─── Admin: Verify 2FA ──────────────────────────────────────────────────────────
// POST /api/auth/admin/verify-2fa
router.post('/admin/verify-2fa', async (req, res, next) => {
  try {
    const { tempUserId, otpRequestId, code } = req.body;
    if (!tempUserId || !otpRequestId || !code) {
      return res.status(400).json({ success: false, message: 'tempUserId, otpRequestId, and 2FA code are required' });
    }

    const user = await User.findByPk(tempUserId);
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid request' });
    }

    const validation = await validateOtpRequest({
      otpRequestId,
      purpose: 'admin_email_2fa',
      identifier: user.email,
      code,
      userId: user.id,
    });

    if (!validation.success) {
      return res.status(validation.status).json({ success: false, message: validation.message });
    }

    await validation.otpRequest.update({
      consumed: true,
      consumedAt: new Date(),
      status: 'verified',
      userId: user.id,
    });

    await user.save();

    const token = generateToken(user.id, user.role, user.tokenVersion);

    await AuditLog.create({
      userId: user.id,
      userName: user.name,
      userRole: 'admin',
      action: 'Logged in',
      entity: 'Admin Portal',
      entityId: user.id,
      type: 'login',
      ipAddress: req.ip,
    });

    // Track login
    user.lastLoginIp = req.ip;
    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        language: user.language,
        department: user.department,
        twoFactorEnabled: user.twoFactorEnabled,
        profileComplete: user.profileComplete,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Logout ─────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
router.post('/logout', protect, async (req, res, next) => {
  try {
    await req.user.increment('tokenVersion');

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'Logged out',
      entity: `${req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)} Portal`,
      entityId: req.user.id,
      type: 'login',
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── Get Current User ───────────────────────────────────────────────────────────
// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const u = req.user;
  res.json({
    success: true,
    user: {
      id: u.id,
      name: u.name,
      role: u.role,
      phone: u.phone,
      email: u.email,
      language: u.language,
      avatar: u.avatar,
      status: u.status,
      profileComplete: u.profileComplete,
      village: u.village,
      district: u.district,
      state: u.state,
      pincode: u.pincode,
      landHolding: u.landHolding,
      farmSize: u.farmSize,
      preferredMandis: u.preferredMandis,
      crops: u.crops,
      priceAlertCrops: u.priceAlertCrops,
      mandiId: u.mandiId,
      designation: u.designation,
      managingSince: u.managingSince,
      department: u.department,
      twoFactorEnabled: u.twoFactorEnabled,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    },
  });
});

module.exports = router;
