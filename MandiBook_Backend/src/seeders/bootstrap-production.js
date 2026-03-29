require('dotenv').config();
const { sequelize } = require('../config/db');
const { User } = require('../models');

const ADMIN_ACCOUNTS = [
  {
    name: 'MandiBook Admin',
    role: 'admin',
    email: 'mandibook.admin@gmail.com',
    password: 'admin123',
    language: 'en',
    department: 'Platform Operations',
    twoFactorEnabled: true,
    profileComplete: true,
    status: 'active',
  },
  {
    name: 'Ayush Yogi',
    role: 'admin',
    email: 'ayushyogi400@gmail.com',
    password: 'ayush123',
    language: 'en',
    department: 'Platform Operations',
    twoFactorEnabled: true,
    profileComplete: true,
    status: 'active',
  },
];

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const bootstrapProduction = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    // Sync tables safely (alter: true adds missing columns without dropping)
    await sequelize.sync({ alter: true });
    console.log('Database tables synced');

    const arpitUser = await User.scope('withPassword').findOne({
      where: { email: normalizeEmail('arpit2005singh@gmail.com') },
    });

    if (arpitUser && arpitUser.role === 'admin') {
      arpitUser.role = 'manager';
      arpitUser.department = null;
      arpitUser.twoFactorEnabled = false;
      if (!arpitUser.designation) {
        arpitUser.designation = 'Lead Mandi Manager';
      }
      await arpitUser.save();
      console.log('✅ Corrected arpit2005singh@gmail.com role to manager');
    }

    for (const adminPayload of ADMIN_ACCOUNTS) {
      const normalizedEmail = normalizeEmail(adminPayload.email);
      const existingAdmin = await User.scope('withPassword').findOne({
        where: { email: normalizedEmail },
      });

      if (existingAdmin) {
        existingAdmin.set({
          ...adminPayload,
          email: normalizedEmail,
        });
        await existingAdmin.save();
        console.log(`✅ Refreshed admin user: ${normalizedEmail}`);
      } else {
        await User.create({
          ...adminPayload,
          email: normalizedEmail,
        });
        console.log(`✅ Created admin user: ${normalizedEmail}`);
      }
    }

    console.log('\n🎉 Production bootstrap completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
};

bootstrapProduction();
