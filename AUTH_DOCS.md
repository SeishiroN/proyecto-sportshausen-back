# Autenticación con Xano

## Endpoints de Autenticación

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "tu_contraseña"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "authToken": "token_aqui",
    "user": {
      "id": 1,
      "email": "usuario@example.com"
    }
  },
  "message": "Login exitoso"
}
```

---

### 2. Logout (Requiere autenticación)
```http
POST /api/auth/logout
Authorization: Bearer {authToken}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

## Endpoints Protegidos

Todos los endpoints de modificación de usuarios (`POST`, `PUT`, `DELETE`) requieren token:

### Crear Usuario
```http
POST /api/users
Authorization: Bearer {authToken}
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com"
}
```

### Actualizar Usuario
```http
PUT /api/users/1
Authorization: Bearer {authToken}
Content-Type: application/json

{
  "name": "Juan García",
  "email": "juan@example.com"
}
```

### Eliminar Usuario
```http
DELETE /api/users/1
Authorization: Bearer {authToken}
```

---

## Endpoints Públicos

### Obtener todos los usuarios
```http
GET /api/users
```

### Obtener usuario por ID
```http
GET /api/users/1
```

---

## Errores de Autenticación

**Sin token (401):**
```json
{
  "success": false,
  "error": "No se proporcionó token de autenticación",
  "message": "Por favor inicia sesión"
}
```

**Token inválido o expirado (401):**
```json
{
  "success": false,
  "error": "Token inválido o expirado",
  "message": "Por favor inicia sesión nuevamente"
}
```

---

## Cómo usar en el frontend

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'contraseña'
  })
});

const { data } = await loginResponse.json();
const token = data.authToken;

// 2. Usar token en peticiones protegidas
const createUserResponse = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Nuevo Usuario',
    email: 'nuevo@example.com'
  })
});

// 3. Logout
await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```
