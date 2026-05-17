# proyecto-sportshausen-back
Proyecto para Tesis de la Carrera Analista Programador de DUOC UC Sede San Joaquín, Año 2026 - Primer Semestre

## 📋 Requisitos
- Node.js (v14 o superior)
- npm (incluido con Node.js)

## 🚀 Instalación y Configuración

### 1. Instalar dependencias
```bash
cd proyecto-sportshausen-back-main
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto (o copia desde `.env.example`):
```bash
PORT=3000
NODE_ENV=development
```

## ▶️ Ejecutar el proyecto

### Modo producción
```bash
npm start
```

### Modo desarrollo (con auto-reload usando nodemon)
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Rutas disponibles

### Usuarios
- **GET** `/api/users` - Obtener todos los usuarios
- **GET** `/api/users/:id` - Obtener usuario por ID
- **POST** `/api/users` - Crear nuevo usuario
- **PUT** `/api/users/:id` - Actualizar usuario
- **DELETE** `/api/users/:id` - Eliminar usuario

## 📁 Estructura del proyecto

```
proyecto-sportshausen-back-main/
├── server.js                 # Archivo principal
├── package.json              # Dependencias
├── .env                       # Variables de entorno
├── .env.example               # Ejemplo de variables
├── .gitignore                 # Archivos a ignorar en git
└── src/
    ├── apps.js                # Configuración de Express
    ├── controller/
    │   └── userControllers.js # Controladores de usuarios
    ├── middlewares/
    │   └── logger.js           # Middleware de logs
    └── routes/
        └── userRoutes.js       # Rutas de usuarios
```

## 🛠️ Dependencias
- **express** - Framework web
- **cors** - Manejo de CORS
- **morgan** - Logger HTTP
- **dotenv** - Variables de entorno
- **nodemon** (dev) - Auto-reload en desarrollo
