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
// COMPROBAR SESIÓN
// =========================================================

let uidActual = null;

onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    uidActual = user.uid;

    if (userAvatar) {
        userAvatar.textContent = (user.email || "U")[0].toUpperCase();
    }

    cargarInvernaderos();

});


// =========================================================
// CARGAR INVERNADEROS DEL USUARIO
// =========================================================

async function cargarInvernaderos() {

    container.innerHTML = "<p>Cargando…</p>";

    const listaSnap = await get(
        ref(database, `users/${uidActual}/greenhouses`)
    );

    const codigos = listaSnap.exists()
        ? Object.keys(listaSnap.val())
        : [];

    const invernaderos = [];

    for (const codigo of codigos) {

        const infoSnap = await get(ref(database, `greenhouses/${codigo}/info`));
        const sensoresSnap = await get(ref(database, `greenhouses/${codigo}/sensores`));

        const info = infoSnap.exists() ? infoSnap.val() : { nombre: codigo, ubicacion: "—" };
        const sensores = sensoresSnap.exists() ? sensoresSnap.val() : {};

        invernaderos.push({
            id: codigo,
            name: info.nombre,
            location: info.ubicacion,
            temperature: sensores.temperatura,
            humidity: sensores.humedad
        });

    }

    renderGreenhouses(invernaderos);

}


// =========================================================
// MOSTRAR INVERNADEROS
// =========================================================

function renderGreenhouses(greenhouses) {

    container.innerHTML = "";

    if (greenhouses.length === 0) {
        const vacio = document.createElement("p");
        vacio.textContent = "Aún no tienes ningún invernadero. Crea uno o únete con un código.";
        container.appendChild(vacio);
    }

    greenhouses.forEach((greenhouse) => {

        const card = document.createElement("article");
        card.className = "greenhouse-card";

        const temp = greenhouse.temperature !== undefined
            ? `${greenhouse.temperature}°C` : "— °C";
        const hum = greenhouse.humidity !== undefined
            ? `${greenhouse.humidity}%` : "— %";

        card.innerHTML = `
            <div class="greenhouse-top">
                <div class="greenhouse-icon">🌱</div>
                <span class="greenhouse-status">Online</span>
            </div>
            <h2>${greenhouse.name}</h2>
            <div class="greenhouse-location">📍 ${greenhouse.location}</div>
            <div class="greenhouse-code">Código: <strong>${greenhouse.id}</strong></div>
            <div class="greenhouse-data">
                <div class="greenhouse-data-item">
                    <span>Temperatura</span>
                    <strong>${temp}</strong>
                </div>
                <div class="greenhouse-data-item">
                    <span>Humedad</span>
                    <strong>${hum}</strong>
                </div>
            </div>
            <button class="primary-button greenhouse-open" data-id="${greenhouse.id}">
                Abrir invernadero
            </button>
        `;

        container.appendChild(card);

    });

    const addCard = document.createElement("article");
    addCard.className = "greenhouse-card add-greenhouse-card";
    addCard.innerHTML = `
        <div class="add-greenhouse-icon">+</div>
        <strong>Añadir invernadero</strong>
        <span>Crear o unirse mediante código</span>
    `;
    addCard.addEventListener("click", openModal);
    container.appendChild(addCard);

    document.querySelectorAll(".greenhouse-open").forEach((button) => {
        button.addEventListener("click", () => {
            localStorage.setItem("selectedGreenhouse", button.dataset.id);
            window.location.href = "dashboard.html";
        });
    });

}


// =========================================================
// MODAL
// =========================================================

function openModal() { modal.classList.add("active"); }
function closeModalFunction() { modal.classList.remove("active"); }

addButton?.addEventListener("click", openModal);
closeModal?.addEventListener("click", closeModalFunction);


// =========================================================
// CREAR INVERNADERO
// =========================================================

document.getElementById("createGreenhouse")?.addEventListener("click", async () => {

    const nombre = prompt("Nombre del invernadero:");
    if (!nombre) return;

    const ubicacion = prompt("Ubicación:") || "—";

    const codigo = "GS-" + Math.floor(100000 + Math.random() * 900000);

    await set(ref(database, `greenhouses/${codigo}/info`), {
        nombre,
        ubicacion,
        propietario: uidActual
    });

    await set(ref(database, `users/${uidActual}/greenhouses/${codigo}`), true);

    alert(`Invernadero creado. Su código es ${codigo}. Apunta este código, lo necesitarás para configurar el ESP32.`);

    closeModalFunction();
    cargarInvernaderos();

});


// =========================================================
// UNIRSE A UN INVERNADERO
// =========================================================

document.getElementById("joinGreenhouse")?.addEventListener("click", async () => {

    const codigo = prompt("Introduce el código del invernadero (formato GS-000000):");
    if (!codigo) return;

    const infoSnap = await get(ref(database, `greenhouses/${codigo}/info`));

    if (!infoSnap.exists()) {
        alert("No existe ningún invernadero con ese código.");
        return;
    }

    await set(ref(database, `users/${uidActual}/greenhouses/${codigo}`), true);

    closeModalFunction();
    cargarInvernaderos();

});


// =========================================================
// TEMA
// =========================================================

function cargarTema() {
    const tema = localStorage.getItem("growsync-theme");
    if (tema === "dark") {
        document.body.classList.add("dark");
        themeButton.textContent = "☀️";
    }
}

themeButton?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    localStorage.setItem("growsync-theme", dark ? "dark" : "light");
    themeButton.textContent = dark ? "☀️" : "🌙";
});

cargarTema();
