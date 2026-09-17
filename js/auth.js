// =========================================================
// GROWSYNC - AUTENTICACIÓN
// =========================================================

import {
    auth
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// =========================================================
// ELEMENTOS
// =========================================================

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");

const passwordToggle =
    document.getElementById("passwordToggle");

const passwordInput =
    document.getElementById("password");

const themeButton =
    document.getElementById("themeButton");


// =========================================================
// LOGIN
// =========================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();

            const password =
                passwordInput.value;


            if (!username || !password) {

                mostrarMensaje(
                    "Introduce usuario y contraseña."
                );

                return;
            }


            /*
             * IMPORTANTE:
             *
             * Aquí conectaremos posteriormente
             * el usuario con Firebase.
             *
             * No guardaremos la contraseña
             * en localStorage.
             */


            mostrarMensaje(
                "Sistema de autenticación pendiente de conectar.",
                false
            );

        }
    );

}


// =========================================================
// MOSTRAR / OCULTAR CONTRASEÑA
// =========================================================

if (passwordToggle) {

    passwordToggle.addEventListener(
        "click",
        () => {

            if (
                passwordInput.type === "password"
            ) {

                passwordInput.type = "text";

                passwordToggle.textContent = "🙈";

            } else {

                passwordInput.type = "password";

                passwordToggle.textContent = "👁";

            }

        }
    );

}


// =========================================================
// MENSAJES
// =========================================================

function mostrarMensaje(
    mensaje,
    error = true
) {

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent =
        mensaje;

    loginMessage.style.color =
        error
            ? "var(--danger)"
            : "var(--primary)";

}


// =========================================================
// TEMA
// =========================================================

function cargarTema() {

    const tema =
        localStorage.getItem(
            "growsync-theme"
        );

    if (tema === "dark") {

        document.body.classList.add("dark");

        if (themeButton) {
            themeButton.textContent = "☀️";
        }

    }

}


if (themeButton) {

    themeButton.addEventListener(
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

}


cargarTema();
