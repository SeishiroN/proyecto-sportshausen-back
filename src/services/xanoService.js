const axios = require('axios');

const xanoAPI = axios.create({
  baseURL: process.env.XANO_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Llamar al endpoint de login de Xano
 */
const login = async (email, password) => {
  try {
    const response = await xanoAPI.post('/auth/login', {
      email,
      password
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

/**
 * Obtener información del usuario - versión mejorada
 * Intenta múltiples rutas y endpoints
 */
const getUserData = async (token, userId = null) => {
  console.log('🔍 getUserData - Buscando usuario. Token:', token ? 'yes' : 'no', 'UserId:', userId);

  // Lista de endpoints a intentar en orden
  const endpointsToTry = [];
  
  // Si tenemos userId, intentar endpoints específicos primero
  if (userId) {
    endpointsToTry.push({
      method: 'get',
      url: `/users/${userId}`,
      headers: { 'Authorization': `Bearer ${token}` },
      name: `GET /users/${userId}`
    });
    endpointsToTry.push({
      method: 'get',
      url: `/user/${userId}`,
      headers: { 'Authorization': `Bearer ${token}` },
      name: `GET /user/${userId}`
    });
  }

  // Endpoints genéricos
  endpointsToTry.push({
    method: 'get',
    url: '/user',
    headers: { 'Authorization': `Bearer ${token}` },
    name: 'GET /user'
  });

  endpointsToTry.push({
    method: 'get',
    url: '/auth/user',
    headers: { 'Authorization': `Bearer ${token}` },
    name: 'GET /auth/user'
  });

  endpointsToTry.push({
    method: 'get',
    url: '/users/me',
    headers: { 'Authorization': `Bearer ${token}` },
    name: 'GET /users/me'
  });

  for (const endpoint of endpointsToTry) {
    try {
      console.log(`  → Intentando: ${endpoint.name}`);
      const config = {
        headers: endpoint.headers
      };
      
      const response = await xanoAPI[endpoint.method](endpoint.url, config);
      
      if (response.data) {
        console.log(`  ✅ Éxito en ${endpoint.name}:`, {
          hasRole: !!response.data.role,
          role: response.data.role || 'N/A',
          email: response.data.email,
          id: response.data.id
        });
        return {
          success: true,
          data: response.data,
          endpoint: endpoint.name
        };
      }
    } catch (err) {
      const status = err.response?.status || 'unknown';
      console.log(`  ⚠️ Falló ${endpoint.name}: status ${status}`);
    }
  }

  console.log('❌ Todos los endpoints fallaron, no se puede obtener rol');
  return {
    success: false,
    data: null,
    endpoint: 'none'
  };
};

/**
 * Obtener información del usuario actual usando token o ID
 * (mantenido para compatibilidad)
 */
const getCurrentUser = async (token, userId = null) => {
  return await getUserData(token, userId);
};

/**
 * Validar token con Xano
 */
const validateToken = async (token) => {
  try {
    const response = await xanoAPI.get('/auth/validate', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

/**
 * Logout con Xano (si lo soporta)
 */
const logout = async (token) => {
  try {
    const response = await xanoAPI.post('/auth/logout', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

/**
 * Signup con Xano
 */
const signup = async (name, email, password, role = 'luchador') => {
  try {
    console.log('🚀 xanoService.signup - Enviando a Xano:', {
      nombre_artistico: name,
      email,
      password: '***',
      role: role
    });
    // Enviar EXACTAMENTE con los valores que Xano espera
    const response = await xanoAPI.post('/auth/signup', {
      nombre_artistico: name,
      email,
      password,
      role: role  // Valores permitidos: luchador, booker, agrupacion, admin
    });
    console.log('✅ XANO RESPONSE SUCCESS:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ XANO ERROR DETAILS:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

/**
 * Enviar email de bienvenida
 */
const sendWelcomeEmail = async (userId) => {
  try {
    const response = await xanoAPI.post('/message/send_welcome_email', {
      user_id: userId
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

module.exports = {
  login,
  getCurrentUser,
  validateToken,
  logout,
  signup,
  sendWelcomeEmail
};
