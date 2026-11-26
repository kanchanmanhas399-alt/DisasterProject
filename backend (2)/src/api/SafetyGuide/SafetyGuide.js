const mongoose = require('mongoose');

const safetyGuideSchema = new mongoose.Schema({
  disasterType: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  shortIntro: {
    type: String,
    default: ''
  },
  beforePrecautions: [{
    type: String
  }],
  duringInstructions: [{
    type: String
  }],
  afterPrecautions: [{
    type: String
  }],
  emergencyChecklist: [{
    type: String
  }],
  preventiveMeasures: [{
    type: String
  }],
  image: {
    type: String,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isDelete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SafetyGuide', safetyGuideSchema);
