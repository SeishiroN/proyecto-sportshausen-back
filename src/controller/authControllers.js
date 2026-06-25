const xanoService = require('../services/xanoService');
const userMapService = require('../services/userMapService');
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Formato de email inválido' });
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


    // Extraer token de la respuesta de Xano en múltiples formas posibles
    const extractToken = (obj) => {
      if (!obj) return null;
      const candidates = [
        'authToken',
        'token',
        'access_token',
        'auth_token'
      ];
      for (const k of candidates) {
        if (obj[k]) return obj[k];
      }
      // Buscar en nested `data` o cualquier propiedad que contenga 'token' en el nombre
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string' && key.toLowerCase().includes('token')) return val;
        if (val && typeof val === 'object') {
          const nested = extractToken(val);
          if (nested) return nested;
        }
      }
      // Heurística: buscar cualquier string que parezca JWT (tres partes separadas por '.')
      const findJWT = (o) => {
        if (!o) return null;
        if (typeof o === 'string' && o.split('.').length === 3) return o;
        if (typeof o === 'object') {
          for (const k of Object.keys(o)) {
            const res = findJWT(o[k]);
            if (res) return res;
          }
        }
        return null;
      };
      return findJWT(obj);
    };

    const token = extractToken(xanoResponse.data);
    const userId = xanoResponse.data.user_id || xanoResponse.data.id || xanoResponse.data.user?.id;
    
    // Paso 1: rol desde mapeo local
    let userRole = userMapService.getUserRole(email);

    // Paso 2: rol desde Xano
    if (!userRole && token) {
      const userResponse = await xanoService.getUserData(token, userId);
      if (userResponse.success && userResponse.data?.role) {
        userRole = userResponse.data.role;
      }
    }

    // Paso 3: default
    if (!userRole) userRole = 'luchador';

    if (token) {
      storeToken(token, {
        id: userId,
        email,
        role: userRole
      });
    }

    const responseData = {
      authToken: token,
      user: {
        role: userRole,
        email: email,
        id: userId
      }
    };

    // Enriquecer con full_name / nombre_artistico desde Xano
    try {
      if (token && userId) {
        const xanoProfile = await xanoService.getProfileById(token, userId);
        const profileData = xanoProfile.success ? xanoProfile.data
          : (await xanoService.getUserData(token, userId)).data;
        if (profileData) {
          if (profileData.full_name) responseData.user.full_name = profileData.full_name;
          if (profileData.nombre_artistico) responseData.user.nombre_artistico = profileData.nombre_artistico;
        }
      }
    } catch (e) {
      // No crítico — login sigue adelante sin estos campos
    }

    // Retornar la respuesta con el rol incluido
    return res.status(200).json({
      success: true,
      data: responseData,
      message: 'Login exitoso'
    });

  } catch (error) {
    console.error('❌ LOGIN ERROR:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Formato de email inválido' });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'El nombre debe tener al menos 2 caracteres' });
    }

    // Validar rol
    const validRoles = ['luchador', 'booker', 'agrupacion'];
    // Normalizar: agrupación -> agrupacion
    let normalizedRole = role ? role.toLowerCase().trim() : 'luchador';
    if (normalizedRole === 'agrupación') normalizedRole = 'agrupacion';
    
    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido. Debe ser: luchador, booker o agrupacion'
      });
    }
    
    // Usar el rol normalizado
    const finalRole = normalizedRole;

    const xanoResponse = await xanoService.signup(name, email, password, finalRole);

    if (!xanoResponse.success) {
      return res.status(xanoResponse.status).json({
        success: false,
        error: xanoResponse.error,
        message: 'Error al crear la cuenta'
      });
    }

    const token = xanoResponse.data.authToken || xanoResponse.data.token;
    
    // Para signup, SIEMPRE devolver el rol que se normalizó y validó
    const userId = xanoResponse.data.user_id || xanoResponse.data.id;
    
    // 💾 Guardar el usuario en el mapeo local (para que login pueda obtener el rol)
    userMapService.saveUser(email, finalRole, {
      nombre_artistico: name,
      user_id: userId
    });

    // Guardar token en memoria si se proporcionó
    if (token) {
      storeToken(token, {
        email: email,
        name: name,
        role: finalRole
      });
    }

    // Enviar email de bienvenida automáticamente
    if (userId) {
      try {
        await xanoService.sendWelcomeEmail(userId);
      } catch (emailError) {
        console.error('Error al enviar email de bienvenida:', emailError);
        // No detener el flujo si falla el email
      }
    }

    // Construir respuesta - siempre con el rol que se registró (normalizado)
    const responseData = {
      authToken: token,
      user: {
        id: userId,
        email: email,
        nombre_artistico: name,
        role: finalRole  // ✅ SIEMPRE el rol correcto y normalizado
      }
    };

    // Retornar la respuesta
    return res.status(201).json({
      success: true,
      data: responseData,
      message: 'Cuenta creada exitosamente'
    });

  } catch (error) {
    console.error('❌ SIGNUP ERROR:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
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
