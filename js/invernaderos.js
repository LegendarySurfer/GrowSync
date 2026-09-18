// =========================================================
// GROWSYNC - INVERNADEROS
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
    get,
    set
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


// =========================================================
// ELEMENTOS
// =========================================================

const container = document.getElementById("greenhousesContainer");

const modal = document.getElementById("greenhouseModal");

const addButton = document.getElementById("addGreenhouseButton");

const closeModal = document.getElementById("closeModal");

const themeButton = document.getElementById("themeButton");

const userAvatar = document.getElementById("userAvatar");


// =========================================================
// ELEMENTOS MODAL MENSAJES
// =========================================================

const messageModal = document.getElementById("messageModal");

const closeMessageModal =
    document.getElementById("closeMessageModal");

const messageModalButton =
    document.getElementById("messageModalButton");

const messageModalIcon =
    document.getElementById("messageModalIcon");

const messageModalTitle =
    document.getElementById("messageModalTitle");

const messageModalText =
    document.getElementById("messageModalText");


// =========================================================
// USUARIO ACTUAL
// =========================================================

let uidActual = null;


// =========================================================
// COMPROBAR SESIÓN
// =========================================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "index.html";

        return;

    }


    uidActual = user.uid;


    if (userAvatar) {

        userAvatar.textContent =
            (user.email || "U")[0].toUpperCase();

    }


    cargarInvernaderos();

});


// =========================================================
// CARGAR INVERNADEROS DEL USUARIO
// =========================================================

async function cargarInvernaderos() {

    if (!uidActual) {
        return;
    }


    container.innerHTML = "<p>Cargando…</p>";


    try {

        const listaSnap = await get(
            ref(
                database,
                `users/${uidActual}/greenhouses`
            )
        );


        const codigos = listaSnap.exists()
            ? Object.keys(listaSnap.val())
            : [];


        const invernaderos = [];


        for (const codigo of codigos) {

            const infoSnap = await get(
                ref(
                    database,
                    `greenhouses/${codigo}/info`
                )
            );


            const sensoresSnap = await get(
                ref(
                    database,
                    `greenhouses/${codigo}/sensores`
                )
            );


            const info = infoSnap.exists()
                ? infoSnap.val()
                : {
                    nombre: codigo,
                    ubicacion: "—"
                };


            const sensores = sensoresSnap.exists()
                ? sensoresSnap.val()
                : {};


            invernaderos.push({

                id: codigo,

                name: info.nombre,

                location: info.ubicacion,

                temperature: sensores.temperatura,

                humidity: sensores.humedad

            });

        }


        renderGreenhouses(invernaderos);


    } catch (error) {

        console.error(
            "Error al cargar los invernaderos:",
            error
        );


        container.innerHTML =
            "<p>No se han podido cargar los invernaderos.</p>";

    }

}


// =========================================================
// MOSTRAR INVERNADEROS
// =========================================================

function renderGreenhouses(greenhouses) {

    container.innerHTML = "";


    if (greenhouses.length === 0) {

        const vacio =
            document.createElement("p");


        vacio.textContent =
            "Aún no tienes ningún invernadero. Crea uno o únete con un código.";


        container.appendChild(vacio);

    }


    greenhouses.forEach((greenhouse) => {

        const card =
            document.createElement("article");


        card.className =
            "greenhouse-card";


        const temp =
            greenhouse.temperature !== undefined
                ? `${greenhouse.temperature}°C`
                : "— °C";


        const hum =
            greenhouse.humidity !== undefined
                ? `${greenhouse.humidity}%`
                : "— %";


        card.innerHTML = `

            <div class="greenhouse-top">

                <div class="greenhouse-icon">
                    🌱
                </div>

                <span class="greenhouse-status">
                    Online
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

            </div>


            <button
                class="primary-button greenhouse-open"
                data-id="${greenhouse.id}"
            >
                Abrir invernadero
            </button>

        `;


        container.appendChild(card);

    });


    // =====================================================
    // TARJETA AÑADIR
    // =====================================================

    const addCard =
        document.createElement("article");


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


    container.appendChild(addCard);


    // =====================================================
    // BOTONES ABRIR INVERNADERO
    // =====================================================

    document
        .querySelectorAll(".greenhouse-open")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    localStorage.setItem(
                        "selectedGreenhouse",
                        button.dataset.id
                    );


                    window.location.href =
                        "dashboard.html";

                }
            );

        });

}


// =========================================================
// MODAL AÑADIR
// =========================================================

function openModal() {

    modal?.classList.add("active");

}


function closeModalFunction() {

    modal?.classList.remove("active");

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
// MODAL DE MENSAJES
// =========================================================

function mostrarMensaje(
    titulo,
    mensaje,
    icono = "⚠️"
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
            mensaje;

    }


    messageModal.classList.add("active");

}


function cerrarMensaje() {

    messageModal?.classList.remove("active");

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


            const codigo =
                "GS-" +
                Math.floor(
                    100000 +
                    Math.random() * 900000
                );


            try {

                await set(
                    ref(
                        database,
                        `greenhouses/${codigo}/info`
                    ),
                    {
                        nombre,
                        ubicacion,
                        propietario: uidActual
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
                    "Invernadero creado",
                    `El invernadero se ha creado correctamente. Su código es ${codigo}.`,
                    "✅"
                );


                closeModalFunction();


                cargarInvernaderos();


            } catch (error) {

                console.error(
                    "Error al crear el invernadero:",
                    error
                );


                mostrarMensaje(
                    "No se ha podido crear",
                    "Ha ocurrido un error al crear el invernadero. Inténtalo de nuevo.",
                    "❌"
                );

            }

        }
    );


// =========================================================
// UNIRSE A UN INVERNADERO
// =========================================================

document
    .getElementById("joinGreenhouse")
    ?.addEventListener(
        "click",
        async () => {

            const codigoIntroducido =
                prompt(
                    "Introduce el código del invernadero (formato GS-000000):"
                );


            if (!codigoIntroducido) {
                return;
            }


            // =================================================
            // NORMALIZAR CÓDIGO
            // =================================================

            const codigo =
                codigoIntroducido
                    .trim()
                    .toUpperCase();


            // =================================================
            // COMPROBAR SI YA ESTÁ AÑADIDO
            // =================================================

            const usuarioGreenhouseRef =
                ref(
                    database,
                    `users/${uidActual}/greenhouses/${codigo}`
                );


            const usuarioGreenhouseSnap =
                await get(
                    usuarioGreenhouseRef
                );


            if (usuarioGreenhouseSnap.exists()) {

                mostrarMensaje(
                    "Invernadero ya añadido",
                    "Este invernadero ya está asociado a tu cuenta y no se puede añadir de nuevo.",
                    "⚠️"
                );


                return;

            }


            // =================================================
            // COMPROBAR SI EXISTE EL INVERNADERO
            // =================================================

            const infoSnap =
                await get(
                    ref(
                        database,
                        `greenhouses/${codigo}/info`
                    )
                );


            if (!infoSnap.exists()) {

                mostrarMensaje(
                    "Invernadero no encontrado",
                    "No existe ningún invernadero con ese código. Comprueba que el código sea correcto.",
                    "🔎"
                );


                return;

            }


            // =================================================
            // AÑADIR AL USUARIO
            // =================================================

            try {

                await set(
                    usuarioGreenhouseRef,
                    true
                );


                mostrarMensaje(
                    "Invernadero añadido",
                    "El invernadero se ha añadido correctamente a tu cuenta.",
                    "✅"
                );


                closeModalFunction();


                cargarInvernaderos();


            } catch (error) {

                console.error(
                    "Error al unirse al invernadero:",
                    error
                );


                mostrarMensaje(
                    "No se ha podido añadir",
                    "Ha ocurrido un error al añadir el invernadero. Inténtalo de nuevo.",
                    "❌"
                );

            }

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


    if (
        tema === "dark" &&
        themeButton
    ) {

        document.body.classList.add("dark");

        themeButton.textContent =
            "☀️";

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


cargarTema();
