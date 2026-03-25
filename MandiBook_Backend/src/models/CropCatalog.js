const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CropCatalog = sequelize.define('CropCatalog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  crop: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  cropHi: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general',
  },
  unit: {
    type: DataTypes.ENUM('kg', 'quintal', 'ton'),
    defaultValue: 'quintal',
  },
  minPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0 },
  },
  maxPrice: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: { min: 0 },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'crop_catalog',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['crop'] },
  ],
});

module.exports = CropCatalog;
