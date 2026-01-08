const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  department: {
    type: String,
    enum: ['AIDA', 'AIML', 'CYB & IOT', 'MED ENG', 'General'],
    default: 'General'
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  eventDate: {
    type: Date,
    default: null
  },
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  imageName: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);

