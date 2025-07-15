const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const bodyParser = require('body-parser');
const multer = require("multer");
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Update this path as per your project

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


router.use(bodyParser.urlencoded({
    extended: false
}))
const uploader = multer({
    storage: multer.diskStorage({}),
    limits: { fileSize: 10 * 1024 * 1024 },
  });
router.use(express.urlencoded({extended: false}))

router.get('/', (req,res)=>{
    userController.getIndex(req,res)
});

router.get('/listUsers', (req,res)=>{
    userController.listUsers(req,res)
});

router.get("/user/profile",(req,res)=>{
    userController.userProfile(req,res)
});

router.post('/send/otp', (req, res) => {
    userController.sendOtp(req,res)
});
router.post('/send/otp/signup', (req, res) => {
    userController.sendOtpSignup(req,res)
});
router.post('/check/otp', (req, res) => {
    userController.checkOtp(req,res)
});
router.post('/signup', ( req, res ) => {
    userController.addUser(req,res)
})
router.post('/login', ( req, res )=> {   
    userController.login(req, res)   
})
router.post("/reset/password", userController.resetPassword);

router.post('/upload/profile', uploader.single("file"),(req, res)=> {
    userController.uploadProfilePic(req, res)
})
router.post('/update/address', (req, res) => {
    userController.updateAddress(req, res);
});
router.post('/update/phone', (req, res) => {
    userController.updatePhone(req, res);
});
router.post('/update/gst', (req, res) => {
    userController.updateGST(req, res);
});

router.post('/auth/google', async (req, res) => {
  const { token } = req.body;
  console.log("🔐 [Google Auth] Received token:", token?.slice(0, 30) + "..."); // Only partial token for safety

  try {
    // Step 1: Verify Google ID Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    console.log("📩 [Google Auth] Payload received:", {
      email,
      firstName: given_name,
      lastName: family_name,
      picture
    });

    // Step 2: Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      try {
        user = await User.create({
          firstName: given_name,
          lastName: family_name,
          email,
          picLink: picture,
          password: null, // not required for Google login
          googleLogin: true,
        });
        console.log("✅ [Google Auth] User created:", user._id);
      } catch (err) {
        console.error("❌ [Google Auth] User creation failed:", err);
        return res.status(500).json({ message: "Signup failed", error: err.message });
      }
    } else {
      console.log("👤 [Google Auth] Existing user found:", user._id);
    }

    // Step 3: Generate JWT
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log("🔑 [Google Auth] JWT token generated");

    return res.json({ token: jwtToken, user });

  } catch (error) {
    console.error('❌ [Google Auth] Google Login Error:', error.message);
    return res.status(401).json({ message: 'Invalid Google token' });
  }
});

module.exports = router;
