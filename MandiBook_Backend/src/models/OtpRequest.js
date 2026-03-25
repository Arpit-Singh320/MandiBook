const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OtpRequest = sequelize.define('OtpRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  requestId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  purpose: {
    type: DataTypes.ENUM('farmer_email_login', 'admin_email_2fa'),
    allowNull: false,
  },
  channel: {
    type: DataTypes.ENUM('email', 'sms'),
    allowNull: false,
    defaultValue: 'email',
  },
  identifier: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  otpHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  maxAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  resendCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastSentAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  consumed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  consumedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('created', 'sent', 'verified', 'expired', 'blocked', 'cancelled'),
    defaultValue: 'created',
  },
  deliveryProvider: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deliveryReference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
}, {
  tableName: 'otp_requests',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['requestId'] },
    { fields: ['identifier', 'purpose', 'status'] },
    { fields: ['userId', 'purpose', 'status'] },
    { fields: ['expiresAt'] },
  ],
});

module.exports = OtpRequest;
