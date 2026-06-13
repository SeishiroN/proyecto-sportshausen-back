const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const emailRoutes = require('./routes/emailRoutes');
const profileRoutes = require('./routes/profileRoutes');
const mensajesRoutes = require('./routes/mensajesRoutes');
const logger = require('./middlewares/logger');

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware DESPUÉS de parsers
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.includes('/auth/signup')) {
    console.log('🔍 SIGNUP BODY RECEIVED:', req.body);
  }
  next();
});

app.use(logger);

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/mensajes', mensajesRoutes);

// Ruta de test para descubrir el nombre y valores correctos del field role
app.post('/test-xano', async (req, res) => {
  const { full_name, email, password, role, nombre_artistico } = req.body;
  const xanoService = require('./services/xanoService');
  
  console.log('🧪 TEST XANO - Intentando con:', {
    nombre_artistico: nombre_artistico || full_name,
    email,
    password,
    role
  });

  try {
    // Intentar directamente con axios para ver qué pasa
    const axios = require('axios');
    const baseURL = process.env.XANO_API_URL;
    
    // Prueba 1: sin role
    console.log('\n📤 Prueba SIN role:');
    try {
      const res1 = await axios.post(baseURL + '/auth/signup', {
        nombre_artistico: nombre_artistico || full_name,
        email,
        password
      });
      console.log('✅ Éxito sin role:', res1.data);
      return res.json({ success: true, method: 'sin_role', data: res1.data });
    } catch (e) {
      console.log('❌ Error sin role:', e.response?.data || e.message);
    }
    
    // Prueba 2: con type en lugar de role
    console.log('\n📤 Prueba con TYPE en lugar de ROLE:');
    try {
      const res2 = await axios.post(baseURL + '/auth/signup', {
        nombre_artistico: nombre_artistico || full_name,
        email,
        password,
        type: role || 'user'
      });
      console.log('✅ Éxito con type:', res2.data);
      return res.json({ success: true, method: 'type', data: res2.data });
    } catch (e) {
      console.log('❌ Error con type:', e.response?.data || e.message);
    }
    
    // Prueba 3: con user_type
    console.log('\n📤 Prueba con USER_TYPE:');
    try {
      const res3 = await axios.post(baseURL + '/auth/signup', {
        nombre_artistico: nombre_artistico || full_name,
        email,
        password,
        user_type: role || 'user'
      });
      console.log('✅ Éxito con user_type:', res3.data);
      return res.json({ success: true, method: 'user_type', data: res3.data });
    } catch (e) {
      console.log('❌ Error con user_type:', e.response?.data || e.message);
    }
    
    res.json({ success: false, message: 'Todas las pruebas fallaron' });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Debug endpoint para verificar login en Xano y obtención de rol
app.post('/debug-login', async (req, res) => {
  const { email, password } = req.body;
  const axios = require('axios');
  const baseURL = process.env.XANO_API_URL;

  console.log('\n🔍 DEBUG-LOGIN - Investigando login con email:', email);

  try {
    // Paso 1: Login básico
    console.log('📤 Paso 1: Haciendo login...');
    const loginRes = await axios.post(baseURL + '/auth/login', {
      email,
      password
    });

    console.log('📦 Respuesta de login:', JSON.stringify(loginRes.data, null, 2));
    
    const token = loginRes.data.authToken || loginRes.data.token;
    const userId = loginRes.data.user_id || loginRes.data.id;

    if (!token) {
      return res.json({
        error: 'No token en respuesta de login',
        loginResponse: loginRes.data
      });
    }

    console.log('\n📤 Paso 2: Intentando obtener usuario...');
    
    // Intentar /auth/user
    let userDataFound = null;
    let endpointThatWorked = null;
    
    const endpoints = [
      { url: '/auth/user', name: '/auth/user' },
      { url: '/user', name: '/user' },
      userId ? { url: `/user/${userId}`, name: `/user/${userId}` } : null
    ].filter(Boolean);

    for (const endpoint of endpoints) {
      try {
        console.log(`  → Intentando GET ${endpoint.name}`);
        const userRes = await axios.get(baseURL + endpoint.url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`  ✅ Éxito en ${endpoint.name}:`, JSON.stringify(userRes.data, null, 2));
        userDataFound = userRes.data;
        endpointThatWorked = endpoint.name;
        break;
      } catch (err) {
        console.log(`  ⚠️ Falló en ${endpoint.name}: ${err.response?.status || err.message}`);
      }
    }

    res.json({
      loginResponse: loginRes.data,
      userDataEndpoint: endpointThatWorked,
      userData: userDataFound,
      hasRole: userDataFound?.role ? 'YES ✅' : 'NO ❌',
      roleValue: userDataFound?.role || 'NOT FOUND'
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      response: error.response?.data
    });
  }
});

// Ruta original

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;