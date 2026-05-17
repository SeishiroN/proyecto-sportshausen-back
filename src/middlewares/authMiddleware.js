const axios = require('axios');
const jwt = require('jsonwebtoken');

// Almacenamiento en memoria para tokens activos (en producción usar Redis)
const activeTokens = new Map();

/**
 * Middleware para verificar que el usuario está autenticado
 */
const verifyAuth = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación',
        message: 'Por favor inicia sesión'
      });
    }

    // Extraer token (formato: Bearer <token>)
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    // Verificar si el token está en la lista de activos
    if (!activeTokens.has(token)) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
        message: 'Por favor inicia sesión nuevamente'
      });
    }

    // Obtener datos del token
    const tokenData = activeTokens.get(token);
    
    // Adjuntar usuario al objeto request
    req.user = tokenData;
    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error al validar token',
      message: error.message
    });
  }
};

/**
 * Guardar token en memoria (en producción usar base de datos o Redis)
 */
const storeToken = (token, userData) => {
  activeTokens.set(token, {
    ...userData,
    timestamp: Date.now()
  });
};

/**
 * Remover token (logout)
 */
const removeToken = (token) => {
  activeTokens.delete(token);
};

/**
 * Validar token con Xano (opcional - si Xano proporciona endpoint de validación)
 */
const validateTokenWithXano = async (token) => {
  try {
    const response = await axios.get(
      `${process.env.XANO_API_URL}/auth/validate`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

module.exports = {
  verifyAuth,
  storeToken,
  removeToken,
  validateTokenWithXano
};
