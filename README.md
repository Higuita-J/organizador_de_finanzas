# 💰 Finanzas Personales - Aplicación Web

Una aplicación web completa para gestionar tus finanzas personales con autenticación segura, gestión de ingresos, gastos y ahorros.

## 🌐 Demo en vivo

[Ver aplicación en GitHub Pages](https://tuusuario.github.io/tu-repositorio)

## ✨ Características

### 🔐 Autenticación Segura
- **Registro de usuarios**: Crea tu cuenta con email y contraseña
- **Inicio de sesión**: Acceso seguro a tus datos personales
- **Autenticación Firebase**: Tus datos están protegidos con Google Firebase
- **Sesión persistente**: Mantén tu sesión activa entre visitas

### 💰 Gestión Financiera
- **Ingresos**: Registra y edita todos tus ingresos
- **Gastos**: Controla y categoriza tus gastos
- **Ahorros**: Monitorea tus objetivos de ahorro
- **Edición en tiempo real**: Haz clic para editar cualquier valor
- **Eliminación segura**: Borra elementos con confirmación

### 📊 Análisis y Resumen
- **Tarjetas de resumen**: Totales en tiempo real
- **Saldo disponible**: Dinero restante después de gastos
- **Cálculos automáticos**: Todo se actualiza automáticamente
- **Notificaciones**: Confirmaciones de todas las acciones

### 📱 Experiencia de Usuario
- **Diseño responsivo**: Perfecto en móviles y desktop
- **Interfaz intuitiva**: Fácil de usar para cualquier edad
- **Navegación fluida**: Transiciones suaves entre páginas
- **Tema moderno**: Diseño atractivo y profesional

## 🚀 Cómo usar

### 1. Registro
1. Ve a la página principal
2. Haz clic en "Crear Cuenta"
3. Completa el formulario con tu nombre, email y contraseña
4. ¡Listo! Tu cuenta ha sido creada

### 2. Inicio de Sesión
1. En la página principal, haz clic en "Iniciar Sesión"
2. Ingresa tu email y contraseña
3. Accede a tu panel de finanzas personal

### 3. Gestionar Finanzas
- **Agregar Ingresos**: Usa el primer formulario
- **Registrar Gastos**: Usa el segundo formulario  
- **Agregar Ahorros**: Usa el tercer formulario
- **Editar**: Haz clic en cualquier descripción o cantidad
- **Eliminar**: Usa el botón 🗑️
- **Ver resumen**: Las tarjetas superiores muestran totales

## 🛠️ Tecnologías utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Authentication & Firestore
- **Hosting**: GitHub Pages
- **Iconos**: Emojis nativos para mejor compatibilidad

## 📁 Estructura del proyecto

```
finanzas/
├── index.html              # Página principal
├── login.html              # Página de inicio de sesión
├── registro.html           # Página de registro
├── finance_table.html      # Panel principal de finanzas
├── firebase-config.js      # Configuración de Firebase
├── script-login.js         # Lógica de autenticación
├── script-registro.js      # Lógica de registro
├── script-firebase.js      # Lógica principal de la app
├── styles.css              # Estilos CSS
├── .gitignore             # Archivos a ignorar en Git
└── README.md              # Este archivo
```

## 🔧 Instalación local

### Opción 1: Servidor Python (Recomendado)
```bash
# Clona el repositorio
git clone https://github.com/tuusuario/tu-repositorio.git
cd tu-repositorio

# Ejecuta el servidor
python server.py
```

### Opción 2: Servidor HTTP simple
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js
npx http-server

# Con PHP
php -S localhost:8000
```

## 🌐 Despliegue en GitHub Pages

1. **Sube tu código a GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tuusuario/tu-repositorio.git
   git push -u origin main
   ```

2. **Configura GitHub Pages**
   - Ve a Settings > Pages
   - Selecciona "Deploy from a branch"
   - Elige la rama `main`
   - Guarda los cambios

3. **¡Listo!** Tu app estará disponible en:
   `https://tuusuario.github.io/tu-repositorio`

## 🔒 Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita Authentication (Email/Password)
3. Habilita Firestore Database
4. Copia la configuración a `firebase-config.js`

```javascript
const firebaseConfig = {
    apiKey: "tu-api-key",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    // ... resto de la configuración
};
```

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge
- ✅ iOS Safari, Chrome Mobile
- ✅ Android Chrome, Samsung Internet
- ✅ Dispositivos de escritorio y móviles

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. **Revisa la consola del navegador** para errores
2. **Verifica la configuración de Firebase**
3. **Asegúrate de que todos los archivos estén presentes**
4. **Abre un issue en GitHub** con detalles del problema

## 🙏 Agradecimientos

- Firebase por la infraestructura de autenticación y base de datos
- GitHub por el hosting gratuito
- La comunidad de desarrolladores web por las mejores prácticas

---

**¡Disfruta gestionando tus finanzas de manera digital! 💰**