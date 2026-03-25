require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize, connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load models + associations
require('./models');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookingRoutes = require('./routes/bookings');
const mandiRoutes = require('./routes/mandis');
const slotRoutes = require('./routes/slots');
const priceRoutes = require('./routes/prices');
const notificationRoutes = require('./routes/notifications');
const issueRoutes = require('./routes/issues');
const auditLogRoutes = require('./routes/auditLogs');
const dashboardRoutes = require('./routes/dashboard');
const adminBootstrapRoutes = require('./routes/admin-bootstrap');

const app = express();

const allowedOrigins = [
  'https://mandi-book-seven.vercel.app',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()).filter(Boolean) : []),
];

// ─── Security ───────────────────────────────────────────────────────────────────
app.use(helmet());

// ─── Rate limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// ─── CORS ───────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

// ─── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Platform health checks ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: 'MandiBook API is running', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'MandiBook API is healthy', timestamp: new Date().toISOString() });
});

// ─── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MandiBook API is running', timestamp: new Date().toISOString() });
});

// ─── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/mandis', mandiRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin-bootstrap', adminBootstrapRoutes);

// ─── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Error handler ──────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  // Sync all models with database (alter: true adds missing columns without dropping)
  await sequelize.sync({ alter: true });
  console.log('Database tables synced');

  app.listen(PORT, () => {
    console.log(`\n🚀 MandiBook API running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   Database: PostgreSQL`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();

module.exports = app;
