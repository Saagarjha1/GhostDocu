const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const { jwtAuthMiddleware, generateToken } = require('../middleware/jwt');

//Signup route
router.post('/signup', async (req, res) => {
  try {
    const data = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const newUser = new User(data);
    const savedUser = await newUser.save();
    console.log('User saved');

    const payload = {
      id: savedUser._id,
      email: savedUser.email,
      role:savedUser.role,
    };

    const token = generateToken(payload);

    res.status(201).json({ user: payload, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const payload = {
      id: user._id,
      email: user.email,
      role:user.role
    };

    const token = generateToken(payload);
    res.status(200).json({ user: payload, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get current user
router.get('/me', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
