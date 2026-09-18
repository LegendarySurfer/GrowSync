// =========================================================
// GROWSYNC - DASHBOARD
// =========================================================

import {
    auth,
    database
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


// =========================================================
// ELEMENTOS
// =========================================================

const greenhouseName = document.getElementById("greenhouseName");
const greenhouseCode = document.getElementById("greenhouseCode");
const userAvatar = document.getElementById("userAvatar");
const backButton = document.getElementById("backButton");
const themeButton = document.getElementById("themeButton");

// Un elemento por sensor: [id del <strong>, campo en Firebase, unidad]
const SENSORES = [
    ["temperature", "temperatura", "°C"],
    ["humidity", "humedad", "%"],
    ["soil", "suelo", "%"],
    ["light", "luz", "lux"],
    ["water", "agua", "%"],
    ["battery", "bateria", "%"],
    ["solar", "solar", "W"]
];


// =========================================================
// INVERNADERO SELECCIONADO
// =========================================================

const codigo = localStorage.getItem("selectedGreenhouse");

if (!codigo) {
    window.location.href = "invernaderos.html";
}


// =========================================================
// SESIÓN
// =========================================================

onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (userAvatar) {
        userAvatar.textContent = (user.email || "U")[0].toUpperCase();
    }

    cargarDatos();

});


// =========================================================
// CARGAR DATOS EN VIVO
// =========================================================

function cargarDatos() {

    onValue(ref(database, `greenhouses/${codigo}/info`), (snap) => {
        const info = snap.exists() ? snap.val() : { nombre: "Invernadero" };
        greenhouseName.textContent = info.nombre;
        greenhouseCode.textContent = codigo;
    });

    onValue(ref(database, `greenhouses/${codigo}/sensores`), (snap) => {

        const datos = snap.exists() ? snap.val() : {};

        SENSORES.forEach(([elementId, campo, unidad]) => {

            const el = document.getElementById(elementId);
            if (!el) return;

            if (datos[campo] === undefined) {
                el.textContent = "—";
            } else {
                el.textContent = datos[campo];
            }

        });

    });

}


// =========================================================
// VOLVER
// =========================================================

backButton?.addEventListener("click", () => {
    window.location.href = "invernaderos.html";
});


// =========================================================
// TEMA
// =========================================================

function cargarTema() {
    const tema = localStorage.getItem("growsync-theme");
    if (tema === "dark") {
        document.body.classList.add("dark");
        themeButton.textContent = "☀️";
    }
}

themeButton?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    localStorage.setItem("growsync-theme", dark ? "dark" : "light");
    themeButton.textContent = dark ? "☀️" : "🌙";
});

cargarTema();
