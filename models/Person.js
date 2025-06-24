const mongoose = require('mongoose');

const personSubSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['chef', 'member'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  img: {
    type: String,
    default: ''
  }
}, { _id: true });

const PersonSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  persons: [personSubSchema]
}, { timestamps: true });

module.exports = mongoose.model('Person', PersonSchema);
