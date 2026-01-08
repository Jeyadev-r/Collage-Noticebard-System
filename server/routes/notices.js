const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { authenticateToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/notices - Public
router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate('createdBy', 'email role fullName')
      .sort({ publishedAt: -1 });
    
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/notices/calendar
router.get('/calendar', async (req, res) => {
  try {
    const notices = await Notice.find({ eventDate: { $ne: null } })
      .populate('createdBy', 'email fullName');
    
    const events = notices.map(notice => ({
      id: notice._id,
      title: notice.title,
      start: notice.eventDate,
      description: notice.body,
      department: notice.department,
      priority: notice.priority
    }));
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/notices - with optional image upload
router.post('/', authenticateToken, authorize('faculty', 'admin'), upload.single('image'), async (req, res) => {
  try {
    const { title, body, department, eventDate, priority } = req.body;

    const noticeData = {
      title,
      body,
      department: department || 'General',
      createdBy: req.user.id,
      priority: priority || 'medium'
    };

    if (eventDate) {
      noticeData.eventDate = new Date(eventDate);
    }

    if (req.file) {
      noticeData.imageName = req.file.filename;
    }

    const notice = new Notice(noticeData);
    await notice.save();
    await notice.populate('createdBy', 'email role fullName');

    res.status(201).json({
      message: 'Notice created successfully',
      notice
    });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/notices/:id
router.put('/:id', authenticateToken, authorize('faculty', 'admin'), upload.single('image'), async (req, res) => {
  try {
    const { title, body, department, eventDate, priority } = req.body;

    const updateData = { title, body, department, priority };
    
    if (eventDate) {
      updateData.eventDate = new Date(eventDate);
    }

    if (req.file) {
      updateData.imageName = req.file.filename;
    }

    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'email role fullName');

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    res.json({
      message: 'Notice updated successfully',
      notice
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/notices/:id
router.delete('/:id', authenticateToken, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
