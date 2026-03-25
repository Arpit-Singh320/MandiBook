const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

const router = express.Router();

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

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await User.create({
      name,
      role: 'admin',
      email,
      password: hashedPassword,
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
