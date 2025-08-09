const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route de connexion
router.post('/login', authController.login);

// Route de déconnexion
router.post('/logout', authController.logout);

module.exports = router;
