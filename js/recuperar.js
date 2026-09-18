// =========================================================
// GROWSYNC - RECUPERAR CONTRASEÑA
// =========================================================

import {
    auth
} from "./firebase.js";

import {
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// =========================================================
// ELEMENTOS
// =========================================================

const recoverForm =
    document.getElementById("recoverForm");

const emailInput =
    document.getElementById("email");

const recoverMessage =
    document.getElementById("recoverMessage");

const themeButton =
    document.getElementById("themeButton");

const backToLogin =
    document.getElementById("backToLogin");


// =========================================================
// RECUPERAR CONTRASEÑA
// =========================================================

if (recoverForm) {

    recoverForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                emailInput.value.trim();


            if (!email) {

                mostrarMensaje(
                    "Introduce tu correo electrónico."
                );

                return;
            }


            try {

                await sendPasswordResetEmail(
                    auth,
                    email
                );


                mostrarMensaje(
                    "Te hemos enviado un correo para restablecer tu contraseña.",
                    false
                );


                emailInput.value = "";


            } catch (error) {

                console.error(error);

                mostrarMensaje(
                    traducirError(error.code)
                );

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

    if (!recoverMessage) return;

    recoverMessage.textContent = mensaje;

    recoverMessage.style.color =
        error
            ? "var(--danger)"
            : "var(--primary)";

}


// =========================================================
// ERRORES
// =========================================================

function traducirError(codigo) {

    const mapa = {

        "auth/invalid-email":
            "Ese correo no es válido.",

        "auth/user-not-found":
            "No existe ninguna cuenta con ese correo.",

        "auth/too-many-requests":
            "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."

    };


    return mapa[codigo]
        || "Ha ocurrido un error. Inténtalo de nuevo.";

}

// =========================================================
// VOLVER AL LOGIN
// =========================================================

backToLogin?.addEventListener("click", () => {

    window.location.href = "index.html";

});


// =========================================================
// TEMA
// =========================================================

function cargarTema() {

    const tema =
        localStorage.getItem("growsync-theme");


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

            document.body.classList.toggle("dark");

            const dark =
                document.body.classList.contains("dark");


            localStorage.setItem(
                "growsync-theme",
                dark ? "dark" : "light"
            );


            themeButton.textContent =
                dark ? "☀️" : "🌙";

        }
    );

}


cargarTema();
