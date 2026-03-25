const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

const router = express.Router();

// Debug endpoint to check admin user
router.get('/check-admin/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.scope('withPassword').findOne({
      where: { email, role: 'admin' }
    });

    if (!user) {
      return res.json({ success: false, message: 'Admin not found' });
    }

    res.json({
      success: true,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password,
        passwordLength: user.password?.length
      }
    });
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check admin user'
    });
  }
});

// Test password endpoint
router.post('/test-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.scope('withPassword').findOne({
      where: { email, role: 'admin' }
    });

    if (!user) {
      return res.json({ success: false, message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    res.json({
      success: true,
      email,
      passwordProvided: !!password,
      passwordMatch: isMatch,
      passwordHash: user.password.substring(0, 20) + '...'
    });
  } catch (error) {
    console.error('Test password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test password'
    });
  }
});

// Delete admin endpoint (for recreation)
router.delete('/delete-admin/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await User.destroy({ where: { email, role: 'admin' } });

    if (result === 0) {
      return res.json({ success: false, message: 'Admin not found' });
    }

    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete admin user'
    });
  }
});

// Temporary endpoint to create admin user
// Remove this after creating admin in production
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists'
      });
    }

    // Create admin user (User model will hash password automatically via beforeCreate hook)
    const admin = await User.create({
      name,
      role: 'admin',
      email,
      password: password, // Plain text - User model will hash it
      language: 'en',
      department: 'Platform Operations',
      twoFactorEnabled: true,
      profileComplete: true,
    });

    res.json({
      success: true,
      message: 'Admin user created successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user'
    });
  }
});

module.exports = router;
