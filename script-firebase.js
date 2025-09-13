// Variables globales
let currentUser = null;
let income = [];
let expenses = [];
let savings = [];

// Función para formatear números como moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

// Función para obtener la fecha actual
function getCurrentDate() {
    return new Date().toLocaleDateString('es-MX');
}

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

// ==================== AUTENTICACIÓN ====================

function showLogin() {
    console.log('showLogin() ejecutándose...');
    document.body.classList.add('auth-mode');
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('register-screen').style.display = 'none';
    document.getElementById('app-content').style.display = 'none';
    console.log('showLogin() completado');
}

function showRegister() {
    console.log('showRegister() ejecutándose...');
    document.body.classList.add('auth-mode');
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('register-screen').style.display = 'block';
    document.getElementById('app-content').style.display = 'none';
    console.log('showRegister() completado');
}

function showApp() {
    console.log('=== MOSTRANDO APLICACIÓN ===');
    console.log('Removiendo clase auth-mode del body...');
    document.body.classList.remove('auth-mode');
    
    console.log('Ocultando pantallas de autenticación...');
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('register-screen').style.display = 'none';
    
    console.log('Mostrando contenido de la aplicación...');
    document.getElementById('app-content').style.display = 'block';
    
    console.log('=== APLICACIÓN MOSTRADA ===');
}

async function register() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const errorDiv = document.getElementById('register-error');

    if (!name || !email || !password) {
        errorDiv.textContent = 'Por favor completa todos los campos';
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Guardar información adicional del usuario
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification('Cuenta creada exitosamente');
        showLogin();
        
        // Limpiar formulario
        document.getElementById('register-name').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        errorDiv.textContent = '';
        
    } catch (error) {
        console.error('Error al crear cuenta:', error);
        errorDiv.textContent = getErrorMessage(error.code);
    }
}

async function login() {
    console.log('=== INICIANDO PROCESO DE LOGIN ===');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('auth-error');

    console.log('Email ingresado:', email);
    console.log('Password ingresado:', password ? '***' : 'VACÍO');

    if (!email || !password) {
        console.log('Error: Campos vacíos');
        errorDiv.textContent = 'Por favor completa todos los campos';
        return;
    }

    console.log('Validación de campos OK, intentando autenticación...');

    try {
        console.log('Llamando a auth.signInWithEmailAndPassword...');
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Autenticación exitosa:', userCredential.user);
        
        currentUser = userCredential.user;
        console.log('Usuario actual establecido:', currentUser.uid);
        
        console.log('Cargando datos del usuario...');
        await loadUserData();
        console.log('Datos del usuario cargados');
        
        showNotification('Sesión iniciada correctamente');
        console.log('Mostrando aplicación...');
        showApp();
        console.log('Aplicación mostrada');
        
        // Limpiar formulario
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        errorDiv.textContent = '';
        
        console.log('=== LOGIN COMPLETADO EXITOSAMENTE ===');
        
    } catch (error) {
        console.error('=== ERROR EN LOGIN ===');
        console.error('Código de error:', error.code);
        console.error('Mensaje de error:', error.message);
        console.error('Error completo:', error);
        errorDiv.textContent = getErrorMessage(error.code);
    }
}

async function logout() {
    try {
        await auth.signOut();
        currentUser = null;
        income = [];
        expenses = [];
        savings = [];
        
        showNotification('Sesión cerrada');
        // Redirigir a login.html
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showNotification('Error al cerrar sesión', 'error');
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

// ==================== BASE DE DATOS ====================

async function loadUserData() {
    if (!currentUser) return;

    try {
        // Cargar ingresos
        const incomeSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('income').orderBy('date', 'desc').get();
        income = incomeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Cargar gastos
        const expensesSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('expenses').orderBy('date', 'desc').get();
        expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Cargar ahorros
        const savingsSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('savings').orderBy('date', 'desc').get();
        savings = savingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Actualizar interfaz
        updateIncomeTable();
        updateExpensesTable();
        updateSavingsTable();
        updateSummaryCards();

        // Cargar nombre del usuario
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            document.getElementById('user-name').textContent = userDoc.data().name;
        }

    } catch (error) {
        console.error('Error al cargar datos:', error);
        showNotification('Error al cargar los datos', 'error');
    }
}

async function addIncome() {
    if (!currentUser) {
        showNotification('Debes iniciar sesión', 'error');
        return;
    }

    const description = document.getElementById('income-description').value.trim();
    const amount = parseFloat(document.getElementById('income-amount').value);

    if (!description) {
        showNotification('Por favor ingresa una descripción');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showNotification('Por favor ingresa una cantidad válida');
        return;
    }

    try {
        const incomeData = {
            description: description,
            amount: amount,
            date: getCurrentDate(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('users').doc(currentUser.uid)
            .collection('income').add(incomeData);

        income.unshift({ id: docRef.id, ...incomeData });
        
        document.getElementById('income-description').value = '';
        document.getElementById('income-amount').value = '';
        
        updateIncomeTable();
        updateSummaryCards();
        showNotification(`Ingreso agregado: ${description} - ${formatCurrency(amount)}`);

    } catch (error) {
        console.error('Error al agregar ingreso:', error);
        showNotification('Error al agregar ingreso', 'error');
    }
}

async function addExpense() {
    if (!currentUser) {
        showNotification('Debes iniciar sesión', 'error');
        return;
    }

    const description = document.getElementById('expense-description').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);

    if (!description) {
        showNotification('Por favor ingresa una descripción');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showNotification('Por favor ingresa una cantidad válida');
        return;
    }

    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    if (amount > (totalIncome - totalExpenses)) {
        showNotification('No tienes suficiente dinero disponible para este gasto');
        return;
    }

    try {
        const expenseData = {
            description: description,
            amount: amount,
            date: getCurrentDate(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('users').doc(currentUser.uid)
            .collection('expenses').add(expenseData);

        expenses.unshift({ id: docRef.id, ...expenseData });
        
        document.getElementById('expense-description').value = '';
        document.getElementById('expense-amount').value = '';
        
        updateExpensesTable();
        updateSummaryCards();
        showNotification(`Gasto agregado: ${description} - ${formatCurrency(amount)}`);

    } catch (error) {
        console.error('Error al agregar gasto:', error);
        showNotification('Error al agregar gasto', 'error');
    }
}

async function addSavings() {
    if (!currentUser) {
        showNotification('Debes iniciar sesión', 'error');
        return;
    }

    const description = document.getElementById('savings-description').value.trim();
    const amount = parseFloat(document.getElementById('savings-amount').value);

    if (!description) {
        showNotification('Por favor ingresa una descripción');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showNotification('Por favor ingresa una cantidad válida');
        return;
    }

    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    if (amount > (totalIncome - totalExpenses)) {
        showNotification('No tienes suficiente dinero disponible para este ahorro');
        return;
    }

    try {
        const savingsData = {
            description: description,
            amount: amount,
            date: getCurrentDate(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('users').doc(currentUser.uid)
            .collection('savings').add(savingsData);

        savings.unshift({ id: docRef.id, ...savingsData });
        
        document.getElementById('savings-description').value = '';
        document.getElementById('savings-amount').value = '';
        
        updateSavingsTable();
        updateSummaryCards();
        showNotification(`Ahorro agregado: ${description} - ${formatCurrency(amount)}`);

    } catch (error) {
        console.error('Error al agregar ahorro:', error);
        showNotification('Error al agregar ahorro', 'error');
    }
}

async function deleteIncome(id) {
    if (!currentUser) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar este ingreso?')) {
        try {
            await db.collection('users').doc(currentUser.uid)
                .collection('income').doc(id).delete();
            
            income = income.filter(inc => inc.id !== id);
            updateIncomeTable();
            updateSummaryCards();
            showNotification('Ingreso eliminado');
        } catch (error) {
            console.error('Error al eliminar ingreso:', error);
            showNotification('Error al eliminar ingreso', 'error');
        }
    }
}

async function deleteExpense(id) {
    if (!currentUser) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
        try {
            await db.collection('users').doc(currentUser.uid)
                .collection('expenses').doc(id).delete();
            
            expenses = expenses.filter(exp => exp.id !== id);
            updateExpensesTable();
            updateSummaryCards();
            showNotification('Gasto eliminado');
        } catch (error) {
            console.error('Error al eliminar gasto:', error);
            showNotification('Error al eliminar gasto', 'error');
        }
    }
}

async function deleteSaving(id) {
    if (!currentUser) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar este ahorro?')) {
        try {
            await db.collection('users').doc(currentUser.uid)
                .collection('savings').doc(id).delete();
            
            savings = savings.filter(sav => sav.id !== id);
            updateSavingsTable();
            updateSummaryCards();
            showNotification('Ahorro eliminado');
        } catch (error) {
            console.error('Error al eliminar ahorro:', error);
            showNotification('Error al eliminar ahorro', 'error');
        }
    }
}

// ==================== INTERFAZ ====================

function updateSummaryCards() {
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalSavings = savings.reduce((sum, saving) => sum + saving.amount, 0);
    const remainingBalance = totalIncome - totalExpenses;

    document.getElementById('available-money').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('total-savings').textContent = formatCurrency(totalSavings);
    document.getElementById('remaining-balance').textContent = formatCurrency(remainingBalance);

    const balanceElement = document.getElementById('remaining-balance');
    if (remainingBalance < 0) {
        balanceElement.style.color = '#e74c3c';
    } else {
        balanceElement.style.color = '#2c3e50';
    }
}

function updateIncomeTable() {
    const tbody = document.getElementById('income-tbody');
    
    if (income.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay ingresos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = income.map(inc => `
        <tr>
            <td><span class="editable" onclick="editIncomeDescription('${inc.id}')" title="Haz clic para editar">${inc.description}</span></td>
            <td><span class="editable" onclick="editIncomeAmount('${inc.id}')" title="Haz clic para editar">${formatCurrency(inc.amount)}</span></td>
            <td>${inc.date}</td>
            <td>
                <button class="edit-btn" onclick="editIncome('${inc.id}')" title="Editar">✏️</button>
                <button class="delete-btn" onclick="deleteIncome('${inc.id}')" title="Eliminar">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function updateExpensesTable() {
    const tbody = document.getElementById('expenses-tbody');
    
    if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay gastos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = expenses.map(expense => `
        <tr>
            <td><span class="editable" onclick="editExpenseDescription('${expense.id}')" title="Haz clic para editar">${expense.description}</span></td>
            <td><span class="editable" onclick="editExpenseAmount('${expense.id}')" title="Haz clic para editar">${formatCurrency(expense.amount)}</span></td>
            <td>${expense.date}</td>
            <td>
                <button class="edit-btn" onclick="editExpense('${expense.id}')" title="Editar">✏️</button>
                <button class="delete-btn" onclick="deleteExpense('${expense.id}')" title="Eliminar">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function updateSavingsTable() {
    const tbody = document.getElementById('savings-tbody');
    
    if (savings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay ahorros registrados</td></tr>';
        return;
    }

    tbody.innerHTML = savings.map(saving => `
        <tr>
            <td><span class="editable" onclick="editSavingDescription('${saving.id}')" title="Haz clic para editar">${saving.description}</span></td>
            <td><span class="editable" onclick="editSavingAmount('${saving.id}')" title="Haz clic para editar">${formatCurrency(saving.amount)}</span></td>
            <td>${saving.date}</td>
            <td>
                <button class="edit-btn" onclick="editSaving('${saving.id}')" title="Editar">✏️</button>
                <button class="delete-btn" onclick="deleteSaving('${saving.id}')" title="Eliminar">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// ==================== FUNCIONES DE EDICIÓN ====================

// Funciones de edición para ingresos
async function editIncomeDescription(id) {
    if (!currentUser) return;
    
    const item = income.find(inc => inc.id === id);
    if (item) {
        const newDescription = prompt('Editar descripción:', item.description);
        if (newDescription && newDescription.trim()) {
            try {
                await db.collection('users').doc(currentUser.uid)
                    .collection('income').doc(id).update({
                        description: newDescription.trim()
                    });
                
                item.description = newDescription.trim();
                updateIncomeTable();
                showNotification('Descripción actualizada');
            } catch (error) {
                console.error('Error al actualizar descripción:', error);
                showNotification('Error al actualizar descripción', 'error');
            }
        }
    }
}

async function editIncomeAmount(id) {
    if (!currentUser) return;
    
    const item = income.find(inc => inc.id === id);
    if (item) {
        const newAmount = prompt('Editar cantidad:', item.amount);
        if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            try {
                await db.collection('users').doc(currentUser.uid)
                    .collection('income').doc(id).update({
                        amount: parseFloat(newAmount)
                    });
                
                item.amount = parseFloat(newAmount);
                updateIncomeTable();
                updateSummaryCards();
                showNotification('Cantidad actualizada');
            } catch (error) {
                console.error('Error al actualizar cantidad:', error);
                showNotification('Error al actualizar cantidad', 'error');
            }
        }
    }
}

async function editIncome(id) {
    if (!currentUser) return;
    
    const item = income.find(inc => inc.id === id);
    if (item) {
        const newDescription = prompt('Editar descripción:', item.description);
        const newAmount = prompt('Editar cantidad:', item.amount);
        
        if (newDescription && newDescription.trim() && newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            try {
                await db.collection('users').doc(currentUser.uid)
                    .collection('income').doc(id).update({
                        description: newDescription.trim(),
                        amount: parseFloat(newAmount)
                    });
                
                item.description = newDescription.trim();
                item.amount = parseFloat(newAmount);
                updateIncomeTable();
                updateSummaryCards();
                showNotification('Ingreso actualizado');
            } catch (error) {
                console.error('Error al actualizar ingreso:', error);
                showNotification('Error al actualizar ingreso', 'error');
            }
        }
    }
}

// Funciones de edición para gastos
async function editExpenseDescription(id) {
    if (!currentUser) return;
    
    const item = expenses.find(exp => exp.id === id);
    if (item) {
        const newDescription = prompt('Editar descripción:', item.description);
        if (newDescription && newDescription.trim()) {
            try {
                await db.collection('users').doc(currentUser.uid)
                    .collection('expenses').doc(id).update({
                        description: newDescription.trim()
                    });
                
                item.description = newDescription.trim();
                updateExpensesTable();
                showNotification('Descripción actualizada');
            } catch (error) {
                console.error('Error al actualizar descripción:', error);
                showNotification('Error al actualizar descripción', 'error');
            }
        }
    }
}

async function editExpenseAmount(id) {
    if (!currentUser) return;
    
    const item = expenses.find(exp => exp.id === id);
    if (item) {
        const newAmount = prompt('Editar cantidad:', item.amount);
        if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            try {
                await db.collection('users').doc(currentUser.uid)
                    .collection('expenses').doc(id).update({
                        amount: parseFloat(newAmount)
                    });
                
                item.amount = parseFloat(newAmount);
                updateExpensesTable();
                updateSummaryCards();
                showNotification('Cantidad actualizada');
            } catch (error) {
                console.error('Error al actualizar cantidad:', error);
                showNotification('Error al actualizar cantidad', 'error');
            }
        }
    }
}

async function editExpense(id) {
    if (!currentUser) return;
    
    const item = expenses.find(exp => exp.id === id);
    if (item) {
        const newDescription = prompt('Editar descripción:', item.description);
        const newAmount = prompt('Editar cantidad:', item.amount);
        
        if (newDescription && newDescription.trim() && newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            try {
                await db.collection('users').doc(currentUser.uid)
                    .collection('expenses').doc(id).update({
                        description: newDescription.trim(),
                        amount: parseFloat(newAmount)
                    });
                
                item.description = newDescription.trim();
                item.amount = parseFloat(newAmount);
                updateExpensesTable();
                updateSummaryCards();
                showNotification('Gasto actualizado');
            } catch (error) {
                console.error('Error al actualizar gasto:', error);
                showNotification('Error al actualizar gasto', 'error');
            }
        }
    }
}

// Funciones de edición para ahorros
async function editSavingDescription(id) {
    if (!currentUser) return;
    
    const item = savings.find(sav => sav.id === id);
    if (item) {
        const newDescription = prompt('Editar descripción:', item.description);
        if (newDescription && newDescription.trim()) {
            try {
                await db.collection('users').doc(currentUser.uid)
                    .collection('savings').doc(id).update({
                        description: newDescription.trim()
                    });
                
                item.description = newDescription.trim();
                updateSavingsTable();
                showNotification('Descripción actualizada');
            } catch (error) {
                console.error('Error al actualizar descripción:', error);
                showNotification('Error al actualizar descripción', 'error');
            }
        }
    }
}

async function editSavingAmount(id) {
    if (!currentUser) return;
    
    const item = savings.find(sav => sav.id === id);
    if (item) {
        const newAmount = prompt('Editar cantidad:', item.amount);
        if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            try {
                await db.collection('users').doc(currentUser.uid)
                    .collection('savings').doc(id).update({
                        amount: parseFloat(newAmount)
                    });
                
                item.amount = parseFloat(newAmount);
                updateSavingsTable();
                updateSummaryCards();
                showNotification('Cantidad actualizada');
            } catch (error) {
                console.error('Error al actualizar cantidad:', error);
                showNotification('Error al actualizar cantidad', 'error');
            }
        }
    }
}

async function editSaving(id) {
    if (!currentUser) return;
    
    const item = savings.find(sav => sav.id === id);
    if (item) {
        const newDescription = prompt('Editar descripción:', item.description);
        const newAmount = prompt('Editar cantidad:', item.amount);
        
        if (newDescription && newDescription.trim() && newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
            try {
                await db.collection('users').doc(currentUser.uid)
                    .collection('savings').doc(id).update({
                        description: newDescription.trim(),
                        amount: parseFloat(newAmount)
                    });
                
                item.description = newDescription.trim();
                item.amount = parseFloat(newAmount);
                updateSavingsTable();
                updateSummaryCards();
                showNotification('Ahorro actualizado');
            } catch (error) {
                console.error('Error al actualizar ahorro:', error);
                showNotification('Error al actualizar ahorro', 'error');
            }
        }
    }
}

async function resetAll() {
    if (!currentUser) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
        try {
            // Eliminar todos los ingresos
            const incomeSnapshot = await db.collection('users').doc(currentUser.uid)
                .collection('income').get();
            incomeSnapshot.docs.forEach(doc => doc.ref.delete());

            // Eliminar todos los gastos
            const expensesSnapshot = await db.collection('users').doc(currentUser.uid)
                .collection('expenses').get();
            expensesSnapshot.docs.forEach(doc => doc.ref.delete());

            // Eliminar todos los ahorros
            const savingsSnapshot = await db.collection('users').doc(currentUser.uid)
                .collection('savings').get();
            savingsSnapshot.docs.forEach(doc => doc.ref.delete());

            income = [];
            expenses = [];
            savings = [];

            updateIncomeTable();
            updateExpensesTable();
            updateSavingsTable();
            updateSummaryCards();
            
            showNotification('Todos los datos han sido eliminados');
        } catch (error) {
            console.error('Error al eliminar datos:', error);
            showNotification('Error al eliminar datos', 'error');
        }
    }
}

// ==================== INICIALIZACIÓN ====================

// Función para inicializar la aplicación
function initializeApp() {
    console.log('=== INICIALIZANDO APLICACIÓN ===');
    console.log('Verificando elementos del DOM...');
    
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const appContent = document.getElementById('app-content');
    
    console.log('Login screen encontrado:', !!loginScreen);
    console.log('Register screen encontrado:', !!registerScreen);
    console.log('App content encontrado:', !!appContent);
    
    // Asegurar que se muestre la pantalla de login por defecto
    console.log('Configurando pantallas...');
    loginScreen.style.display = 'block';
    registerScreen.style.display = 'none';
    appContent.style.display = 'none';
    document.body.classList.add('auth-mode');
    
    console.log('=== APLICACIÓN INICIALIZADA - MOSTRANDO LOGIN ===');
}

// Verificar estado de autenticación
auth.onAuthStateChanged(async (user) => {
    console.log('=== CAMBIO DE ESTADO DE AUTENTICACIÓN ===');
    console.log('Usuario detectado:', user ? user.uid : 'NINGUNO');
    
    if (user) {
        console.log('Usuario autenticado, cargando datos...');
        currentUser = user;
        await loadUserData();
        
        // Verificar si estamos en finance_table.html
        if (window.location.pathname.includes('finance_table.html')) {
            console.log('En finance_table.html, datos cargados correctamente');
            // Los datos ya se cargaron con loadUserData()
        } else {
            showApp();
        }
    } else {
        console.log('No hay usuario autenticado, redirigiendo a login...');
        currentUser = null;
        // Redirigir a login si no hay usuario autenticado
        window.location.href = 'login.html';
    }
});

// Event listeners para Enter
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la aplicación
    initializeApp();
    
    document.getElementById('income-amount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addIncome();
    });

    document.getElementById('expense-amount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addExpense();
    });

    document.getElementById('savings-amount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addSavings();
    });

    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });

    document.getElementById('register-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') register();
    });
});
