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


// =========================================================
// TIEMPO MÁXIMO SIN RECIBIR DATOS
// =========================================================

// Si un sensor lleva más de 2 minutos sin actualizarse,
// se considera OFFLINE.

const TIEMPO_MAXIMO_SIN_DATOS = 2 * 60 * 1000;


// =========================================================
// SENSORES
// =========================================================
//
// id       = nombre utilizado en el HTML
// campo    = nombre que utiliza Firebase
// unidad   = unidad que mostramos
//

const SENSORES = [
    {
        id: "temperature",
        campo: "temperatura",
        unidad: "°C"
    },
    {
        id: "humidity",
        campo: "humedad",
        unidad: "%"
    },
    {
        id: "soil",
        campo: "suelo",
        unidad: "%"
    },
    {
        id: "light",
        campo: "luz",
        unidad: "lux"
    },
    {
        id: "water",
        campo: "agua",
        unidad: "%"
    },
    {
        id: "battery",
        campo: "bateria",
        unidad: "%"
    },
    {
        id: "solar",
        campo: "solar",
        unidad: "W"
    }
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
        window.location.href = "index.html";
        return;
    }

    if (userAvatar) {
        userAvatar.textContent =
            (user.email || "U")[0].toUpperCase();
    }

    cargarDatos();

});


// =========================================================
// CARGAR DATOS
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
                : {
                    nombre: "Invernadero"
                };

            if (greenhouseName) {
                greenhouseName.textContent =
                    info.nombre || "Invernadero";
            }

            if (greenhouseCode) {
                greenhouseCode.textContent = codigo;
            }

        }
    );


    // -----------------------------------------------------
    // DATOS DE LOS SENSORES
    // -----------------------------------------------------

    onValue(
        ref(database, `greenhouses/${codigo}/sensores`),
        (snap) => {

            const datos = snap.exists()
                ? snap.val()
                : {};

            SENSORES.forEach((sensor) => {

                actualizarSensor(
                    sensor,
                    datos[sensor.campo]
                );

            });

        }
    );

}


// =========================================================
// ACTUALIZAR SENSOR
// =========================================================

function actualizarSensor(sensor, datos) {

    const valorElement =
        document.getElementById(sensor.id);

    const tarjeta =
        document.querySelector(
            `[data-sensor="${sensor.id}"]`
        );

    if (!valorElement || !tarjeta) {
        return;
    }

    const estadoElement =
        tarjeta.querySelector(".sensor-status");

    const puntoEstado =
        tarjeta.querySelector(".sensor-status-dot");

    const ultimaActualizacionElement =
        tarjeta.querySelector(".sensor-last-update");


    if (
        !datos ||
        datos.valor === undefined ||
        datos.ultimaConexion === undefined
    ) {

        tarjeta.dataset.ultimaConexion = "";

        ponerSensorOffline(
            valorElement,
            estadoElement,
            puntoEstado,
            ultimaActualizacionElement
        );

        return;
    }


    const ultimaConexion =
        convertirTimestamp(datos.ultimaConexion);


    if (!ultimaConexion) {

        tarjeta.dataset.ultimaConexion = "";

        ponerSensorOffline(
            valorElement,
            estadoElement,
            puntoEstado,
            ultimaActualizacionElement
        );

        return;
    }


    // Guardamos la última conexión en la tarjeta.
    tarjeta.dataset.ultimaConexion =
        ultimaConexion;


    const tiempoSinDatos =
        Date.now() - ultimaConexion;


    if (
        tiempoSinDatos >
        TIEMPO_MAXIMO_SIN_DATOS
    ) {

        ponerSensorOffline(
            valorElement,
            estadoElement,
            puntoEstado,
            ultimaActualizacionElement,
            ultimaConexion
        );

        return;
    }


    ponerSensorOnline(
        valorElement,
        estadoElement,
        puntoEstado,
        ultimaActualizacionElement,
        datos.valor,
        sensor.unidad,
        ultimaConexion
    );
}


    // -----------------------------------------------------
    // ELEMENTOS DE ESTADO
    // -----------------------------------------------------

    const estadoElement =
        tarjeta.querySelector(".sensor-status");

    const puntoEstado =
        tarjeta.querySelector(".sensor-status-dot");

    const ultimaActualizacionElement =
        tarjeta.querySelector(".sensor-last-update");


    // -----------------------------------------------------
    // COMPROBAR SI EXISTEN DATOS
    // -----------------------------------------------------

    if (
        !datos ||
        datos.valor === undefined ||
        datos.ultimaConexion === undefined
    ) {

        ponerSensorOffline(
            valorElement,
            estadoElement,
            puntoEstado,
            ultimaActualizacionElement
        );

        return;
    }


    // -----------------------------------------------------
    // COMPROBAR FECHA
    // -----------------------------------------------------

    const ultimaConexion =
        convertirTimestamp(datos.ultimaConexion);

    if (!ultimaConexion) {

        ponerSensorOffline(
            valorElement,
            estadoElement,
            puntoEstado,
            ultimaActualizacionElement
        );

        return;
    }


    const ahora = Date.now();

    const tiempoSinDatos =
        ahora - ultimaConexion;


    // -----------------------------------------------------
    // SENSOR OFFLINE
    // -----------------------------------------------------

    if (
        tiempoSinDatos >
        TIEMPO_MAXIMO_SIN_DATOS
    ) {

        ponerSensorOffline(
            valorElement,
            estadoElement,
            puntoEstado,
            ultimaActualizacionElement,
            ultimaConexion
        );

        return;
    }


    // -----------------------------------------------------
    // SENSOR ONLINE
    // -----------------------------------------------------

    ponerSensorOnline(
        valorElement,
        estadoElement,
        puntoEstado,
        ultimaActualizacionElement,
        datos.valor,
        sensor.unidad,
        ultimaConexion
    );

}


// =========================================================
// SENSOR ONLINE
// =========================================================

function ponerSensorOnline(
    valorElement,
    estadoElement,
    puntoEstado,
    ultimaActualizacionElement,
    valor,
    unidad,
    ultimaConexion
) {

    valorElement.textContent =
        `${valor} ${unidad}`;


    if (estadoElement) {

        estadoElement.textContent =
            "Online";

        estadoElement.classList.remove(
            "offline"
        );

        estadoElement.classList.add(
            "online"
        );
    }


    if (puntoEstado) {

        puntoEstado.classList.remove(
            "offline"
        );

        puntoEstado.classList.add(
            "online"
        );
    }


    if (ultimaActualizacionElement) {

        ultimaActualizacionElement.textContent =
            `Actualizado ${tiempoTranscurrido(ultimaConexion)}`;
    }

}


// =========================================================
// SENSOR OFFLINE
// =========================================================

function ponerSensorOffline(
    valorElement,
    estadoElement,
    puntoEstado,
    ultimaActualizacionElement,
    ultimaConexion = null
) {

    // No mostramos un dato que ya no sabemos
    // si es actual.

    valorElement.textContent = "—";


    if (estadoElement) {

        estadoElement.textContent =
            "Offline";

        estadoElement.classList.remove(
            "online"
        );

        estadoElement.classList.add(
            "offline"
        );
    }


    if (puntoEstado) {

        puntoEstado.classList.remove(
            "online"
        );

        puntoEstado.classList.add(
            "offline"
        );
    }


    if (ultimaActualizacionElement) {

        if (ultimaConexion) {

            ultimaActualizacionElement.textContent =
                `Sin datos desde ${tiempoTranscurrido(ultimaConexion)}`;

        } else {

            ultimaActualizacionElement.textContent =
                "Sin datos recibidos";

        }

    }

}


// =========================================================
// CONVERTIR TIMESTAMP
// =========================================================

function convertirTimestamp(timestamp) {

    if (timestamp === null ||
        timestamp === undefined) {

        return null;
    }


    // Firebase normalmente devolverá
    // un timestamp numérico en milisegundos.

    if (typeof timestamp === "number") {

        return timestamp;
    }


    // Por si en algún momento utilizamos
    // una fecha ISO.

    if (typeof timestamp === "string") {

        const fecha =
            Date.parse(timestamp);

        if (!Number.isNaN(fecha)) {
            return fecha;
        }

    }


    return null;
}


// =========================================================
// TIEMPO TRANSCURRIDO
// =========================================================

function tiempoTranscurrido(timestamp) {

    if (!timestamp) {
        return "—";
    }


    const segundos =
        Math.floor(
            (Date.now() - timestamp) / 1000
        );


    if (segundos < 5) {
        return "ahora mismo";
    }


    if (segundos < 60) {
        return `hace ${segundos} s`;
    }


    const minutos =
        Math.floor(segundos / 60);


    if (minutos < 60) {

        return `hace ${minutos} min`;
    }


    const horas =
        Math.floor(minutos / 60);


    return `hace ${horas} h`;
}


// =========================================================
// COMPROBAR ESTADO PERIÓDICAMENTE
// =========================================================
//
// Firebase solo nos avisa cuando cambia un dato.
//
// Por eso comprobamos cada 10 segundos si alguno
// de los sensores ha superado los 2 minutos.
//

setInterval(() => {

    comprobarSensores();

}, 10000);


// =========================================================
// COMPROBAR SENSORES
// =========================================================

function comprobarSensores() {

    SENSORES.forEach((sensor) => {

        const tarjeta =
            document.querySelector(
                `[data-sensor="${sensor.id}"]`
            );

        if (!tarjeta) {
            return;
        }


        const ultimaConexion =
            tarjeta.dataset.ultimaConexion;

        if (!ultimaConexion) {
            return;
        }


        const tiempo =
            Number(ultimaConexion);


        if (
            Date.now() - tiempo >
            TIEMPO_MAXIMO_SIN_DATOS
        ) {

            const valorElement =
                document.getElementById(sensor.id);

            const estadoElement =
                tarjeta.querySelector(".sensor-status");

            const puntoEstado =
                tarjeta.querySelector(
                    ".sensor-status-dot"
                );

            const ultimaActualizacionElement =
                tarjeta.querySelector(
                    ".sensor-last-update"
                );


            ponerSensorOffline(
                valorElement,
                estadoElement,
                puntoEstado,
                ultimaActualizacionElement,
                tiempo
            );

        }

    });

}


// =========================================================
// GUARDAR ÚLTIMA CONEXIÓN EN LA TARJETA
// =========================================================
//
// Guardamos el timestamp en data-ultima-conexion
// para poder comprobarlo cada 10 segundos.
//

const observer =
    new MutationObserver(() => {

        SENSORES.forEach((sensor) => {

            const tarjeta =
                document.querySelector(
                    `[data-sensor="${sensor.id}"]`
                );

            if (!tarjeta) {
                return;
            }

            // Si todavía no tiene timestamp,
            // no hacemos nada aquí.

        });

    });

observer.observe(
    document.body,
    {
        childList: true,
        subtree: true
    }
);


// =========================================================
// VOLVER
// =========================================================

backButton?.addEventListener(
    "click",
    () => {

        window.location.href =
            "invernaderos.html";

    }
);


// =========================================================
// TEMA
// =========================================================

function cargarTema() {

    const tema =
        localStorage.getItem(
            "growsync-theme"
        );

    if (tema === "dark") {

        document.body.classList.add(
            "dark"
        );

        if (themeButton) {
            themeButton.textContent = "☀️";
        }

    }

}


themeButton?.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );

        const dark =
            document.body.classList.contains(
                "dark"
            );

        localStorage.setItem(
            "growsync-theme",
            dark ? "dark" : "light"
        );

        if (themeButton) {

            themeButton.textContent =
                dark ? "☀️" : "🌙";

        }

    }
);


cargarTema();
