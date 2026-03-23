const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userRole: {
    type: DataTypes.ENUM('farmer', 'manager', 'admin', 'system'),
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('login', 'booking', 'price', 'user', 'mandi', 'system'),
    defaultValue: 'system',
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  indexes: [
    { fields: ['createdAt'] },
    { fields: ['type', 'createdAt'] },
  ],
});

module.exports = AuditLog;
