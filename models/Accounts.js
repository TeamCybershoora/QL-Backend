const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accounts: [
    {
      category: { type: String, required: true },
      amount:   { type: Number, required: true },
      month:    { type: String } // ✅ Added month field
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
