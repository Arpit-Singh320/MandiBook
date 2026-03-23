const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const generateToken = require('../utils/generateToken');
const generateOTP = require('../utils/generateOTP');
const { sendOTP, verifyOTP } = require('../config/twilio');
const { sendEmailOTP } = require('../config/brevo');
const { protect } = require('../middleware/auth');

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
      return res.status(500).json({ success: false, message: 'Failed to send OTP', error: result.error });
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

    const otp = generateOTP(6);

    // Store OTP against existing user or temp — find or create minimal record
    let user = await User.scope('withOtp').findOne({ where: { email, role: 'farmer' } });
    if (!user) {
      // Pre-register with minimal data; profile completion later
      user = await User.create({
        name: '',
        role: 'farmer',
        email,
        language: 'en',
        profileComplete: false,
      });
      // re-fetch with OTP scope
      user = await User.scope('withOtp').findByPk(user.id);
    }

    user.emailOtp = otp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailResult = await sendEmailOTP(email, user.name || 'Farmer', otp);
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send email OTP', error: emailResult.error });
    }

    res.json({ success: true, message: 'OTP sent to email', method: 'email' });
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

    const token = generateToken(user.id, user.role);

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
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.scope('withOtp').findOne({ where: { email, role: 'farmer' } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'No pending verification for this email' });
    }

    if (!user.emailOtp || user.emailOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.emailOtpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    const isNew = !user.name || user.name === '';

    // Clear OTP and update login
    user.emailOtp = null;
    user.emailOtpExpires = null;
    user.lastLoginIp = req.ip;
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user.id, user.role);

    await AuditLog.create({
      userId: user.id,
      userName: user.name || email,
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
    const { name, village, district, state, pincode, landHolding, farmSize, crops, preferredMandis, language } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const updates = { name: name.trim(), profileComplete: true };
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

    const user = await User.scope('withPassword').findOne({ where: { email, role: 'manager' } });
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

    const token = generateToken(user.id, user.role);

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

    const user = await User.scope('withAll').findOne({ where: { email, role: 'admin' } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate and send 2FA code via Brevo
    const otp = generateOTP(6);
    user.emailOtp = otp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailResult = await sendEmailOTP(user.email, user.name, otp);

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send 2FA code' });
    }

    res.json({
      success: true,
      message: '2FA code sent to email',
      requires2FA: true,
      tempUserId: user.id,
    });
  } catch (error) {
    next(error);
  }
});

// ─── Admin: Verify 2FA ──────────────────────────────────────────────────────────
// POST /api/auth/admin/verify-2fa
router.post('/admin/verify-2fa', async (req, res, next) => {
  try {
    const { tempUserId, code } = req.body;
    if (!tempUserId || !code) {
      return res.status(400).json({ success: false, message: 'User ID and 2FA code are required' });
    }

    const user = await User.scope('withOtp').findByPk(tempUserId);
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid request' });
    }

    if (!user.emailOtp || user.emailOtp !== code) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA code' });
    }

    if (user.emailOtpExpires < new Date()) {
      return res.status(400).json({ success: false, message: '2FA code expired' });
    }

    user.emailOtp = null;
    user.emailOtpExpires = null;
    await user.save();

    const token = generateToken(user.id, user.role);

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
