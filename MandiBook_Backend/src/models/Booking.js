const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bookingNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  farmerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  mandiId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  slotId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  timeSlot: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cropType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  estimatedQuantity: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  vehicleNumber: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  status: {
    type: DataTypes.ENUM('confirmed', 'checked-in', 'completed', 'cancelled', 'no-show', 'pending'),
    defaultValue: 'confirmed',
  },
  qrCodeData: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  checkedInAt: { type: DataTypes.DATE, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  cancelledAt: { type: DataTypes.DATE, allowNull: true },
  cancelReason: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'bookings',
  timestamps: true,
  indexes: [
    { fields: ['farmerId', 'date'] },
    { fields: ['mandiId', 'date'] },
    { fields: ['status'] },
    { fields: ['bookingNumber'] },
  ],
});

module.exports = Booking;
