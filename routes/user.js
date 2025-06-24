const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const bodyParser = require('body-parser');
const multer = require("multer");

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

module.exports = router;
