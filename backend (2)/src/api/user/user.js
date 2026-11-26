const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: Number,
    // required: true
  },
    otp :{
      type:String
      
    },
    expireOtp : {
      type:String
    },
  userType: {
    type: String,
    enum: ['citizen', 'responder', 'admin'],
    default: 'citizen'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
    isDelete : {type : Boolean, default: false},
    createdAt: { type: Date, default: new Date },
    updatedAt : { type: Date, default: null }
}, {
  timestamps: true // Automatically handles createdAt and updatedAt
});

module.exports = mongoose.model('User', userSchema);