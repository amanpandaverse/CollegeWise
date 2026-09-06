const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken, verifyToken } = require('../middleware/auth');

// Register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userRole = (role && role.toUpperCase() === 'ADMIN' && normalizedEmail === 'admin@collegewise.com') ? 'ADMIN' : 'STUDENT';

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insert.run(name.trim(), normalizedEmail, passwordHash, phone || null, userRole);
    const user = {
      id: result.lastInsertRowid,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone || null,
      role: userRole
    };

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    const token = generateToken(userProfile);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userProfile
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Current User profile
router.get('/me', verifyToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
});

module.exports = router;
