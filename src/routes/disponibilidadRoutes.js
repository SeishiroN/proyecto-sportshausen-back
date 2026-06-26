const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getXanoToken } = require('../middlewares/authMiddleware');

const XANO_DISP_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:disponibilidad/disponibilidad';

// GET /api/disponibilidad — obtener fechas del usuario autenticado
router.get('/', async (req, res) => {
  try {
    const token = getXanoToken(req);
    const response = await axios.get(XANO_DISP_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json(response.data);
  } catch (err) {
    console.error('GET /disponibilidad error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});

// POST /api/disponibilidad — crear o actualizar una fecha
router.post('/', async (req, res) => {
  try {
    const token = getXanoToken(req);
    const { fecha, status, razon } = req.body;
    console.log('📤 POST Xano body:', { fecha, status, razon });
    console.log('📤 POST Xano URL:', XANO_DISP_URL);
    console.log('📤 Token presente:', !!token);
    const response = await axios.post(XANO_DISP_URL, { fecha, status, razon }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✅ Xano response status:', response.status);
    console.log('✅ Xano response data:', JSON.stringify(response.data));
    res.json(response.data);
  } catch (err) {
    console.error('❌ POST /disponibilidad error status:', err.response?.status);
    console.error('❌ POST /disponibilidad error data:', JSON.stringify(err.response?.data));
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});

// DELETE /api/disponibilidad/:fecha — eliminar una fecha
router.delete('/:fecha', async (req, res) => {
  try {
    const token = getXanoToken(req);
    const { fecha } = req.params;
    const response = await axios.delete(`${XANO_DISP_URL}/${fecha}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json(response.data || {});
  } catch (err) {
    console.error('DELETE /disponibilidad error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});

module.exports = router;
