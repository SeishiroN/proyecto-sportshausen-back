const express = require('express');
const router = express.Router();
const authController = require('../controller/authControllers');
const { verifyAuth } = require('../middlewares/authMiddleware');

// Rutas de autenticación
router.post('/login', authController.login);
router.post('/logout', verifyAuth, authController.logout);

module.exports = router;
