// =========================================================
// GROWSYNC - REGISTRO
// =========================================================

import {
    auth
} from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


const registroForm = document.getElementById("registroForm");
const registroMessage = document.getElementById("registroMessage");
const passwordToggle = document.getElementById("passwordToggle");
const passwordInput = document.getElementById("password");
const themeButton = document.getElementById("themeButton");


registroForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value;

    if (!email || !password || !password2) {
        mostrarMensaje("Rellena todos los campos.");
        return;
    }

    if (password !== password2) {
        mostrarMensaje("Las contraseñas no coinciden.");
        return;
    }

    try {

        await createUserWithEmailAndPassword(auth, email, password);

        // createUserWithEmailAndPassword ya inicia sesión automáticamente
        window.location.href = "invernaderos.html";

    } catch (error) {
        mostrarMensaje(traducirError(error.code));
    }

});


passwordToggle?.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        passwordToggle.textContent = "🙈";
    } else {
        passwordInput.type = "password";
        passwordToggle.textContent = "👁";
    }
});


function mostrarMensaje(mensaje) {
    registroMessage.textContent = mensaje;
    registroMessage.style.color = "var(--danger)";
}

function traducirError(codigo) {
    const mapa = {
        "auth/invalid-email": "Ese correo no es válido.",
        "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
        "auth/weak-password": "La contraseña debe tener al menos 6 caracteres."
    };
    return mapa[codigo] || "Ha ocurrido un error. Inténtalo de nuevo.";
}


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
