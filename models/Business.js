const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'Pizza Hub',
    },
    email: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // ya 'User', jo bhi aapka user model ka naam ho
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Business', businessSchema);
