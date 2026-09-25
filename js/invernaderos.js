// =========================================================
// GROWSYNC - INVERNADEROS
// =========================================================

import { auth, database } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    get,
    set,
    onValue
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


// =========================================================
// CONFIGURACIÓN
// =========================================================

const TIEMPO_MAXIMO_SIN_DATOS = 2 * 60 * 1000;


// =========================================================
// ELEMENTOS HTML
// =========================================================

const container =
    document.getElementById(
        "greenhousesContainer"
    );

const modal =
    document.getElementById(
        "greenhouseModal"
    );

const addButton =
    document.getElementById(
        "addGreenhouseButton"
    );

const closeModal =
    document.getElementById(
        "closeModal"
    );

const themeButton =
    document.getElementById(
        "themeButton"
    );

const userAvatar =
    document.getElementById(
        "userAvatar"
    );


// =========================================================
// VARIABLES
// =========================================================

let uidActual = null;

let listaInvernaderos = [];


// =========================================================
// AUTENTICACIÓN
// =========================================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href =
            "index.html";

        return;
    }


    uidActual =
        user.uid;


    // Avatar

    if (userAvatar) {

        userAvatar.textContent =
            (user.email || "U")
                .charAt(0)
                .toUpperCase();

    }


    cargarInvernaderos();

});


// =========================================================
// TEMPERATURA EXTERIOR (Open-Meteo, gratis, sin clave)
// =========================================================

async function obtenerTemperaturaExterior(ubicacion) {

    if (!ubicacion || ubicacion === "—") return null;

    try {

        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(ubicacion)}&count=1&language=es`
        );
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            return null;
        }

        const { latitude, longitude } = geoData.results[0];

        const climaRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`
        );
        const climaData = await climaRes.json();

        return climaData?.current?.temperature_2m ?? null;

    } catch (error) {

        console.error("Error obteniendo temperatura exterior:", error);
        return null;

    }

}


// =========================================================
// CARGAR INVERNADEROS
// =========================================================

async function cargarInvernaderos() {

    if (!uidActual) {
        return;
    }


    if (!container) {
        return;
    }


    container.innerHTML =
        "<p>Cargando invernaderos...</p>";


    try {

        // -----------------------------------------
        // INVERNADEROS DEL USUARIO
        // -----------------------------------------

        const listaRef =
            ref(
                database,
                `users/${uidActual}/greenhouses`
            );


        const listaSnap =
            await get(listaRef);


        if (!listaSnap.exists()) {

            renderGreenhouses([]);

            return;
        }


        const datosUsuario =
            listaSnap.val();


        const codigos =
            Object.keys(datosUsuario);


        if (codigos.length === 0) {

            renderGreenhouses([]);

            return;
        }


        const invernaderos = [];


        // -----------------------------------------
        // CARGAR CADA INVERNADERO
        // -----------------------------------------

        for (const codigo of codigos) {

            try {

                // Información

                const infoSnap =
                    await get(
                        ref(
                            database,
                            `greenhouses/${codigo}/info`
                        )
                    );


                // Sensores

                const sensoresSnap =
                    await get(
                        ref(
                            database,
                            `greenhouses/${codigo}/sensores`
                        )
                    );


                // Estado

                const estadoSnap =
                    await get(
                        ref(
                            database,
                            `greenhouses/${codigo}/estado`
                        )
                    );


                const info =
                    infoSnap.exists()
                        ? infoSnap.val()
                        : {};


                const sensores =
                    sensoresSnap.exists()
                        ? sensoresSnap.val()
                        : {};


                const estado =
                    estadoSnap.exists()
                        ? estadoSnap.val()
                        : {};


                // -----------------------------------------
                // ESTADO ONLINE / OFFLINE
                // -----------------------------------------

                const ultimaConexion =
                    convertirTimestamp(
                        estado.ultimaConexion
                    );


                const online =
                    ultimaConexion !== null &&
                    Date.now() -
                        ultimaConexion <=
                        TIEMPO_MAXIMO_SIN_DATOS;


                // -----------------------------------------
                // TEMPERATURA
                // -----------------------------------------

                const temperatura =
                    obtenerValorSensor(
                        sensores.temperatura
                    );


                // -----------------------------------------
                // HUMEDAD
                // -----------------------------------------

                const humedad =
                    obtenerValorSensor(
                        sensores.humedad
                    );


                // -----------------------------------------
                // TEMPERATURA EXTERIOR (de internet)
                // -----------------------------------------

                const exterior =
                    await obtenerTemperaturaExterior(
                        info.ubicacion
                    );


                // -----------------------------------------
                // GUARDAR
                // -----------------------------------------

                invernaderos.push({

                    id:
                        codigo,

                    name:
                        info.nombre ||
                        codigo,

                    location:
                        info.ubicacion ||
                        "—",

                    temperature:
                        temperatura,

                    humidity:
                        humedad,

                    exterior:
                        exterior,

                    online:
                        online,

                    ultimaConexion:
                        ultimaConexion

                });

            }
            catch (error) {

                console.error(
                    `Error cargando ${codigo}:`,
                    error
                );


                // Aunque haya un error en los datos,
                // seguimos mostrando el invernadero.

                invernaderos.push({

                    id:
                        codigo,

                    name:
                        codigo,

                    location:
                        "—",

                    temperature:
                        undefined,

                    humidity:
                        undefined,

                    exterior:
                        undefined,

                    online:
                        false,

                    ultimaConexion:
                        null

                });

            }

        }


        listaInvernaderos =
            invernaderos;


        renderGreenhouses(
            invernaderos
        );

    }
    catch (error) {

        console.error(
            "Error cargando invernaderos:",
            error
        );


        container.innerHTML = `

            <div class="greenhouse-error">

                <strong>
                    No se han podido cargar los invernaderos.
                </strong>

                <p>
                    Comprueba la conexión con Firebase.
                </p>

            </div>

        `;

    }

}


// =========================================================
// MOSTRAR INVERNADEROS
// =========================================================

function renderGreenhouses(greenhouses) {

    container.innerHTML = "";


    // =====================================================
    // NO HAY INVERNADEROS
    // =====================================================

    if (greenhouses.length === 0) {

        const vacio =
            document.createElement(
                "p"
            );


        vacio.textContent =
            "Aún no tienes ningún invernadero. Crea uno o únete con un código.";


        container.appendChild(
            vacio
        );

    }


    // =====================================================
    // INVERNADEROS
    // =====================================================

    greenhouses.forEach((greenhouse) => {

        const card =
            document.createElement(
                "article"
            );


        card.className =
            "greenhouse-card";


        // -----------------------------------------
        // DATOS
        // -----------------------------------------

        const temp =
            greenhouse.online &&
            greenhouse.temperature !== undefined
                ? `${greenhouse.temperature}°C`
                : "— °C";


        const hum =
            greenhouse.online &&
            greenhouse.humidity !== undefined
                ? `${greenhouse.humidity}%`
                : "— %";


        const ext =
            greenhouse.exterior !== null &&
            greenhouse.exterior !== undefined
                ? `${greenhouse.exterior}°C`
                : "— °C";


        // -----------------------------------------
        // ESTADO
        // -----------------------------------------

        const estadoClase =
            greenhouse.online
                ? "online"
                : "offline";


        const estadoTexto =
            greenhouse.online
                ? "Online"
                : "Offline";


        // -----------------------------------------
        // TARJETA
        // -----------------------------------------

        card.innerHTML = `

            <div class="greenhouse-top">

                <div class="greenhouse-icon">
                    🌱
                </div>


                <span
                    class="greenhouse-status ${estadoClase}"
                >

                    <span
                        class="greenhouse-status-dot"
                    ></span>

                    ${estadoTexto}

                </span>

            </div>


            <h2>
                ${greenhouse.name}
            </h2>


            <div class="greenhouse-location">
                📍 ${greenhouse.location}
            </div>


            <div class="greenhouse-code">

                Código:

                <strong>
                    ${greenhouse.id}
                </strong>

            </div>


            <div class="greenhouse-data">

                <div class="greenhouse-data-item">

                    <span>
                        Temperatura
                    </span>

                    <strong>
                        ${temp}
                    </strong>

                </div>


                <div class="greenhouse-data-item">

                    <span>
                        Humedad
                    </span>

                    <strong>
                        ${hum}
                    </strong>

                </div>


                <div class="greenhouse-data-item">

                    <span>
                        Exterior
                    </span>

                    <strong>
                        ${ext}
                    </strong>

                </div>

            </div>


            <div class="greenhouse-actions">

                <button
                    type="button"
                    class="primary-button greenhouse-open"
                    data-id="${greenhouse.id}"
                >
                    Abrir invernadero
                </button>


                <button
                    type="button"
                    class="delete-button greenhouse-delete"
                    data-id="${greenhouse.id}"
                >
                    🗑️ Eliminar
                </button>

            </div>

        `;


        container.appendChild(
            card
        );

    });


    // =====================================================
    // TARJETA AÑADIR
    // =====================================================

    const addCard =
        document.createElement(
            "article"
        );


    addCard.className =
        "greenhouse-card add-greenhouse-card";


    addCard.innerHTML = `

        <div class="add-greenhouse-icon">
            +
        </div>

        <strong>
            Añadir invernadero
        </strong>

        <span>
            Crear o unirse mediante código
        </span>

    `;


    addCard.addEventListener(
        "click",
        openModal
    );


    container.appendChild(
        addCard
    );


    // =====================================================
    // BOTONES ABRIR
    // =====================================================

    document
        .querySelectorAll(
            ".greenhouse-open"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const codigo =
                        button.dataset.id;


                    localStorage.setItem(
                        "selectedGreenhouse",
                        codigo
                    );


                    window.location.href =
                        "dashboard.html";

                }
            );

        });


    // =====================================================
    // BOTONES ELIMINAR
    // =====================================================

document
    .querySelectorAll(
        ".greenhouse-delete"
    )
    .forEach((button) => {

        button.addEventListener(
            "click",
            async () => {

                const codigo =
                    button.dataset.id;

                await eliminarInvernadero(
                    codigo
                );

            }
        );

    });
}

// =========================================================
// OBTENER VALOR DE SENSOR
// =========================================================

function obtenerValorSensor(sensor) {

    if (
        sensor === undefined ||
        sensor === null
    ) {

        return undefined;

    }


    // Nueva estructura:
    //
    // temperatura:
    //   valor: 24
    //   ultimaConexion: 123456789

    if (
        typeof sensor === "object" &&
        sensor.valor !== undefined
    ) {

        return sensor.valor;

    }


    // Compatibilidad con estructura antigua:
    //
    // temperatura: 24

    if (
        typeof sensor !== "object"
    ) {

        return sensor;

    }


    return undefined;

}


// =========================================================
// ELIMINAR INVERNADERO
// =========================================================
async function eliminarInvernadero(codigo) {

    const confirmar = confirm(
        `¿Seguro que quieres eliminar el invernadero ${codigo} de tu cuenta?`
    );

    if (!confirmar) {
        return;
    }

    try {

        // 1. Eliminar la relación en el usuario actual
        await set(
            ref(
                database,
                `users/${uidActual}/greenhouses/${codigo}`
            ),
            null
        );

        // 2. Eliminar al usuario de la lista de miembros del invernadero
        await set(
            ref(
                database,
                `greenhouses/${codigo}/miembros/${uidActual}`
            ),
            null
        );

        // 3. Eliminar el nodo principal del invernadero para limpiarlo por completo
        await set(
            ref(
                database,
                `greenhouses/${codigo}`
            ),
            null
        );

        // 4. Marcar el dispositivo ESP32 como "disponible" otra vez para que se pueda volver a registrar
        await set(
            ref(
                database,
                `devices/${codigo}/estado`
            ),
            "disponible"
        );

        mostrarMensaje(
            "🗑️",
            "Invernadero eliminado",
            "El invernadero se ha eliminado y el dispositivo queda libre para volver a registrarlo."
        );

        cargarInvernaderos();

    }
    catch (error) {

        console.error(
            "Error eliminando invernadero:",
            error
        );

        mostrarMensaje(
            "⚠️",
            "Error",
            "No se ha podido eliminar el invernadero."
        );

    }

}


// =========================================================
// COMPROBAR CÓDIGO DE DISPOSITIVO (ESP32)
// =========================================================
//
// El código lo genera el propio ESP32 y, en cuanto tiene
// conexión a internet, se anuncia en Firebase bajo
// `devices/{codigo}` con estado "disponible". La web NO debe
// aceptar un código inventado por el usuario: solo códigos
// que existan ahí y que todavía no estén vinculados a ningún
// invernadero.
//
// Estructura esperada (la escribe el firmware):
//   devices/{codigo} = { estado: "disponible", creadoEn: <timestamp> }
//
// Cuando se crea el invernadero, la web marca el dispositivo
// como "vinculado" para que ese código no se pueda reutilizar.

async function obtenerDispositivo(codigo) {

    const snap =
        await get(
            ref(
                database,
                `devices/${codigo}`
            )
        );

    if (!snap.exists()) {
        return null;
    }

    return snap.val();

}


async function vincularDispositivo(codigo) {

    await set(
        ref(
            database,
            `devices/${codigo}/estado`
        ),
        "vinculado"
    );

}


// =========================================================
// CREAR INVERNADERO
// =========================================================

document
    .getElementById("createGreenhouse")
    ?.addEventListener(
        "click",
        async () => {

            const nombre =
                prompt(
                    "Nombre del invernadero:"
                );


            if (!nombre) {
                return;
            }


            const ubicacion =
                prompt(
                    "Ubicación:"
                ) || "—";


            let codigo =
                prompt(
                    "Código de tu ESP32 (lo genera el propio dispositivo, formato GS-000000):"
                );


            if (!codigo) {
                return;
            }


            codigo =
                codigo
                    .trim()
                    .toUpperCase();


            if (!codigo) {

                mostrarMensaje(
                    "⚠️",
                    "Código no válido",
                    "Tienes que introducir el código que te ha dado tu ESP32."
                );

                return;

            }


            let dispositivo;

            try {

                dispositivo =
                    await obtenerDispositivo(codigo);

            }
            catch (error) {

                console.error(
                    "Error comprobando el dispositivo:",
                    error
                );

                mostrarMensaje(
                    "⚠️",
                    "Error",
                    "No se ha podido comprobar el código. Inténtalo de nuevo."
                );

                return;

            }


            if (!dispositivo) {

                mostrarMensaje(
                    "⚠️",
                    "Código no reconocido",
                    "Ese código no corresponde a ningún ESP32 registrado. Comprueba que tu dispositivo esté encendido, conectado a internet, y que hayas copiado bien el código."
                );

                return;

            }


            if (dispositivo.estado !== "disponible") {

                mostrarMensaje(
                    "⚠️",
                    "Dispositivo ya vinculado",
                    "Este ESP32 ya está vinculado a un invernadero. Si es el tuyo, utiliza \"Unirme a un invernadero\" en vez de crear uno nuevo."
                );

                return;

            }


            try {

                // Información

                await set(
                    ref(
                        database,
                        `greenhouses/${codigo}/info`
                    ),
                    {

                        nombre:
                            nombre,

                        ubicacion:
                            ubicacion,

                        propietario:
                            uidActual

                    }
                );


                // El creador entra como administrador

                await set(
                    ref(
                        database,
                        `greenhouses/${codigo}/miembros/${uidActual}`
                    ),
                    {
                        rol: "administrador",
                        email: auth.currentUser.email
                    }
                );


                // Asociación con el usuario (solo marca pertenencia;
                // el rol de verdad vive en greenhouses/.../miembros)

                await set(
                    ref(
                        database,
                        `users/${uidActual}/greenhouses/${codigo}`
                    ),
                    true
                );


                // Marcar el dispositivo como vinculado para
                // que este código ya no aparezca como disponible

                await vincularDispositivo(codigo);


                mostrarMensaje(
                    "✅",
                    "Invernadero creado",
                    `El invernadero se ha creado correctamente con el código ${codigo}.`
                );


                closeModalFunction();

                cargarInvernaderos();

            }
            catch (error) {

                console.error(
                    "Error creando invernadero:",
                    error
                );


                mostrarMensaje(
                    "⚠️",
                    "Error",
                    "No se ha podido crear el invernadero."
                );

            }

        }
    );


// =========================================================
// UNIRSE A INVERNADERO
// =========================================================

document
    .getElementById("joinGreenhouse")
    ?.addEventListener(
        "click",
        async () => {

            let codigo =
                prompt(
                    "Introduce el código del invernadero (formato GS-000000):"
                );


            if (!codigo) {
                return;
            }


            codigo =
                codigo
                    .trim()
                    .toUpperCase();


            try {

                // -----------------------------------------
                // COMPROBAR SI YA ESTÁ AÑADIDO
                // -----------------------------------------

                const usuarioSnap =
                    await get(
                        ref(
                            database,
                            `users/${uidActual}/greenhouses/${codigo}`
                        )
                    );


                if (
                    usuarioSnap.exists()
                ) {

                    mostrarMensaje(
                        "⚠️",
                        "Invernadero ya añadido",
                        "Este invernadero ya está asociado a tu cuenta."
                    );

                    return;

                }


                // -----------------------------------------
                // COMPROBAR SI EXISTE
                // -----------------------------------------

                const infoSnap =
                    await get(
                        ref(
                            database,
                            `greenhouses/${codigo}/info`
                        )
                    );


                if (
                    !infoSnap.exists()
                ) {

                    mostrarMensaje(
                        "❌",
                        "Invernadero no encontrado",
                        "No existe ningún invernadero con ese código."
                    );

                    return;

                }


                // -----------------------------------------
                // AÑADIR AL USUARIO
                // (rol por defecto: lector, solo puede ver.
                //  Un administrador puede subirle el rol
                //  luego desde Ajustes)
                // -----------------------------------------

                await set(
                    ref(
                        database,
                        `greenhouses/${codigo}/miembros/${uidActual}`
                    ),
                    {
                        rol: "lector",
                        email: auth.currentUser.email
                    }
                );

                await set(
                    ref(
                        database,
                        `users/${uidActual}/greenhouses/${codigo}`
                    ),
                    true
                );


                mostrarMensaje(
                    "✅",
                    "Invernadero añadido",
                    "El invernadero se ha añadido correctamente a tu cuenta."
                );


                closeModalFunction();

                cargarInvernaderos();

            }
            catch (error) {

                console.error(
                    "Error uniéndose al invernadero:",
                    error
                );


                mostrarMensaje(
                    "⚠️",
                    "Error",
                    "No se ha podido añadir el invernadero."
                );

            }

        }
    );


// =========================================================
// MODAL AÑADIR
// =========================================================

function openModal() {

    if (modal) {

        modal.classList.add(
            "active"
        );

    }

}


function closeModalFunction() {

    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


addButton?.addEventListener(
    "click",
    openModal
);


closeModal?.addEventListener(
    "click",
    closeModalFunction
);


// =========================================================
// MODAL MENSAJES
// =========================================================

const messageModal =
    document.getElementById(
        "messageModal"
    );

const closeMessageModal =
    document.getElementById(
        "closeMessageModal"
    );

const messageModalIcon =
    document.getElementById(
        "messageModalIcon"
    );

const messageModalTitle =
    document.getElementById(
        "messageModalTitle"
    );

const messageModalText =
    document.getElementById(
        "messageModalText"
    );

const messageModalButton =
    document.getElementById(
        "messageModalButton"
    );


function mostrarMensaje(
    icono,
    titulo,
    texto
) {

    if (!messageModal) {
        return;
    }


    if (messageModalIcon) {

        messageModalIcon.textContent =
            icono;

    }


    if (messageModalTitle) {

        messageModalTitle.textContent =
            titulo;

    }


    if (messageModalText) {

        messageModalText.textContent =
            texto;

    }


    messageModal.classList.add(
        "active"
    );

}


function cerrarMensaje() {

    if (messageModal) {

        messageModal.classList.remove(
            "active"
        );

    }

}


closeMessageModal?.addEventListener(
    "click",
    cerrarMensaje
);


messageModalButton?.addEventListener(
    "click",
    cerrarMensaje
);


// =========================================================
// CONVERTIR TIMESTAMP
// =========================================================

function convertirTimestamp(
    timestamp
) {

    if (
        timestamp === undefined ||
        timestamp === null
    ) {

        return null;

    }


    if (
        typeof timestamp === "number"
    ) {

        return timestamp;

    }


    if (
        typeof timestamp === "string"
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
// ACTUALIZAR ESTADOS AUTOMÁTICAMENTE
// =========================================================

setInterval(
    () => {

        if (
            listaInvernaderos.length === 0
        ) {
            return;
        }


        let necesitaActualizar =
            false;


        listaInvernaderos.forEach(
            (greenhouse) => {

                if (
                    !greenhouse.ultimaConexion
                ) {

                    if (
                        greenhouse.online
                    ) {

                        greenhouse.online =
                            false;

                        necesitaActualizar =
                            true;

                    }

                    return;
                }


                const online =
                    Date.now() -
                        greenhouse.ultimaConexion <=
                    TIEMPO_MAXIMO_SIN_DATOS;


                if (
                    online !==
                    greenhouse.online
                ) {

                    greenhouse.online =
                        online;

                    necesitaActualizar =
                        true;

                }

            }
        );


        if (necesitaActualizar) {

            renderGreenhouses(
                listaInvernaderos
            );

        }

    },
    10000
);


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


        if (themeButton) {

            themeButton.textContent =
                dark
                    ? "☀️"
                    : "🌙";

        }

    }
);


cargarTema();
