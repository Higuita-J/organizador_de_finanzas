// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function goToLogin() {
    console.log('Redirigiendo a login...');
    window.location.href = 'login.html';
}

async function register() {
    console.log('=== INICIANDO PROCESO DE REGISTRO ===');
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const errorDiv = document.getElementById('register-error');

    console.log('Nombre ingresado:', name);
    console.log('Email ingresado:', email);
    console.log('Password ingresado:', password ? '***' : 'VACÍO');

    if (!name || !email || !password) {
        console.log('Error: Campos vacíos');
        errorDiv.textContent = 'Por favor completa todos los campos';
        return;
    }

    if (password.length < 6) {
        console.log('Error: Contraseña muy corta');
        errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
        return;
    }

    console.log('Validación de campos OK, intentando crear cuenta...');

    try {
        console.log('Llamando a auth.createUserWithEmailAndPassword...');
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log('Cuenta creada exitosamente:', user.uid);
        
        // Guardar información adicional del usuario
        console.log('Guardando información del usuario...');
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('Información del usuario guardada');

        showNotification('Cuenta creada exitosamente');
        
        // Mostrar pantalla de éxito
        document.getElementById('register-screen').style.display = 'none';
        document.getElementById('success-screen').style.display = 'flex';
        
        // Limpiar formulario
        document.getElementById('register-name').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        errorDiv.textContent = '';
        
        console.log('=== REGISTRO COMPLETADO EXITOSAMENTE ===');
        
    } catch (error) {
        console.error('=== ERROR EN REGISTRO ===');
        console.error('Código de error:', error.code);
        console.error('Mensaje de error:', error.message);
        console.error('Error completo:', error);
        errorDiv.textContent = getErrorMessage(error.code);
    }
}

function getErrorMessage(errorCode) {
    const messages = {
        'auth/user-not-found': 'No existe una cuenta con este correo',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/email-already-in-use': 'Ya existe una cuenta con este correo',
        'auth/weak-password': 'La contraseña es muy débil',
        'auth/invalid-email': 'Correo electrónico inválido',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada'
    };
    return messages[errorCode] || 'Error desconocido';
}

// Función para inicializar la página de registro
function initializeRegister() {
    console.log('=== INICIALIZANDO PÁGINA DE REGISTRO ===');
    
    // Asegurar que se muestre la pantalla de registro
    document.getElementById('register-screen').style.display = 'flex';
    document.getElementById('success-screen').style.display = 'none';
    document.body.classList.add('auth-mode');
    
    console.log('=== PÁGINA DE REGISTRO INICIALIZADA ===');
}

// Event listeners para Enter
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PÁGINA DE REGISTRO CARGADA ===');
    
    // Inicializar la página
    initializeRegister();
    
    document.getElementById('register-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') register();
    });
});
