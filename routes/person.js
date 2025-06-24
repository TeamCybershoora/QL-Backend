const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const UserPerson = require('../models/Person');

// Multer config (in-memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// =======================
// ✅ POST: Add person
// =======================
router.post('/add/person', upload.single('img'), async (req, res) => {
  try {
    const { email, name, mobile, address, type } = req.body;
    const file = req.file;

    if (!email || !name || !mobile || !address || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const savePerson = async (imageUrl = '') => {
      const personData = { type, name, mobile, address, img: imageUrl };

      let userPerson = await UserPerson.findOne({ user: user._id });

      if (userPerson) {
        userPerson.persons.push(personData);
      } else {
        userPerson = new UserPerson({
          user: user._id,
          persons: [personData]
        });
      }

      await userPerson.save();
      return res.status(201).json({ message: 'Person added successfully' });
    };

    if (file) {
      cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'persons' },
        async (error, result) => {
          if (error) {
            console.error('Cloudinary Error:', error);
            return res.status(500).json({ message: 'Image upload failed' });
          }
          await savePerson(result.secure_url);
        }
      ).end(file.buffer);
    } else {
      await savePerson();
    }
  } catch (err) {
    console.error('Add Person Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// ✅ PUT: Edit person
// =======================
router.put('/edit/person', upload.single('img'), async (req, res) => {
  try {
    const { email, _id, name, mobile, address, type } = req.body;
    const file = req.file;

    if (!email || !_id || !name || !mobile || !address || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userPerson = await UserPerson.findOne({ user: user._id });
    if (!userPerson) return res.status(404).json({ message: 'Person list not found' });

    const personIndex = userPerson.persons.findIndex(p => p._id.toString() === _id);
    if (personIndex === -1) return res.status(404).json({ message: 'Person not found' });

    const updatePerson = async (imageUrl = null) => {
      userPerson.persons[personIndex].name = name;
      userPerson.persons[personIndex].mobile = mobile;
      userPerson.persons[personIndex].address = address;
      userPerson.persons[personIndex].type = type;
      if (imageUrl) userPerson.persons[personIndex].img = imageUrl;

      await userPerson.save();
      return res.status(200).json({ message: 'Person updated successfully' });
    };

    if (file) {
      cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'persons' },
        async (error, result) => {
          if (error) {
            console.error('Cloudinary Error:', error);
            return res.status(500).json({ message: 'Image upload failed' });
          }
          await updatePerson(result.secure_url);
        }
      ).end(file.buffer);
    } else {
      await updatePerson();
    }
  } catch (err) {
    console.error('Edit Person Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// ✅ DELETE: Delete person
// =======================
router.delete('/delete/person', async (req, res) => {
  try {
    const { email, _id } = req.body;

    if (!email || !_id) {
      return res.status(400).json({ message: 'Missing email or _id' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userPerson = await UserPerson.findOne({ user: user._id });
    if (!userPerson) return res.status(404).json({ message: 'Person list not found' });

    const initialLength = userPerson.persons.length;
    userPerson.persons = userPerson.persons.filter(p => p._id.toString() !== _id);

    if (userPerson.persons.length === initialLength) {
      return res.status(404).json({ message: 'Person not found in list' });
    }

    await userPerson.save();
    res.status(200).json({ message: 'Person deleted successfully' });
  } catch (err) {
    console.error('Delete Person Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// ✅ GET: Get all persons
// =======================
router.get('/get/persons', async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userPerson = await UserPerson.findOne({ user: user._id });
    if (!userPerson) return res.status(200).json({ chefs: [], members: [] });

    const chefs = userPerson.persons.filter(p => p.type === 'chef');
    const members = userPerson.persons.filter(p => p.type === 'member');

    res.status(200).json({ chefs, members });
  } catch (err) {
    console.error('Fetch Persons Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
