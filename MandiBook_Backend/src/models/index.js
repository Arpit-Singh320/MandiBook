const User = require('./User');
const Mandi = require('./Mandi');
const TimeSlot = require('./TimeSlot');
const Booking = require('./Booking');
const CropPrice = require('./CropPrice');
const Notification = require('./Notification');
const Issue = require('./Issue');
const AuditLog = require('./AuditLog');

// ─── Associations ───────────────────────────────────────────────────────────────

// Mandi <-> Manager (User)
Mandi.belongsTo(User, { as: 'manager', foreignKey: 'managerId', constraints: false });
User.hasOne(Mandi, { as: 'managedMandi', foreignKey: 'managerId', constraints: false });

// TimeSlot <-> Mandi
TimeSlot.belongsTo(Mandi, { as: 'mandi', foreignKey: 'mandiId' });
Mandi.hasMany(TimeSlot, { as: 'slots', foreignKey: 'mandiId' });

// Booking <-> User (farmer)
Booking.belongsTo(User, { as: 'farmer', foreignKey: 'farmerId', constraints: false });
User.hasMany(Booking, { as: 'bookings', foreignKey: 'farmerId', constraints: false });

// Booking <-> Mandi
Booking.belongsTo(Mandi, { as: 'mandi', foreignKey: 'mandiId' });
Mandi.hasMany(Booking, { as: 'bookings', foreignKey: 'mandiId' });

// Booking <-> TimeSlot
Booking.belongsTo(TimeSlot, { as: 'slot', foreignKey: 'slotId' });
TimeSlot.hasMany(Booking, { as: 'bookings', foreignKey: 'slotId' });

// CropPrice <-> Mandi
CropPrice.belongsTo(Mandi, { as: 'mandi', foreignKey: 'mandiId' });
Mandi.hasMany(CropPrice, { as: 'prices', foreignKey: 'mandiId' });

// CropPrice <-> User (updatedBy)
CropPrice.belongsTo(User, { as: 'updater', foreignKey: 'updatedBy', constraints: false });

// Notification <-> User
Notification.belongsTo(User, { as: 'user', foreignKey: 'userId', constraints: false });
User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId', constraints: false });

// Issue <-> User (reporter)
Issue.belongsTo(User, { as: 'reporter', foreignKey: 'reporterId', constraints: false });

// Issue <-> Mandi
Issue.belongsTo(Mandi, { as: 'mandi', foreignKey: 'mandiId', constraints: false });

// AuditLog <-> User
AuditLog.belongsTo(User, { as: 'user', foreignKey: 'userId', constraints: false });

module.exports = {
  User,
  Mandi,
  TimeSlot,
  Booking,
  CropPrice,
  Notification,
  Issue,
  AuditLog,
};
