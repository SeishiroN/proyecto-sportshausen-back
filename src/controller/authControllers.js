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

const signup = async (req, res) => {
  try {
    const { name, email, password, role = 'luchador' } = req.body;

    // Validar que los campos requeridos estén presentes
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, email y contraseña son requeridos'
      });
    }

    // Validar rol
    const validRoles = ['luchador', 'booker', 'agrupación'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido. Debe ser: luchador, booker o agrupación'
      });
    }

    // Hacer llamada a Xano para signup
    const xanoResponse = await xanoService.signup(name, email, password, role);

    if (!xanoResponse.success) {
      return res.status(xanoResponse.status).json({
        success: false,
        error: xanoResponse.error,
        message: 'Error al crear la cuenta'
      });
    }

    // Guardar token en memoria si se proporcionó
    const token = xanoResponse.data.authToken || xanoResponse.data.token;
    if (token) {
      storeToken(token, {
        email: email,
        name: name,
        role: role,
        ...xanoResponse.data
      });
    }

    // Enviar email de bienvenida automáticamente
    const userId = xanoResponse.data.id || xanoResponse.data.user?.id;
    if (userId) {
      try {
        await xanoService.sendWelcomeEmail(userId);
      } catch (emailError) {
        console.error('Error al enviar email de bienvenida:', emailError);
        // No detener el flujo si falla el email
      }
    }

    // Retornar la respuesta de Xano
    return res.status(201).json({
      success: true,
      data: xanoResponse.data,
      message: 'Cuenta creada exitosamente'
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
  signup,
  logout
};
