const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/email.util");
const fs = require("fs");
const saltRound = 10;
const cloudinary = require("cloudinary").v2;

require("dotenv").config();

// Home Page
async function getIndex(req, res) {
  res.status(200).json({
    success: true,
    message: "Backend is working ✅. Frontend will be deployed separately soon.",
    frontendURL: null
  });
}


// Get Users List with Email & Password
async function listUsers(req,res) {
  try {
    const users = await User.find({}); // Select specific fields
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
}

async function sendOtp(req, res) {
  try {
    console.log("Request to send OTP:", req.body);
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    console.log("Request to send OTP to:", email);

    await generateOtp(email);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error("Error in sendOtp:", error.message);
    res.status(400).json({ message: 'Server error' });
  }
}
async function sendOtpSignup(req, res) {
    try {
      console.log("Request to send OTP:", req.body);
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
  
      console.log("Request to send OTP to:", email);
  
      let user = await User.findOne({ email });
  
      if (!user) {
        // Create new user with just email for now (minimal signup flow)
        user = new User({ email });
        await user.save();
        await generateOtp(email);
        res.status(200).json({ message: 'OTP sent successfully' });
      }
      else {
        res.status(400).json({ message: 'User Exist' });
      }
    } catch (error) {
      console.error("Error in sendOtp:", error.message);
      res.status(400).json({ message: 'Server error' });
    }
  }
async function checkOtp(req, res) {
    console.log("Request to check OTP:", req.body);
    const { email, otp } = req.body;

    try {
        // Step 1: Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Step 2: Check if OTP is correct
        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Step 3: Check if OTP is expired
        if (Date.now() > user.otpExpiry) {
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }

        // Step 4: Clear OTP and mark as verified
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.isEmailVerified = true; // Mark email as verified
        await user.save();

        // Step 5: Return success
        return res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
        console.error('Error during OTP verification:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

async function addUser(req, res) {
    console.log(req.body);
    try {
      let user = await User.findOne({ email: req.body.email });
  
      if (!user) {
        // User doesn't exist → create new user
        const hashPassword = bcrypt.hashSync(req.body.password, saltRound);
        user = new User({
          email: req.body.email,
          password: hashPassword,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
        });
        await user.save();
      } else {
        // User exists → update user
        const hashPassword = bcrypt.hashSync(req.body.password, saltRound);
        user.password = hashPassword;
        user.firstName= req.body.firstName,
        user.lastName= req.body.lastName,
        await user.save();
      }
  
      res.status(200).send({ success: true, message: 'User saved successfully' , user });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(400).send({ success: false, message: 'Something went wrong' });
    }
  }
  
  async function login(req, res) {
    try {
        console.log("Login request:", req.body);
      const user = await User.findOne({ email: req.body.email });
  
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }
  
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (!isMatch) {
        return res.status(401).send({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      user.lastLogin = Date.now();
      await user.save();
  
      res.status(200).json({ token, user }); // ✅ Send user, not "data"
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ message: 'Server error' });
    }
  }
  
async function generateOtp(email) {
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

  await User.updateOne(
    { email },
    {
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000 // 5 minutes
    }
  );

  const subject = 'Your OTP for Verification';
  const body = `<p>Your OTP is: <strong>${otp}</strong></p><p>This OTP is valid for 5 minutes.</p>`;

  await sendEmail(email, subject, body);

  console.log(`OTP ${otp} sent to ${email}`);
}
async function userProfile(req,res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
        userName: user.name,
        email: user.email,
        picLink: user.profilePic,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}
async function uploadProfilePic(req, res) {
  try {
    const file = req.file;
    const email = req.body.email;

    if (!file || !email) {
      return res.status(400).json({ error: 'File or email missing' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "user_profiles",
      use_filename: true,
      unique_filename: false,
    });

    // Clean up local file
    fs.unlinkSync(file.path);

    // Update user document
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.picLink = result.secure_url;
    await user.save();

    res.status(200).json({ picLink: result.secure_url });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: 'Server error during upload' });
  }
}
async function resetPassword(req, res) {
  const { email, newPassword } = req.body;

  try {
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRound);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateAddress = async (req, res) => {
  const { email, address } = req.body
  if (!email || !address) return res.status(400).json({ message: 'Email and address are required' })

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { address },
      { new: true }
    )
    if (!user) return res.status(404).json({ message: 'User not found' })

    res.status(200).json({ message: 'Address updated', user })
  } catch (err) {
    console.error('Address update error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// 🔹 Update Phone
const updatePhone = async (req, res) => {
  const { email, phone } = req.body
  if (!email || !phone) return res.status(400).json({ message: 'Email and phone are required' })

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { phone },
      { new: true }
    )
    if (!user) return res.status(404).json({ message: 'User not found' })

    res.status(200).json({ message: 'Phone updated', user })
  } catch (err) {
    console.error('Phone update error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// 🔹 Update GST
const updateGST = async (req, res) => {
  const { email, gst } = req.body
  if (!email || !gst) return res.status(400).json({ message: 'Email and GST are required' })

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { gst },
      { new: true }
    )
    if (!user) return res.status(404).json({ message: 'User not found' })

    res.status(200).json({ message: 'GST updated', user })
  } catch (err) {
    console.error('GST update error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}
module.exports = {
  getIndex,
  listUsers,
  login,
  sendOtp,
  userProfile,
  uploadProfilePic,
  addUser,
  checkOtp,
  resetPassword,
  sendOtpSignup,
  updateAddress,
  updatePhone,
  updateGST,
}