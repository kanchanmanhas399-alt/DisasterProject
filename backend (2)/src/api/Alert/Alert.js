const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  disasterType: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical', 'Advisory', 'Watch', 'Warning', 'Emergency'],
    default: 'Medium',
    required: true
  },
  affectedArea: {
    type: String,
    required: true,
    trim: true
  },
  dateTime: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Expired', 'Cancelled'],
    default: 'Active'
  },
  isDelete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alert', alertSchema);
