const Business = require('../models/Business');
const User = require('../models/User'); // ya Student, jo bhi aap use kar rahe ho

exports.getBusiness = async (req, res) => {
    try {
      // GET request me email query params se aayega, isliye req.query.email use karenge
      const { email } = req.query;  
  
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
  
      // User find karo email se
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found with this email' });
      }
  
      // Business find karo user._id se
      let business = await Business.findOne({ email: user._id });
  
      if (!business) {
        // Agar business nahi mila to default bana do
        business = new Business({ email: user._id });
        await business.save();
      }
  
      res.status(200).json(business);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }; 

  exports.updateBusiness = async (req, res) => {
    try {
      const { name, email } = req.body;
  
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
  
      // User find karo email se
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found with this email' });
      }
  
      // Business find karo user._id se, agar nahi to naya bana do
      let business = await Business.findOne({ email: user._id });
  
      if (!business) {
        business = new Business({ name, email: user._id });
      } else {
        business.name = name;
      }
  
      await business.save();
  
      res.status(200).json({ message: 'Business updated', business });
    } catch (err) {
      res.status(500).json({ message: 'Update failed', error: err.message });
    }
  };  

