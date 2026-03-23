const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Mandi = sequelize.define('Mandi', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nameHi: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pincode: { type: DataTypes.STRING, allowNull: true },
  lat: { type: DataTypes.FLOAT, allowNull: true },
  lng: { type: DataTypes.FLOAT, allowNull: true },
  contactPhone: { type: DataTypes.STRING, allowNull: true },
  managerId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  crops: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  operatingHoursOpen: {
    type: DataTypes.STRING,
    defaultValue: '05:00',
  },
  operatingHoursClose: {
    type: DataTypes.STRING,
    defaultValue: '18:00',
  },
  holidays: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: { min: 0, max: 5 },
  },
}, {
  tableName: 'mandis',
  timestamps: true,
});

module.exports = Mandi;
