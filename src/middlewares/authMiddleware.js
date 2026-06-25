
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
 * Middleware protect: Verifica que el usuario esté autenticado
 * Similar a verifyAuth pero con nombres más comunes
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación',
        message: 'Por favor inicia sesión'
      });
    }

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
    req.token = token;
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
 * Middleware requireRole: Verifica que el usuario tenga un rol específico
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    const userRole = req.user.role || req.user.tipo_usuario || req.user.type;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Permiso denegado',
        message: `Se requiere uno de los siguientes roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * softProtect: valida el Bearer token contra Xano y extrae id/role reales.
 * Intenta múltiples endpoints conocidos de Xano hasta obtener datos del usuario.
 * NO confía en headers del cliente para rol o id.
 */
const axios = require('axios');
const softProtect = async (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : h || null;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token requerido' });
  }

  const xanoBase = process.env.XANO_API_URL;
  const authCfg = { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 };
  const endpoints = ['/auth/me', '/user', '/auth/user', '/users/me'];

  for (const ep of endpoints) {
    try {
      const { data } = await axios.get(`${xanoBase}${ep}`, authCfg);
      if (data && (data.id || data.user_id)) {
        req.token = token;
        req.user = {
          id: data.id || data.user_id,
          role: data.role || data.tipo_usuario || null
        };
        return next();
      }
    } catch (_) {
      // continuar al siguiente endpoint
    }
  }

  return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
};

module.exports = {
  verifyAuth,
  storeToken,
  removeToken,
  protect,
  requireRole,
  softProtect
};
