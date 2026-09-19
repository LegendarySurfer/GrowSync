// =========================================================
// GROWSYNC - CONFIGURACIÓN (Ajustes de cuenta)
// =========================================================

import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updateEmail,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// =========================================================
// ELEMENTOS
// =========================================================

const currentEmailEl = document.getElementById("currentEmail");
const userAvatar = document.getElementById("userAvatar");
const themeButton = document.getElementById("themeButton");

const changeEmailForm = document.getElementById("changeEmailForm");
const emailMessage = document.getElementById("emailMessage");

const deleteAccountForm = document.getElementById("deleteAccountForm");
const deleteMessage = document.getElementById("deleteMessage");


// =========================================================
// SESIÓN
// =========================================================

onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    if (currentEmailEl) currentEmailEl.textContent = user.email || "—";

    if (userAvatar) {
        userAvatar.textContent = (user.email || "U").charAt(0).toUpperCase();
    }

});


// =========================================================
// REAUTENTICAR
// (Firebase exige haber iniciado sesión "recientemente"
//  para cambiar el correo o borrar la cuenta)
// =========================================================

async function reautenticar(password) {

    const user = auth.currentUser;

    const credencial = EmailAuthProvider.credential(user.email, password);

    await reauthenticateWithCredential(user, credencial);

}


// =========================================================
// CAMBIAR CORREO
// =========================================================

changeEmailForm?.addEventListener("submit", async (event) => {

    event.preventDefault();

    const passwordActual = document.getElementById("currentPasswordEmail").value;
    const nuevoCorreo = document.getElementById("newEmail").value.trim();

    if (!passwordActual || !nuevoCorreo) {
        mostrarMensaje(emailMessage, "Rellena los dos campos.");
        return;
    }

    try {

        await reautenticar(passwordActual);
        await updateEmail(auth.currentUser, nuevoCorreo);

        mostrarMensaje(
            emailMessage,
            "Correo actualizado correctamente.",
            false
        );

        currentEmailEl.textContent = nuevoCorreo;
        changeEmailForm.reset();

    } catch (error) {
        mostrarMensaje(emailMessage, traducirError(error.code));
    }

});


// =========================================================
// ELIMINAR CUENTA
// =========================================================

deleteAccountForm?.addEventListener("submit", async (event) => {

    event.preventDefault();

    const passwordActual = document.getElementById("currentPasswordDelete").value;

    if (!passwordActual) {
        mostrarMensaje(deleteMessage, "Introduce tu contraseña.");
        return;
    }

    const confirmar = confirm(
        "Esto eliminará tu cuenta de forma permanente. ¿Seguro que quieres continuar?"
    );

    if (!confirmar) return;

    try {

        await reautenticar(passwordActual);
        await deleteUser(auth.currentUser);

        window.location.href = "index.html";

    } catch (error) {
        mostrarMensaje(deleteMessage, traducirError(error.code));
    }

});


// =========================================================
// MENSAJES / ERRORES
// =========================================================

function mostrarMensaje(elemento, texto, esError = true) {
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.style.color = esError ? "var(--danger)" : "var(--primary)";
}

function traducirError(codigo) {
    const mapa = {
        "auth/wrong-password": "Contraseña incorrecta.",
        "auth/invalid-credential": "Contraseña incorrecta.",
        "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
        "auth/invalid-email": "Ese correo no es válido.",
        "auth/requires-recent-login": "Por seguridad, vuelve a iniciar sesión e inténtalo de nuevo."
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

themeButton?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    localStorage.setItem("growsync-theme", dark ? "dark" : "light");
    themeButton.textContent = dark ? "☀️" : "🌙";
});

cargarTema();
