const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CropPrice = sequelize.define('CropPrice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  crop: {
    type: DataTypes.STRING,
    allowNull: false,
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
  mandiId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  currentPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  prevPrice: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  minPrice: { type: DataTypes.FLOAT, allowNull: true },
  maxPrice: { type: DataTypes.FLOAT, allowNull: true },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'crop_prices',
  timestamps: true,
  indexes: [
    { fields: ['mandiId', 'crop'] },
  ],
});

// Virtual-like getters
CropPrice.prototype.getChangePercent = function () {
  if (!this.prevPrice || this.prevPrice === 0) return 0;
  return parseFloat((((this.currentPrice - this.prevPrice) / this.prevPrice) * 100).toFixed(1));
};

CropPrice.prototype.getTrend = function () {
  if (this.currentPrice > this.prevPrice) return 'up';
  if (this.currentPrice < this.prevPrice) return 'down';
  return 'stable';
};

module.exports = CropPrice;
