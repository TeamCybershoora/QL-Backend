// routes/businessRoutes.js
const express = require('express');
const router = express.Router();
const { getBusiness, updateBusiness } = require('../controllers/businessController');

router.get('/business/name', getBusiness);
router.post('/update/business/name', updateBusiness);

module.exports = router;
