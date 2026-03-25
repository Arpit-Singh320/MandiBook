require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const { User } = require('../models');

const bootstrapProduction = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    // Sync tables safely (alter: true adds missing columns without dropping)
    await sequelize.sync({ alter: true });
    console.log('Database tables synced');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      where: { email: 'mandibook.admin@gmail.com' } 
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('   Email: mandibook.admin@gmail.com');
      console.log('   Password: admin123');
      console.log('   Note: 2FA is enabled via email');
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = await User.create({
        name: 'Rajesh Kumar',
        role: 'admin',
        email: 'mandibook.admin@gmail.com',
        password: hashedPassword,
        language: 'en',
        department: 'Platform Operations',
        twoFactorEnabled: true,
        profileComplete: true,
      });

      console.log('✅ Admin user created successfully');
      console.log('   Email: mandibook.admin@gmail.com');
      console.log('   Password: admin123');
      console.log('   Note: 2FA is enabled via email');
    }

    console.log('\n🎉 Production bootstrap completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
};

bootstrapProduction();
