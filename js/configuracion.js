// =========================================================
// GROWSYNC - CONFIGURACIÓN (Ajustes de cuenta + roles)
// =========================================================

import { auth, database } from "./firebase.js";

import {
    onAuthStateChanged,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updateEmail,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    ref,
    get,
    set
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


// =========================================================
// ELEMENTOS
// =========================================================

const currentEmailEl = document.getElementById("currentEmail");
const userAvatar = document.getElementById("userAvatar");
const themeButton = document.getElementById("themeButton");
const membersContainer = document.getElementById("greenhousesMembersContainer");

const changeEmailForm = document.getElementById("changeEmailForm");
const emailMessage = document.getElementById("emailMessage");

const deleteAccountForm = document.getElementById("deleteAccountForm");
const deleteMessage = document.getElementById("deleteMessage");


const ROLES = ["administrador", "gestor", "lector"];


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

    cargarInvernaderosYMiembros();

});


// =========================================================
// CARGAR INVERNADEROS + MIEMBROS
// =========================================================

async function cargarInvernaderosYMiembros() {

    if (!membersContainer) return;

    const uid = auth.currentUser.uid;
    const miEmail = auth.currentUser.email;

    membersContainer.innerHTML = "<p>Cargando...</p>";

    try {

        const listaSnap = await get(ref(database, `users/${uid}/greenhouses`));

        if (!listaSnap.exists()) {
            membersContainer.innerHTML = "<p>Todavía no perteneces a ningún invernadero.</p>";
            return;
        }

        const codigos = Object.keys(listaSnap.val());

        membersContainer.innerHTML = "";

        for (const codigo of codigos) {
            await renderGreenhouseCard(codigo, uid, miEmail);
        }

    } catch (error) {

        console.error("Error cargando invernaderos y miembros:", error);

        membersContainer.innerHTML =
            "<p>No se han podido cargar tus invernaderos.</p>";

    }

}


async function renderGreenhouseCard(codigo, uid, miEmail) {

    const infoSnap = await get(ref(database, `greenhouses/${codigo}/info`));
    const info = infoSnap.exists() ? infoSnap.val() : { nombre: codigo };

    let miembrosSnap = await get(ref(database, `greenhouses/${codigo}/miembros`));

    // -----------------------------------------------------
    // MIGRACIÓN: invernaderos creados antes de que existiera
    // el sistema de roles no tienen "miembros". Si eres el
    // propietario original, te asignamos administrador.
    // -----------------------------------------------------

    if (!miembrosSnap.exists() && info.propietario === uid) {

        await set(
            ref(database, `greenhouses/${codigo}/miembros/${uid}`),
            { rol: "administrador", email: miEmail }
        );

        miembrosSnap = await get(ref(database, `greenhouses/${codigo}/miembros`));

    }

    const miembros = miembrosSnap.exists() ? miembrosSnap.val() : {};
    const miRol = miembros[uid]?.rol || "lector";
    const esAdmin = miRol === "administrador";

    const filas = Object.entries(miembros).map(([memberUid, datos]) => {

        const rolActual = datos.rol || "lector";
        const soyYo = memberUid === uid;

        const opciones = ROLES.map((r) =>
            `<option value="${r}" ${r === rolActual ? "selected" : ""}>${capitalizar(r)}</option>`
        ).join("");

        return `
            <tr>
                <td>${datos.email || memberUid}${soyYo ? " (tú)" : ""}</td>
                <td>
                    <select class="role-select" data-codigo="${codigo}" data-uid="${memberUid}" ${esAdmin ? "" : "disabled"}>
                        ${opciones}
                    </select>
                </td>
                <td>
                    ${esAdmin
                        ? `<button type="button" class="delete-button remove-member" data-codigo="${codigo}" data-uid="${memberUid}">Quitar</button>`
                        : ""}
                </td>
            </tr>
        `;

    }).join("");

    const card = document.createElement("article");
    card.className = "settings-card";

    card.innerHTML = `
        <h2>${info.nombre || codigo}</h2>
        <p>Código: <strong>${codigo}</strong> · Tu rol: <strong>${capitalizar(miRol)}</strong></p>
        <div style="overflow-x:auto;">
            <table class="members-table">
                <thead>
                    <tr><th>Miembro</th><th>Rol</th><th></th></tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
    `;

    membersContainer.appendChild(card);

}


function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}


// =========================================================
// CAMBIAR ROL DE UN MIEMBRO (solo administradores)
// =========================================================

membersContainer?.addEventListener("change", async (event) => {

    if (!event.target.classList.contains("role-select")) return;

    const select = event.target;
    const codigo = select.dataset.codigo;
    const uidMiembro = select.dataset.uid;
    const nuevoRol = select.value;

    try {

        const miembrosSnap = await get(ref(database, `greenhouses/${codigo}/miembros`));
        const miembros = miembrosSnap.exists() ? miembrosSnap.val() : {};

        const rolAnterior = miembros[uidMiembro]?.rol;
        const numAdmins = Object.values(miembros).filter((m) => m.rol === "administrador").length;

        if (rolAnterior === "administrador" && nuevoRol !== "administrador" && numAdmins <= 1) {
            alert("No puedes quitarle el rol de administrador a la única persona que lo tiene.");
            select.value = "administrador";
            return;
        }

        await set(
            ref(database, `greenhouses/${codigo}/miembros/${uidMiembro}/rol`),
            nuevoRol
        );

    } catch (error) {

        console.error("Error cambiando rol:", error);
        alert("No se ha podido cambiar el rol.");
        cargarInvernaderosYMiembros();

    }

});


// =========================================================
// QUITAR MIEMBRO (solo administradores)
// =========================================================

membersContainer?.addEventListener("click", async (event) => {

    if (!event.target.classList.contains("remove-member")) return;

    const codigo = event.target.dataset.codigo;
    const uidMiembro = event.target.dataset.uid;

    try {

        const miembrosSnap = await get(ref(database, `greenhouses/${codigo}/miembros`));
        const miembros = miembrosSnap.exists() ? miembrosSnap.val() : {};

        const rolDeEsaPersona = miembros[uidMiembro]?.rol;
        const numAdmins = Object.values(miembros).filter((m) => m.rol === "administrador").length;

        if (rolDeEsaPersona === "administrador" && numAdmins <= 1) {
            alert("No puedes quitar al único administrador. Asciende a otra persona primero.");
            return;
        }

        const confirmar = confirm("¿Quitar a esta persona del invernadero?");
        if (!confirmar) return;

        await set(ref(database, `greenhouses/${codigo}/miembros/${uidMiembro}`), null);

        // Solo podemos limpiar el índice propio si te quitas a ti mismo;
        // el índice de otra persona solo lo puede tocar ella misma.
        if (uidMiembro === auth.currentUser.uid) {
            await set(ref(database, `users/${uidMiembro}/greenhouses/${codigo}`), null);
        }

        cargarInvernaderosYMiembros();

    } catch (error) {

        console.error("Error quitando miembro:", error);
        alert("No se ha podido quitar a esta persona.");

    }

});


// =========================================================
// REAUTENTICAR
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

        mostrarMensaje(emailMessage, "Correo actualizado correctamente.", false);

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
        "auth/requires-recent-login": "Por seguridad, vuelve a iniciar sesión e inténtalo de nuevo.",
        "PERMISSION_DENIED": "No tienes permiso para hacer esto."
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
