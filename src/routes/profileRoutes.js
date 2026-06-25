const express = require('express');
const router = express.Router();
const axios = require('axios');

const XANO_AUTH_URL = process.env.XANO_API_URL;

// Extrae el Bearer token del header sin pasar por activeTokens
const extractToken = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : h || null;
};

// GET /api/profile/:id — Xano valida el token
router.get('/:id', async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const { data } = await axios.get(
      `${XANO_AUTH_URL}/profile/${req.params.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    return res.status(status).json(err.response?.data || { error: err.message });
  }
});

// PATCH /api/profile/:id — Xano valida el token y actualiza
router.patch('/:id', async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const { data } = await axios.patch(
      `${XANO_AUTH_URL}/profile/${req.params.id}`,
      req.body,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    return res.status(status).json(err.response?.data || { error: err.message });
  }
});

// PUT /api/profile/:id — alias de PATCH
router.put('/:id', async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const { data } = await axios.patch(
      `${XANO_AUTH_URL}/profile/${req.params.id}`,
      req.body,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    return res.status(status).json(err.response?.data || { error: err.message });
  }
});

module.exports = router;
