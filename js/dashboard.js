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

// Estado general del sistema
const systemStatus = document.getElementById("systemStatus");
const systemStatusText = document.getElementById("systemStatusText");

// Un elemento por sensor:
// [id del <strong>, campo en Firebase, unidad]
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
// CONFIGURACIÓN ONLINE
// =========================================================

// Tiempo máximo que consideramos que el ESP32 está conectado.
// 2 minutos = 120000 milisegundos.
const TIEMPO_MAXIMO_SIN_DATOS = 2 * 60 * 1000;


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

    // -----------------------------------------------------
    // INFORMACIÓN DEL INVERNADERO
    // -----------------------------------------------------

    onValue(
        ref(database, `greenhouses/${codigo}/info`),
        (snap) => {

            const info = snap.exists()
                ? snap.val()
                : { nombre: "Invernadero" };

            if (greenhouseName) {
                greenhouseName.textContent = info.nombre;
            }

            if (greenhouseCode) {
                greenhouseCode.textContent = codigo;
            }

        }
    );


    // -----------------------------------------------------
    // SENSORES
    // -----------------------------------------------------

    onValue(
        ref(database, `greenhouses/${codigo}/sensores`),
        (snap) => {

            const datos = snap.exists()
                ? snap.val()
                : {};

            actualizarSensores(datos);

        }
    );


    // -----------------------------------------------------
    // ESTADO DEL ESP32
    // -----------------------------------------------------

    onValue(
        ref(database, `greenhouses/${codigo}/estado/ultimaConexion`),
        (snap) => {

            if (!snap.exists()) {

                actualizarEstadoSistema("sin-datos");

                return;
            }

            const ultimaConexion = obtenerTimestamp(snap.val());

            if (!ultimaConexion) {

                actualizarEstadoSistema("sin-datos");

                return;
            }

            comprobarConexion(ultimaConexion);

        }
    );

}


// =========================================================
// ACTUALIZAR SENSORES
// =========================================================

function actualizarSensores(datos) {

    SENSORES.forEach(([elementId, campo]) => {

        const el = document.getElementById(elementId);

        if (!el) return;

        if (datos[campo] === undefined || datos[campo] === null) {

            el.textContent = "—";

        } else {

            el.textContent = datos[campo];

        }

    });

}


// =========================================================
// COMPROBAR CONEXIÓN
// =========================================================

function comprobarConexion(ultimaConexion) {

    const ahora = Date.now();

    const diferencia = ahora - ultimaConexion;


    // -----------------------------------------------------
    // ESP32 ONLINE
    // -----------------------------------------------------

    if (
        diferencia >= 0 &&
        diferencia <= TIEMPO_MAXIMO_SIN_DATOS
    ) {

        actualizarEstadoSistema("online");

        mostrarSensores();

        return;
    }


    // -----------------------------------------------------
    // ESP32 OFFLINE
    // -----------------------------------------------------

    actualizarEstadoSistema("offline");

    ocultarSensores();

}


// =========================================================
// ACTUALIZAR ESTADO VISUAL
// =========================================================

function actualizarEstadoSistema(estado) {

    if (!systemStatus || !systemStatusText) return;


    // Limpiamos estados anteriores

    systemStatus.classList.remove(
        "online",
        "offline",
        "no-data"
    );


    // -----------------------------------------------------
    // ONLINE
    // -----------------------------------------------------

    if (estado === "online") {

        systemStatus.classList.add("online");

        systemStatusText.textContent = "Sistema online";

        return;
    }


    // -----------------------------------------------------
    // OFFLINE
    // -----------------------------------------------------

    if (estado === "offline") {

        systemStatus.classList.add("offline");

        systemStatusText.textContent = "Sistema offline";

        return;
    }


    // -----------------------------------------------------
    // SIN DATOS
    // -----------------------------------------------------

    systemStatus.classList.add("no-data");

    systemStatusText.textContent = "Sin conexión";

}


// =========================================================
// OCULTAR DATOS DE LOS SENSORES
// =========================================================

function ocultarSensores() {

    SENSORES.forEach(([elementId]) => {

        const el = document.getElementById(elementId);

        if (!el) return;

        el.textContent = "—";

    });

}


// =========================================================
// MOSTRAR DATOS DE LOS SENSORES
// =========================================================
//
// Cuando vuelve a estar online, el listener de Firebase
// ya habrá recibido los datos actuales.
//

function mostrarSensores() {

    // No necesitamos hacer nada aquí.
    //
    // El listener de "sensores" ya mantiene los valores
    // actualizados automáticamente.
}


// =========================================================
// CONVERTIR TIMESTAMP
// =========================================================

function obtenerTimestamp(valor) {

    // Firebase puede devolver un número directamente.

    if (typeof valor === "number") {

        return valor;
    }


    // Si llega como texto numérico.

    if (typeof valor === "string") {

        const numero = Number(valor);

        if (!Number.isNaN(numero)) {

            return numero;
        }


        // También permitimos una fecha ISO.

        const fecha = Date.parse(valor);

        if (!Number.isNaN(fecha)) {

            return fecha;
        }

    }


    return null;
}


// =========================================================
// COMPROBAR PERIÓDICAMENTE SI SIGUE ONLINE
// =========================================================
//
// Esto es importante.
//
// Firebase solo ejecuta onValue cuando cambia
// "ultimaConexion". Si el ESP32 deja de enviar datos,
// necesitamos comprobar el tiempo nosotros mismos.
//
// Por eso revisamos el estado cada 10 segundos.
//

setInterval(() => {

    if (!codigo) return;

    onValue(
        ref(database, `greenhouses/${codigo}/estado/ultimaConexion`),
        (snap) => {

            if (!snap.exists()) {

                actualizarEstadoSistema("sin-datos");
                ocultarSensores();

                return;
            }

            const ultimaConexion = obtenerTimestamp(snap.val());

            if (!ultimaConexion) {

                actualizarEstadoSistema("sin-datos");
                ocultarSensores();

                return;
            }

            comprobarConexion(ultimaConexion);

        },
        {
            onlyOnce: true
        }
    );

}, 10000);


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

        if (themeButton) {
            themeButton.textContent = "☀️";
        }

    }

}


themeButton?.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const dark = document.body.classList.contains("dark");

    localStorage.setItem(
        "growsync-theme",
        dark ? "dark" : "light"
    );

    themeButton.textContent = dark
        ? "☀️"
        : "🌙";

});


cargarTema();
