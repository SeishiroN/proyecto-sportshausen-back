const xanoService = require('../services/xanoService');
const { storeToken, removeToken } = require('../middlewares/authMiddleware');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que los campos requeridos estén presentes
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    // Hacer llamada a Xano
    const xanoResponse = await xanoService.login(email, password);

    if (!xanoResponse.success) {
      return res.status(xanoResponse.status).json({
        success: false,
        error: xanoResponse.error,
        message: 'Credenciales inválidas'
      });
    }

    // Guardar token en memoria
    const token = xanoResponse.data.authToken || xanoResponse.data.token;
    if (token) {
      storeToken(token, {
        email: email,
        ...xanoResponse.data
      });
    }

    // Retornar la respuesta de Xano
    return res.status(200).json({
      success: true,
      data: xanoResponse.data,
      message: 'Login exitoso'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error interno del servidor'
    });
  }
};

const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    // Remover token del almacenamiento
    if (token) {
      removeToken(token);
    }

    // Intentar logout con Xano
    if (token) {
      await xanoService.logout(token);
    }

    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error al cerrar sesión'
    });
  }
};

module.exports = {
  login,
  logout
};
