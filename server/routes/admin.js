const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notice = require('../models/Notice');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get admin statistics
router.get('/stats', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalNotices = await Notice.countDocuments();
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalStudents,
      totalFaculty,
      totalNotices,
      recentUsers
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single user by ID - THIS IS THE MISSING ROUTE
router.get('/users/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user
router.post('/users', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { email, password, role, program, fullName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      role,
      program,
      fullName,
      createdBy: req.user.id
    });

    await user.save();

    res.status(201).json({ message: 'User created successfully', user: { id: user._id, email: user.email } });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/users/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { fullName, email, role, program, isActive, password } = req.body;
    
    const updateData = { fullName, email, role, program, isActive };
    
    // Only update password if provided
    if (password && password.length > 0) {
      const user = await User.findById(req.params.id);
      if (user) {
        user.password = password;
        await user.save();
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

