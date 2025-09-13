// Configuración de Firebase
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto de Firebase

const firebaseConfig = {
    apiKey: "AIzaSyChErGNSl-NWGM9K1hbQOj1z8gyo58g3rg",
    authDomain: "finanzas-personales-7cb1e.firebaseapp.com",
    projectId: "finanzas-personales-7cb1e",
    storageBucket: "finanzas-personales-7cb1e.firebasestorage.app",
    messagingSenderId: "609946045582",
    appId: "1:609946045582:web:d9dd6fe2ff181556074ddf",
    measurementId: "G-GB5M37B64C"
  };
  
// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a los servicios
const auth = firebase.auth();
const db = firebase.firestore();

// Configurar reglas de Firestore (opcional, para desarrollo)
// En producción, configura las reglas en Firebase Console
// Nota: timestampsInSnapshots está deprecado en versiones modernas
// db.settings({
//     timestampsInSnapshots: true,
//     merge: true
// });
