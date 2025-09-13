// Variables globales
let currentUser = null;
let income = [];
let expenses = [];
let savings = [];
let isLoginPage = false;
let manualLoginCompleted = false;

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
    console.log('Mostrando pantalla de login...');
    document.body.classList.add('auth-mode');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-content').style.display = 'none';
}

function showApp() {
    console.log('=== MOSTRANDO APLICACIÓN ===');
    console.log('Manual login completado:', manualLoginCompleted);
    
    // Solo permitir redirección si el login manual fue completado
    if (!manualLoginCompleted) {
        console.log('Login manual no completado, cancelando redirección');
        return;
    }
    
    // Redirección robusta a la página de la app
    const target = 'finance_table.html';
    const go = () => {
        try {
            window.location.assign(target);
        } catch (e) {
            window.location.href = target;
        }
    };

    // Evitar tocar el DOM local, solo redirigir
    go();

    // Fallback por si el navegador ignora el primer intento
    setTimeout(() => {
        if (!window.location.pathname.endsWith('/' + target) && !window.location.pathname.endsWith(target)) {
            window.location.href = target;
        }
    }, 100);

    console.log('=== REDIRECCIÓN AUTORIZADA ===');
}

function goToRegister() {
    console.log('Redirigiendo a registro...');
    window.location.href = 'registro.html';
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
        console.log('Login manual exitoso, marcando como completado...');
        
        // Marcar que el login manual fue exitoso
        manualLoginCompleted = true;
        
        // Redirigir inmediatamente después del login exitoso
        const target = 'finance_table.html';
        window.location.assign(target);
        console.log('Redirección iniciada a:', target);
        
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
        showLogin();
        
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

// ==================== FUNCIONES DE EDICIÓN Y ELIMINACIÓN ====================

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

// Funciones de edición (simplificadas)
async function editIncomeDescription(id) {
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
                showNotification('Error al actualizar', 'error');
            }
        }
    }
}

async function editIncomeAmount(id) {
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
                showNotification('Error al actualizar', 'error');
            }
        }
    }
}

async function editIncome(id) {
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
                showNotification('Error al actualizar', 'error');
            }
        }
    }
}

// Funciones similares para gastos y ahorros (simplificadas)
async function editExpenseDescription(id) {
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
                showNotification('Error al actualizar', 'error');
            }
        }
    }
}

async function editExpenseAmount(id) {
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
                showNotification('Error al actualizar', 'error');
            }
        }
    }
}

async function editExpense(id) {
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
                showNotification('Error al actualizar', 'error');
            }
        }
    }
}

async function editSavingDescription(id) {
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
                showNotification('Error al actualizar', 'error');
            }
        }
    }
}

async function editSavingAmount(id) {
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
                showNotification('Error al actualizar', 'error');
            }
        }
    }
}

async function editSaving(id) {
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
                showNotification('Error al actualizar', 'error');
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

// Verificar estado de autenticación
auth.onAuthStateChanged(async (user) => {
    console.log('=== CAMBIO DE ESTADO DE AUTENTICACIÓN ===');
    console.log('Usuario detectado:', user ? user.uid : 'NINGUNO');
    console.log('Manual login completado:', manualLoginCompleted);
    
    if (user) {
        console.log('Usuario autenticado detectado');
        currentUser = user;
        // NO redirigir automáticamente - solo después de login manual exitoso
        console.log('Usuario autenticado pero esperando login manual');
    } else {
        console.log('No hay usuario autenticado');
        currentUser = null;
        manualLoginCompleted = false;
        if (isLoginPage) {
            showLogin();
        }
    }
});

// Función para inicializar la página de login
function initializeLogin() {
    console.log('=== INICIALIZANDO PÁGINA DE LOGIN ===');
    
    // Marcar que estamos en la página de login
    isLoginPage = true;
    
    // Resetear la bandera de login manual
    manualLoginCompleted = false;
    
    // Asegurar que se muestre la pantalla de login por defecto
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-content').style.display = 'none';
    document.body.classList.add('auth-mode');
    
    console.log('=== PÁGINA DE LOGIN INICIALIZADA - Esperando login manual ===');
}

// Event listeners para Enter
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PÁGINA DE LOGIN CARGADA ===');
    
    // Inicializar la página
    initializeLogin();
    
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });

    document.getElementById('income-amount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addIncome();
    });

    document.getElementById('expense-amount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addExpense();
    });

    document.getElementById('savings-amount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addSavings();
    });
});
