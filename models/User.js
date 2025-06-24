const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  address: {  
    type: String,
    default: "",
  },
  phone: {  
    type: String,
    default: "",
  },
  gst: {  
    type: String,
    default: "",
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
    minlength: 6
  },
  otp: {
    type: String
  },
   // OTP expiration time
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date
    },
    picLink: {
      type: String,
      default: "false" // Default value for profilePic
    }
  }, {
    timestamps: true // adds createdAt and updatedAt automatically
});


module.exports = mongoose.model('User', userSchema);