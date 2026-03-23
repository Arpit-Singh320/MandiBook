const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('farmer', 'manager', 'admin'),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  language: {
    type: DataTypes.ENUM('en', 'hi'),
    defaultValue: 'en',
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended'),
    defaultValue: 'active',
  },
  // Profile & login tracking
  profileComplete: { type: DataTypes.BOOLEAN, defaultValue: false },
  lastLoginIp: { type: DataTypes.STRING, allowNull: true },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true },
  // Farmer-specific
  aadhaarLast4: { type: DataTypes.STRING, allowNull: true },
  village: { type: DataTypes.STRING, allowNull: true },
  district: { type: DataTypes.STRING, allowNull: true },
  state: { type: DataTypes.STRING, allowNull: true },
  pincode: { type: DataTypes.STRING, allowNull: true },
  landHolding: { type: DataTypes.FLOAT, allowNull: true },
  farmSize: { type: DataTypes.STRING, allowNull: true },
  preferredMandis: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: [],
  },
  crops: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  priceAlertCrops: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  // Manager-specific
  mandiId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  designation: { type: DataTypes.STRING, allowNull: true },
  managingSince: { type: DataTypes.DATE, allowNull: true },
  // Admin-specific
  department: { type: DataTypes.STRING, allowNull: true },
  twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  // OTP fields (email — for admin 2FA + farmer email auth)
  emailOtp: { type: DataTypes.STRING, allowNull: true },
  emailOtpExpires: { type: DataTypes.DATE, allowNull: true },
  // Phone OTP fields (for farmer phone auth via stored OTP fallback)
  phoneOtp: { type: DataTypes.STRING, allowNull: true },
  phoneOtpExpires: { type: DataTypes.DATE, allowNull: true },
  // Token version for logout
  tokenVersion: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
  defaultScope: {
    attributes: { exclude: ['password', 'emailOtp', 'emailOtpExpires', 'phoneOtp', 'phoneOtpExpires'] },
  },
  scopes: {
    withPassword: { attributes: { include: ['password'] } },
    withOtp: { attributes: { include: ['emailOtp', 'emailOtpExpires', 'phoneOtp', 'phoneOtpExpires'] } },
    withAll: { attributes: { include: ['password', 'emailOtp', 'emailOtpExpires', 'phoneOtp', 'phoneOtpExpires'] } },
  },
});

User.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
