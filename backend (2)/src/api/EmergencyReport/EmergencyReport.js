const mongoose = require('mongoose');

const emergencyReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  disasterId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  disasterType: {
    type: String,
    required: true,
    trim: true,
    default: 'Other'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true,
    default: 'Medium'
  },
  description: {
    type: String,
    required: true
  },
  affectedPeople: {
    type: Number,
    default: 0
  },
  dateTime: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String,
    default: ''
  },
  isSOS: {
    type: Boolean,
    default: false
  },
  contactNumber: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Responding', 'Resolved', 'Verified', 'In-Progress', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  responseInstructions: {
    type: String,
    default: ''
  },
  adminNotes: {
    type: String,
    default: ''
  },
  statusHistory: [{
    status: { type: String, required: true },
    note: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.Mixed, default: null },
    changedByName: { type: String, default: 'Admin' },
    changedAt: { type: Date, default: Date.now }
  }],
  assessment: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isDelete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EmergencyReport', emergencyReportSchema);
