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

    // Hacer llamada a Xano
    const xanoResponse = await xanoService.login(email, password);

    if (!xanoResponse.success) {
      return res.status(xanoResponse.status).json({
        success: false,
        error: xanoResponse.error,
        message: 'Credenciales inválidas'
      });
    }

    console.log('📦 LOGIN XANO RESPONSE:', JSON.stringify(xanoResponse.data, null, 2));

    const token = xanoResponse.data.authToken || xanoResponse.data.token;
    const userId = xanoResponse.data.user_id || xanoResponse.data.id;
    
    // Intentar obtener el rol del email del usuario
    console.log('🔍 Buscando rol para email:', email);
    
    // Paso 1: Intentar obtener del mapeo local (usuarios que se registraron con nuestra app)
    let userRole = userMapService.getUserRole(email);
    
    // Paso 2: Si no está en el mapeo local, intentar obtener de Xano
    if (!userRole && token) {
      console.log('📡 Intentando obtener rol de Xano...');
      const userResponse = await xanoService.getUserData(token, userId);
      if (userResponse.success && userResponse.data && userResponse.data.role) {
        userRole = userResponse.data.role;
        console.log('✅ Rol obtenido de Xano:', userRole);
      }
    }
    
    // Paso 3: Usar default si no se pudo obtener
    if (!userRole) {
      console.log('⚠️ No se pudo obtener rol, usando default: luchador');
      userRole = 'luchador';
    }

    console.log('✅ LOGIN - Final role:', userRole);

    // Guardar token en memoria
    if (token) {
      storeToken(token, {
        email: email,
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

    console.log('📤 LOGIN RESPONSE:', JSON.stringify(responseData, null, 2));

    // Retornar la respuesta con el rol incluido
    return res.status(200).json({
      success: true,
      data: responseData,
      message: 'Login exitoso'
    });

  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
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

    console.log('📋 SIGNUP REQUEST:', {
      name: name ? `✅ ${name}` : '❌ undefined',
      email: email ? `✅ ${email}` : '❌ undefined',
      password: password ? `✅ (${password.length} chars)` : '❌ undefined',
      role: role ? `✅ ${role}` : '❌ undefined',
      allBody: req.body
    });

    // Validar que los campos requeridos estén presentes
    if (!name || !email || !password) {
      console.log('❌ VALIDATION FAILED: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Nombre, email y contraseña son requeridos'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      console.log('❌ VALIDATION FAILED: Password too short');
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 8 caracteres'
      });
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

    // Hacer llamada a Xano para signup
    console.log('🔄 Llamando a xanoService.signup con role normalizado:', finalRole);
    const xanoResponse = await xanoService.signup(name, email, password, finalRole);
    console.log('📦 XANO RESPONSE:', JSON.stringify(xanoResponse, null, 2));

    if (!xanoResponse.success) {
      console.log('❌ XANO ERROR - Status:', xanoResponse.status, 'Error:', xanoResponse.error);
      return res.status(xanoResponse.status).json({
        success: false,
        error: xanoResponse.error,
        message: 'Error al crear la cuenta'
      });
    }

    const token = xanoResponse.data.authToken || xanoResponse.data.token;
    
    // Para signup, SIEMPRE devolver el rol que se normalizó y validó
    const userId = xanoResponse.data.user_id || xanoResponse.data.id;
    
    console.log('✅ SIGNUP - Rol normalizado:', finalRole);

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

    console.log('✅ SIGNUP SUCCESS - User Role:', finalRole, 'Email:', email);

    // Retornar la respuesta
    return res.status(201).json({
      success: true,
      data: responseData,
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
