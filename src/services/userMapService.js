/**
 * Servicio para guardar un mapeo local de email -> rol
 * Esto permite que durante login podamos recuperar el rol sin consultarlo a Xano
 */

const fs = require('fs');
const path = require('path');

const USERS_MAP_FILE = path.join(__dirname, '..', '..', '.users-cache.json');

// Cargar mapeo al iniciar
let usersMap = {};
try {
  if (fs.existsSync(USERS_MAP_FILE)) {
    const data = fs.readFileSync(USERS_MAP_FILE, 'utf8');
    usersMap = JSON.parse(data);
    console.log('📖 Mapeo de usuarios cargado:', Object.keys(usersMap).length, 'usuarios');
  }
} catch (error) {
  console.error('Error al cargar mapeo de usuarios:', error.message);
  usersMap = {};
}

/**
 * Guardar un usuario en el mapeo local
 */
const saveUser = (email, role, userData = {}) => {
  try {
    email = email.toLowerCase().trim();
    usersMap[email] = {
      role: role,
      email: email,
      createdAt: new Date().toISOString(),
      ...userData
    };
    
    // Guardar a disco
    fs.writeFileSync(USERS_MAP_FILE, JSON.stringify(usersMap, null, 2));
    console.log('💾 Usuario guardado en cache:', email, 'Role:', role);
    return true;
  } catch (error) {
    console.error('Error al guardar usuario:', error.message);
    return false;
  }
};

/**
 * Obtener rol de un usuario por email
 */
const getUserRole = (email) => {
  try {
    email = email.toLowerCase().trim();
    const user = usersMap[email];
    if (user && user.role) {
      console.log('🎯 Rol encontrado en cache para', email, ':', user.role);
      return user.role;
    }
    console.log('❌ No se encontró rol en cache para', email);
    return null;
  } catch (error) {
    console.error('Error al obtener rol:', error.message);
    return null;
  }
};

/**
 * Obtener todos los usuarios cacheados
 */
const getAllUsers = () => {
  return usersMap;
};

/**
 * Limpiar cache
 */
const clearCache = () => {
  try {
    usersMap = {};
    if (fs.existsSync(USERS_MAP_FILE)) {
      fs.unlinkSync(USERS_MAP_FILE);
    }
    console.log('🗑️ Cache de usuarios limpiado');
    return true;
  } catch (error) {
    console.error('Error al limpiar cache:', error.message);
    return false;
  }
};

module.exports = {
  saveUser,
  getUserRole,
  getAllUsers,
  clearCache
};
