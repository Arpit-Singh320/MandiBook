const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('booking-confirmed', 'booking-reminder', 'booking-cancelled', 'price-alert', 'announcement', 'system'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  titleHi: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  messageHi: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  actionUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'isRead', 'createdAt'] },
  ],
});

module.exports = Notification;
