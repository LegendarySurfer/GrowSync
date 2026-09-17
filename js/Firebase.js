// =========================================================
// GROWSYNC - FIREBASE
// =========================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


// =========================================================
// CONFIGURACIÓN FIREBASE
// =========================================================

const firebaseConfig = {

    apiKey: "TU_API_KEY",

    authDomain:
        "TU_PROYECTO.firebaseapp.com",

    databaseURL:
        "https://TU_PROYECTO-default-rtdb.europe-west1.firebasedatabase.app",

    projectId:
        "TU_PROYECTO",

    storageBucket:
        "TU_PROYECTO.firebasestorage.app",

    messagingSenderId:
        "TU_MESSAGING_SENDER_ID",

    appId:
        "TU_APP_ID"

};


// =========================================================
// INICIALIZACIÓN
// =========================================================

const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const database =
    getDatabase(app);


// =========================================================
// EXPORTAR
// =========================================================

export {
    app,
    auth,
    database
};
