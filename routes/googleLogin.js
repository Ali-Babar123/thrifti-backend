// routes/authRoutes.js
const express = require('express');
const { googleLogin } = require('../Controller/GoogleLogin');
const router = express.Router();

router.post('/google', googleLogin);

module.exports = router;
