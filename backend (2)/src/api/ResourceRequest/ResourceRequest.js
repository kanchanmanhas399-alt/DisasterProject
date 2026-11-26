const mongoose = require('mongoose');

const resourceRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    default: null
  },
  resourceName: {
    type: String,
    required: true,
    trim: true
  },
  resourceType: {
    type: String,
    default: 'Shelter',
    trim: true
  },
  resourceReference: {
    type: String,
    default: '',
    trim: true
  },
  resourceAddress: {
    type: String,
    default: ''
  },
  resourceContact: {
    type: String,
    default: ''
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true
  },
  userPhone: {
    type: String,
    default: '',
    trim: true
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Waitlisted', 'Fulfilled', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  isDelete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ResourceRequest', resourceRequestSchema);
