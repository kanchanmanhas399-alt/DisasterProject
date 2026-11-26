const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
}, { timestamps: true });

module.exports = mongoose.model('DisasterEmailRecipient', schema);
