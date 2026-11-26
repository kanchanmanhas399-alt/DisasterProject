const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resourceId: {
    type: String,
    trim: true,
    default: ''
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Shelter', 'Hospital', 'Rescue Center', 'Emergency Support Center', 'Shelters', 'Hospitals', 'Rescue Centers', 'Emergency Support Centers', 'Other'],
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  contact: {
    type: String,
    required: true,
    trim: true
  },
  services: {
    type: String,
    default: ''
  },
  capacity: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Available', 'Full', 'Temporarily Closed', 'Unavailable', 'available', 'out_of_stock', 'pending'],
    default: 'Available'
  },
  image: {
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

module.exports = mongoose.model('Resource', resourceSchema);
