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

    apiKey: "AIzaSyBu7QMjWoT0YAuWSgHmSt0H5aELTb322Fo",

    authDomain: "growsync-84d88.firebaseapp.com",

    databaseURL: "https://growsync-84d88-default-rtdb.firebaseio.com",

    projectId: "growsync-84d88",

    storageBucket: "growsync-84d88.firebasestorage.app",

    messagingSenderId: "210812675253",

    appId: "1:210812675253:web:40b6415ba2d114c1d34afc"

};


// =========================================================
// INICIALIZACIÓN
// =========================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const database = getDatabase(app);


// =========================================================
// EXPORTAR
// =========================================================

export {
    app,
    auth,
    database
};
