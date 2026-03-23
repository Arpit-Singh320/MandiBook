const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Issue = sequelize.define('Issue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  reporterId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  reporterName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mandiId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  mandiName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('open', 'in-progress', 'resolved', 'closed'),
    defaultValue: 'open',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  resolution: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  comments: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'issues',
  timestamps: true,
  indexes: [
    { fields: ['status', 'priority'] },
  ],
});

module.exports = Issue;
