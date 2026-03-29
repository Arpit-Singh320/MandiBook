require('dotenv').config();
const { sequelize } = require('../config/db');
const { provisionSeedData } = require('../scripts/provision-test-users');

const bootstrapProduction = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    // Sync tables safely (alter: true adds missing columns without dropping)
    await sequelize.sync({ alter: true });
    console.log('Database tables synced');

    const summary = await provisionSeedData({ syncDatabase: false });

    console.log('\n🎉 Production bootstrap completed!');
    console.log(`Mandis synced: ${summary.mandis}`);
    console.log(`Crop catalog entries synced: ${summary.cropCatalog}`);
    console.log(`Managers synced: ${summary.managers}`);
    console.log(`Farmer account synced: ${summary.farmer}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
};

bootstrapProduction();
