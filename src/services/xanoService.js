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
const signup = async (name, email, password) => {
  try {
    const response = await xanoAPI.post('/auth/signup', {
      name,
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
  validateToken,
  logout,
  signup,
  sendWelcomeEmail
};
