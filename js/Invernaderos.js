// =========================================================
// GROWSYNC - INVERNADEROS
// =========================================================

import {
    auth
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// =========================================================
// ELEMENTOS
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
// COMPROBAR SESIÓN
// =========================================================

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            /*
             * Cuando Firebase esté conectado,
             * si no hay sesión volveremos al login.
             */

            // window.location.href = "login.html";

            return;
        }


        console.log(
            "Usuario conectado:",
            user.uid
        );

    }
);


// =========================================================
// DATOS TEMPORALES
// =========================================================

const greenhouses = [

    {
        id: "GS-001245",

        name:
            "Invernadero Terraza",

        location:
            "Zaragoza",

        temperature:
            24.6,

        humidity:
            62

    },

    {
        id: "GS-008721",

        name:
            "Invernadero Huerto",

        location:
            "Zaragoza",

        temperature:
            22.8,

        humidity:
            68

    }

];


// =========================================================
// MOSTRAR INVERNADEROS
// =========================================================

function renderGreenhouses() {

    container.innerHTML = "";


    greenhouses.forEach(
        (greenhouse) => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "greenhouse-card";


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
                            ${greenhouse.temperature}°C
                        </strong>

                    </div>


                    <div class="greenhouse-data-item">

                        <span>
                            Humedad
                        </span>

                        <strong>
                            ${greenhouse.humidity}%
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

        }
    );


    /*
     * TARJETA AÑADIR
     */

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


    /*
     * BOTONES ABRIR
     */

    document
        .querySelectorAll(
            ".greenhouse-open"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;


                        localStorage.setItem(
                            "selectedGreenhouse",
                            id
                        );


                        window.location.href =
                            "dashboard.html";

                    }
                );

            }
        );

}


renderGreenhouses();


// =========================================================
// MODAL
// =========================================================

function openModal() {

    modal.classList.add(
        "active"
    );

}


function closeModalFunction() {

    modal.classList.remove(
        "active"
    );

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
// CREAR
// =========================================================

document
    .getElementById(
        "createGreenhouse"
    )
    ?.addEventListener(
        "click",
        () => {

            alert(
                "Aquí crearemos un nuevo invernadero."
            );

        }
    );


// =========================================================
// UNIRSE
// =========================================================

document
    .getElementById(
        "joinGreenhouse"
    )
    ?.addEventListener(
        "click",
        () => {

            const code =
                prompt(
                    "Introduce el código del invernadero:"
                );


            if (!code) {
                return;
            }


            alert(
                `Código introducido: ${code}`
            );

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
