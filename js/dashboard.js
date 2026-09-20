// =========================================================
// GROWSYNC - DASHBOARD
// =========================================================

import { auth, database } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    onValue,
    get,
    set
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


// =========================================================
// CONFIGURACIÓN
// =========================================================

// Tiempo máximo sin recibir datos antes de considerar
// un sensor/invernadero como Offline.

const TIEMPO_MAXIMO_SIN_DATOS = 2 * 60 * 1000;


// =========================================================
// SENSORES
// =========================================================

const SENSORES = [

    {
        id: "temperature",
        campo: "temperatura"
    },

    {
        id: "humidity",
        campo: "humedad"
    },

    {
        id: "soil",
        campo: "suelo"
    },

    {
        id: "light",
        campo: "luz"
    },

    {
        id: "water",
        campo: "agua"
    },

    {
        id: "battery",
        campo: "bateria"
    },

    {
        id: "solar",
        campo: "solar"
    }

];


// =========================================================
// ELEMENTOS HTML
// =========================================================

const greenhouseName =
    document.getElementById("greenhouseName");

const greenhouseCode =
    document.getElementById("greenhouseCode");

const systemStatus =
    document.getElementById("systemStatus");

const systemStatusText =
    document.getElementById("systemStatusText");

const themeButton =
    document.getElementById("themeButton");

const userAvatar =
    document.getElementById("userAvatar");


// =========================================================
// INVERNADERO SELECCIONADO
// =========================================================

const codigoInvernadero =
    localStorage.getItem("selectedGreenhouse");


// Si no hay invernadero seleccionado,
// volvemos a la pantalla de invernaderos.

if (!codigoInvernadero) {

    window.location.href =
        "invernaderos.html";

}


// =========================================================
// AUTENTICACIÓN
// =========================================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href =
            "index.html";

        return;
    }


    // Avatar

    if (userAvatar) {

        userAvatar.textContent =
            (user.email || "U")
                .charAt(0)
                .toUpperCase();

    }


    // Cargar información

    cargarInformacionInvernadero();

    cargarEstadoSistema();

    cargarSensores();

    cargarRolYControles(
        user.uid,
        user.email
    );

});


// =========================================================
// ROL DEL USUARIO EN ESTE INVERNADERO
// =========================================================

const CONTROLES = ["riego", "luz", "ventilacion"];

async function cargarRolYControles(uid, miEmail) {

    try {

        const infoSnap = await get(
            ref(database, `greenhouses/${codigoInvernadero}/info`)
        );

        const info = infoSnap.exists() ? infoSnap.val() : {};

        let miembrosSnap = await get(
            ref(database, `greenhouses/${codigoInvernadero}/miembros`)
        );

        // Migración: invernaderos creados antes del sistema de roles
        if (!miembrosSnap.exists() && info.propietario === uid) {

            await set(
                ref(database, `greenhouses/${codigoInvernadero}/miembros/${uid}`),
                { rol: "administrador", email: miEmail }
            );

            miembrosSnap = await get(
                ref(database, `greenhouses/${codigoInvernadero}/miembros`)
            );

        }

        const miembros = miembrosSnap.exists() ? miembrosSnap.val() : {};
        const miRol = miembros[uid]?.rol || "lector";

        configurarControles(miRol);

        cargarConfiguracionSensores(uid, miRol, info);

    } catch (error) {

        console.error("Error obteniendo el rol:", error);

        // Si algo falla, por seguridad se trata como solo lectura
        configurarControles("lector");

    }

}


// =========================================================
// QUÉ SENSORES SE MUESTRAN (según lo que haya añadido
// el administrador en Ajustes)
// =========================================================

async function cargarConfiguracionSensores(uid, miRol, info) {

    let configSnap = await get(
        ref(database, `greenhouses/${codigoInvernadero}/sensoresConfig`)
    );

    // Migración: invernaderos de antes de este sistema.
    // Si nadie lo ha configurado nunca, un administrador
    // deja los 7 sensores de siempre como añadidos y activos.
    if (!configSnap.exists() && miRol === "administrador") {

        const todos = {};
        SENSORES.forEach((s) => { todos[s.campo] = { activo: true }; });

        await set(
            ref(database, `greenhouses/${codigoInvernadero}/sensoresConfig`),
            todos
        );

        configSnap = await get(
            ref(database, `greenhouses/${codigoInvernadero}/sensoresConfig`)
        );

    }

    aplicarConfiguracionSensores(configSnap.exists() ? configSnap.val() : {});

    // En vivo: si el administrador añade/quita/activa un sensor
    // desde Ajustes mientras esta pantalla está abierta.
    onValue(
        ref(database, `greenhouses/${codigoInvernadero}/sensoresConfig`),
        (snap) => {
            aplicarConfiguracionSensores(snap.exists() ? snap.val() : {});
        }
    );

}


function aplicarConfiguracionSensores(config) {

    SENSORES.forEach((sensor) => {

        const tarjeta = document.querySelector(`[data-sensor="${sensor.id}"]`);
        if (!tarjeta) return;

        const entrada = config[sensor.campo];
        const visible = !!entrada && entrada.activo !== false;

        tarjeta.hidden = !visible;

    });

}


function esControlador(rol) {
    return rol === "administrador" || rol === "gestor";
}


function configurarControles(miRol) {

    const nota = document.getElementById("controlsReadonlyNote");
    const puedeControlar = esControlador(miRol);

    if (nota) nota.hidden = puedeControlar;

    CONTROLES.forEach((control) => {

        const boton = document.getElementById(`toggle${capitalizar(control)}`);
        if (!boton) return;

        boton.disabled = !puedeControlar;

        boton.addEventListener("click", async () => {

            const activo = boton.dataset.on === "true";
            const nuevoEstado = !activo;

            try {

                await set(
                    ref(database, `greenhouses/${codigoInvernadero}/controles/${control}/activo`),
                    nuevoEstado
                );

            } catch (error) {

                console.error(`Error cambiando ${control}:`, error);
                alert("No se ha podido cambiar el estado. Comprueba tu rol o tu conexión.");

            }

        });

        // Estado en vivo (por si el ESP32 u otra persona lo cambia)
        onValue(
            ref(database, `greenhouses/${codigoInvernadero}/controles/${control}/activo`),
            (snap) => {
                const activo = snap.exists() && snap.val() === true;
                actualizarBotonControl(control, activo);
            }
        );

    });

}


function actualizarBotonControl(control, activo) {

    const boton = document.getElementById(`toggle${capitalizar(control)}`);
    const estadoTexto = document.getElementById(`estado${capitalizar(control)}`);

    if (boton) {
        boton.dataset.on = activo ? "true" : "false";
        boton.textContent = activo ? "Desactivar" : "Activar";
    }

    if (estadoTexto) {

        const nombres = {
            riego: ["Apagado", "Regando"],
            luz: ["Apagada", "Encendida"],
            ventilacion: ["Apagada", "En marcha"]
        };

        const [apagadoTxt, encendidoTxt] = nombres[control] || ["Apagado", "Encendido"];

        estadoTexto.textContent = activo ? encendidoTxt : apagadoTxt;
        estadoTexto.classList.toggle("on", activo);

    }

}


function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}


// =========================================================
// INFORMACIÓN DEL INVERNADERO
// =========================================================

function cargarInformacionInvernadero() {

    const infoRef =
        ref(
            database,
            `greenhouses/${codigoInvernadero}/info`
        );


    onValue(infoRef, (snapshot) => {

        if (!snapshot.exists()) {

            console.warn(
                "No existe información del invernadero:",
                codigoInvernadero
            );

            return;
        }


        const info =
            snapshot.val();


        // -----------------------------------------
        // NOMBRE
        // -----------------------------------------

        if (greenhouseName) {

            greenhouseName.textContent =
                info.nombre || "Mi invernadero";

        }


        // -----------------------------------------
        // CÓDIGO
        // -----------------------------------------

        if (greenhouseCode) {

            greenhouseCode.textContent =
                codigoInvernadero;

        }

    }, (error) => {

        console.error(
            "Error leyendo información del invernadero:",
            error
        );

    });

}


// =========================================================
// ESTADO GENERAL DEL SISTEMA
// =========================================================

function cargarEstadoSistema() {

    const estadoRef =
        ref(
            database,
            `greenhouses/${codigoInvernadero}/estado/ultimaConexion`
        );


    onValue(estadoRef, (snapshot) => {

        if (!snapshot.exists()) {

            ponerSistemaOffline();

            return;
        }


        const ultimaConexion =
            convertirTimestamp(
                snapshot.val()
            );


        comprobarEstadoSistema(
            ultimaConexion
        );

    }, (error) => {

        console.error(
            "Error leyendo estado del sistema:",
            error
        );

        ponerSistemaOffline();

    });

}


// =========================================================
// COMPROBAR ESTADO DEL SISTEMA
// =========================================================

function comprobarEstadoSistema(ultimaConexion) {

    if (!ultimaConexion) {

        ponerSistemaOffline();

        return;
    }


    const tiempoSinDatos =
        Date.now() - ultimaConexion;


    if (
        tiempoSinDatos <=
        TIEMPO_MAXIMO_SIN_DATOS
    ) {

        ponerSistemaOnline();

    }
    else {

        ponerSistemaOffline();

    }

}


// =========================================================
// SISTEMA ONLINE
// =========================================================

function ponerSistemaOnline() {

    if (!systemStatus) {
        return;
    }


    systemStatus.classList.remove(
        "offline",
        "no-data"
    );

    systemStatus.classList.add(
        "online"
    );


    if (systemStatusText) {

        systemStatusText.textContent =
            "Sistema Online";

    }

}


// =========================================================
// SISTEMA OFFLINE
// =========================================================

function ponerSistemaOffline() {

    if (!systemStatus) {
        return;
    }


    systemStatus.classList.remove(
        "online",
        "no-data"
    );

    systemStatus.classList.add(
        "offline"
    );


    if (systemStatusText) {

        systemStatusText.textContent =
            "Sistema Offline";

    }

}


// =========================================================
// CARGAR SENSORES
// =========================================================

function cargarSensores() {

    const sensoresRef =
        ref(
            database,
            `greenhouses/${codigoInvernadero}/sensores`
        );


    onValue(sensoresRef, (snapshot) => {

        if (!snapshot.exists()) {

            SENSORES.forEach((sensor) => {

                ponerSensorOffline(sensor);

            });

            return;
        }


        const sensores =
            snapshot.val();


        SENSORES.forEach((sensor) => {

            const datos =
                sensores[sensor.campo];


            actualizarSensor(
                sensor,
                datos
            );

        });

    }, (error) => {

        console.error(
            "Error leyendo sensores:",
            error
        );

        SENSORES.forEach((sensor) => {

            ponerSensorOffline(sensor);

        });

    });

}


// =========================================================
// ACTUALIZAR SENSOR
// =========================================================

function actualizarSensor(sensor, datos) {

    const elementoValor =
        document.getElementById(
            sensor.id
        );


    const tarjeta =
        document.querySelector(
            `[data-sensor="${sensor.id}"]`
        );


    if (!tarjeta) {
        return;
    }


    const estado =
        tarjeta.querySelector(
            ".sensor-status"
        );


    const punto =
        tarjeta.querySelector(
            ".sensor-status-dot"
        );


    const textoEstado =
        tarjeta.querySelector(
            ".sensor-status-text"
        );


    const ultimaActualizacion =
        tarjeta.querySelector(
            ".sensor-last-update"
        );


    // No existen datos

    if (!datos) {

        ponerSensorOffline(
            sensor
        );

        return;
    }


    const valor =
        datos.valor;


    const ultimaConexion =
        convertirTimestamp(
            datos.ultimaConexion
        );


    // Sin timestamp

    if (!ultimaConexion) {

        ponerSensorOffline(
            sensor
        );

        return;
    }


    const tiempoSinDatos =
        Date.now() - ultimaConexion;


    // Sensor Offline

    if (
        tiempoSinDatos >
        TIEMPO_MAXIMO_SIN_DATOS
    ) {

        ponerSensorOffline(
            sensor
        );

        return;
    }


    // =====================================================
    // SENSOR ONLINE
    // =====================================================

    if (elementoValor) {

        elementoValor.textContent =
            valor ?? "—";

    }


    if (estado) {

        estado.classList.remove(
            "offline"
        );

        estado.classList.add(
            "online"
        );

    }


    if (punto) {

        punto.classList.remove(
            "offline"
        );

        punto.classList.add(
            "online"
        );

    }


    if (textoEstado) {

        textoEstado.textContent =
            "Online";

    }


    if (ultimaActualizacion) {

        ultimaActualizacion.textContent =
            `Actualizado ${tiempoTranscurrido(ultimaConexion)}`;

    }


    // Guardamos el timestamp en la tarjeta
    // para poder comprobarlo periódicamente.

    tarjeta.dataset.ultimaConexion =
        ultimaConexion;

}


// =========================================================
// SENSOR OFFLINE
// =========================================================

function ponerSensorOffline(sensor) {

    const elementoValor =
        document.getElementById(
            sensor.id
        );


    const tarjeta =
        document.querySelector(
            `[data-sensor="${sensor.id}"]`
        );


    if (!tarjeta) {
        return;
    }


    const estado =
        tarjeta.querySelector(
            ".sensor-status"
        );


    const punto =
        tarjeta.querySelector(
            ".sensor-status-dot"
        );


    const textoEstado =
        tarjeta.querySelector(
            ".sensor-status-text"
        );


    const ultimaActualizacion =
        tarjeta.querySelector(
            ".sensor-last-update"
        );


    if (elementoValor) {

        elementoValor.textContent =
            "—";

    }


    if (estado) {

        estado.classList.remove(
            "online"
        );

        estado.classList.add(
            "offline"
        );

    }


    if (punto) {

        punto.classList.remove(
            "online"
        );

        punto.classList.add(
            "offline"
        );

    }


    if (textoEstado) {

        textoEstado.textContent =
            "Offline";

    }


    if (ultimaActualizacion) {

        ultimaActualizacion.textContent =
            "Sin datos recibidos";

    }


    delete tarjeta.dataset.ultimaConexion;

}


// =========================================================
// COMPROBAR SENSORES CADA 10 SEGUNDOS
// =========================================================

setInterval(() => {

    comprobarSensores();

}, 10000);


// =========================================================
// COMPROBAR SENSORES
// =========================================================

function comprobarSensores() {

    const tarjetas =
        document.querySelectorAll(
            ".sensor-card"
        );


    tarjetas.forEach((tarjeta) => {

        const timestamp =
            Number(
                tarjeta.dataset.ultimaConexion
            );


        if (!timestamp) {
            return;
        }


        const tiempoSinDatos =
            Date.now() - timestamp;


        if (
            tiempoSinDatos >
            TIEMPO_MAXIMO_SIN_DATOS
        ) {

            const sensorId =
                tarjeta.dataset.sensor;


            const sensor =
                SENSORES.find(
                    (item) =>
                        item.id === sensorId
                );


            if (sensor) {

                ponerSensorOffline(
                    sensor
                );

            }

        }

    });

}


// =========================================================
// CONVERTIR TIMESTAMP
// =========================================================

function convertirTimestamp(timestamp) {

    if (
        timestamp === undefined ||
        timestamp === null
    ) {

        return null;

    }


    // Timestamp numérico

    if (
        typeof timestamp ===
        "number"
    ) {

        return timestamp;

    }


    // Fecha en formato texto

    if (
        typeof timestamp ===
        "string"
    ) {

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

    const diferencia =
        Date.now() - timestamp;


    if (diferencia < 10000) {

        return "ahora mismo";

    }


    const segundos =
        Math.floor(
            diferencia / 1000
        );


    if (segundos < 60) {

        return `hace ${segundos} s`;

    }


    const minutos =
        Math.floor(
            segundos / 60
        );


    if (minutos < 60) {

        return `hace ${minutos} min`;

    }


    const horas =
        Math.floor(
            minutos / 60
        );


    return `hace ${horas} h`;

}


// =========================================================
// TEMA
// =========================================================

function cargarTema() {

    const tema =
        localStorage.getItem(
            "growsync-theme"
        );


    if (
        tema === "dark"
    ) {

        document.body.classList.add(
            "dark"
        );


        if (themeButton) {

            themeButton.textContent =
                "☀️";

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
            dark
                ? "dark"
                : "light"
        );


        themeButton.textContent =
            dark
                ? "☀️"
                : "🌙";

    }
);


// =========================================================
// INICIAR TEMA
// =========================================================

cargarTema();
