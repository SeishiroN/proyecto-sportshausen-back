const express = require('express');
const router = express.Router();
const xanoService = require('../services/xanoService');

// GET /api/profile/:id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    // Intentar obtener datos desde Xano usando el token y el id (preferir /profile/{id})
    const userResult = await xanoService.getProfileById(token, id);
    if (userResult.success && userResult.data) {
      return res.json(userResult.data);
    }

    // Fallback: intentar con getUserData
    const fallback = await xanoService.getUserData(token, id);
    if (fallback.success && fallback.data) {
      return res.json(fallback.data);
    }

    // Si no, devolver 404
    return res.status(404).json({ error: 'Perfil no encontrado' });
  } catch (err) {
    console.error('Error en /api/profile/:id', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
