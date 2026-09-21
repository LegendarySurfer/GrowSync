// =========================================================
// GROWSYNC - AUTENTICACIÓN
// =========================================================

import {
    auth
} from "./firebase.js";

import {
    signInWithEmailAndPassword
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

const createAccountButton =
    document.getElementById("createAccount");

const forgotPassword =
    document.getElementById("forgotPassword");


// =========================================================
// LOGIN
// =========================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            // El campo se sigue llamando "username" en el HTML,
            // pero Firebase Authentication necesita un correo real.
            const email =
                document
                    .getElementById("username")
                    .value
                    .trim();

            const password =
                passwordInput.value;


            if (!email || !password) {
                mostrarMensaje("Introduce correo y contraseña.");
                return;
            }

            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                window.location.href = "invernaderos.html";

            } catch (error) {

                mostrarMensaje(
                    traducirError(error.code)
                );

            }

        }
    );

}


// =========================================================
// CREAR CUENTA
// =========================================================

createAccountButton?.addEventListener("click", () => {
    window.location.href = "registro.html";
});

// =========================================================
// RECUPERAR CONTRASEÑA
// =========================================================

forgotPassword?.addEventListener("click", () => {
    window.location.href = "recuperar.html";
});

// =========================================================
// MOSTRAR / OCULTAR CONTRASEÑA
// =========================================================

if (passwordToggle) {

    passwordToggle.addEventListener(
        "click",
        () => {

            if (passwordInput.type === "password") {
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

function mostrarMensaje(mensaje, error = true) {

    if (!loginMessage) return;

    loginMessage.textContent = mensaje;
    loginMessage.style.color = error ? "var(--danger)" : "var(--primary)";

}


function traducirError(codigo) {

    const mapa = {
        "auth/invalid-email": "Ese correo no es válido.",
        "auth/user-not-found": "No existe ninguna cuenta con ese correo.",
        "auth/wrong-password": "Contraseña incorrecta.",
        "auth/invalid-credential": "Correo o contraseña incorrectos.",
        "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
        "auth/weak-password": "La contraseña debe tener al menos 6 caracteres."
    };

    return mapa[codigo] || "Ha ocurrido un error. Inténtalo de nuevo.";

}


// =========================================================
// TEMA
// =========================================================

function cargarTema() {

    const tema = localStorage.getItem("growsync-theme");

    if (tema === "dark") {
        document.body.classList.add("dark");
        if (themeButton) themeButton.textContent = "☀️";
    }

}

if (themeButton) {

    themeButton.addEventListener(
        "click",
        () => {

            document.body.classList.toggle("dark");

            const dark = document.body.classList.contains("dark");

            localStorage.setItem("growsync-theme", dark ? "dark" : "light");

            themeButton.textContent = dark ? "☀️" : "🌙";

        }
    );

}

cargarTema();
