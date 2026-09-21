// =========================================================
// GROWSYNC - CONFIGURACIÓN
// Cuenta + selección de invernadero + miembros + sensores
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

const membersContainer =
    document.getElementById("greenhousesMembersContainer");

const changeEmailForm =
    document.getElementById("changeEmailForm");

const emailMessage =
    document.getElementById("emailMessage");

const deleteAccountForm =
    document.getElementById("deleteAccountForm");

const deleteMessage =
    document.getElementById("deleteMessage");


// =========================================================
// CONFIGURACIÓN
// =========================================================

const ROLES = [
    "administrador",
    "gestor",
    "lector"
];

const SENSOR_CATALOG = [
    {
        id: "temperatura",
        nombre: "Temperatura"
    },
    {
        id: "humedad",
        nombre: "Humedad ambiente"
    },
    {
        id: "suelo",
        nombre: "Humedad del suelo"
    },
    {
        id: "luz",
        nombre: "Luminosidad"
    },
    {
        id: "agua",
        nombre: "Depósito de agua"
    },
    {
        id: "bateria",
        nombre: "Batería"
    },
    {
        id: "solar",
        nombre: "Producción solar"
    }
];


// =========================================================
// VARIABLES
// =========================================================

let uidActual = null;
let invernaderosUsuario = {};


// =========================================================
// SESIÓN
// =========================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    uidActual = user.uid;

    if (currentEmailEl) {
        currentEmailEl.textContent = user.email || "—";
    }

    if (userAvatar) {
        userAvatar.textContent =
            (user.email || "U").charAt(0).toUpperCase();
    }

    await cargarInvernaderos();
});


// =========================================================
// CARGAR INVERNADEROS
// =========================================================

async function cargarInvernaderos() {

    if (!membersContainer) return;

    membersContainer.innerHTML = `
        <p>Cargando invernaderos...</p>
    `;

    try {

        const listaSnap = await get(
            ref(database, `users/${uidActual}/greenhouses`)
        );

        if (!listaSnap.exists()) {

            membersContainer.innerHTML = `
                <p>Todavía no perteneces a ningún invernadero.</p>
            `;

            return;
        }

        const lista = listaSnap.val();

        const codigos = Object.keys(lista);

        if (codigos.length === 0) {

            membersContainer.innerHTML = `
                <p>Todavía no perteneces a ningún invernadero.</p>
            `;

            return;
        }

        invernaderosUsuario = {};

        for (const codigo of codigos) {

            const infoSnap = await get(
                ref(database, `greenhouses/${codigo}/info`)
            );

            const info = infoSnap.exists()
                ? infoSnap.val()
                : {};

            invernaderosUsuario[codigo] = {
                nombre: info.nombre || codigo,
                ubicacion: info.ubicacion || ""
            };
        }

        crearInterfazInvernaderos(codigos);

        // Seleccionar automáticamente el primero
        await cargarMiembrosYConfiguracion(codigos[0]);

    } catch (error) {

        console.error(
            "Error cargando invernaderos:",
            error
        );

        membersContainer.innerHTML = `
            <p>
                No se han podido cargar tus invernaderos.
            </p>
        `;
    }
}


// =========================================================
// CREAR INTERFAZ
// =========================================================

function crearInterfazInvernaderos(codigos) {

    membersContainer.innerHTML = `

        <div class="members-section">

            <div class="members-header">

                <div>

                    <span class="page-label">
                        GESTIÓN
                    </span>

                    <h2>
                        Invernaderos y miembros
                    </h2>

                    <p>
                        Selecciona un invernadero para
                        gestionar sus usuarios, roles y sensores.
                    </p>

                </div>

            </div>


            <!-- SELECTOR DE INVERNADERO -->

            <div class="greenhouse-selector">

                <label for="greenhouseSelect">
                    Invernadero
                </label>

                <select id="greenhouseSelect">

                    ${codigos.map(codigo => {

                        const info =
                            invernaderosUsuario[codigo];

                        return `
                            <option value="${codigo}">
                                ${escapeHtml(info.nombre)}
                                (${escapeHtml(codigo)})
                            </option>
                        `;

                    }).join("")}

                </select>

            </div>


            <!-- INFORMACIÓN DEL INVERNADERO -->

            <div id="selectedGreenhouseInfo"
                 style="margin-bottom:20px;">
            </div>


            <!-- TABLA DE MIEMBROS -->

            <div class="members-table-container">

                <table class="members-table">

                    <thead>

                        <tr>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>

                    </thead>

                    <tbody id="membersTableBody">

                        <tr>

                            <td colspan="3"
                                class="table-message">

                                Cargando miembros...

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>


            <!-- SENSORES -->

            <div style="margin-top:30px;">

                <div class="members-header">

                    <div>

                        <span class="page-label">
                            CONFIGURACIÓN
                        </span>

                        <h2>
                            Sensores
                        </h2>

                        <p>
                            Sensores disponibles en el invernadero seleccionado.
                        </p>

                    </div>

                </div>


                <div class="members-table-container">

                    <table class="members-table">

                        <thead>

                            <tr>
                                <th>Sensor</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>

                        </thead>

                        <tbody id="sensorsTableBody">

                            <tr>

                                <td colspan="3"
                                    class="table-message">

                                    Cargando sensores...

                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    `;


    // Evento del selector

    const greenhouseSelect =
        document.getElementById("greenhouseSelect");

    greenhouseSelect?.addEventListener(
        "change",
        async () => {

            await cargarMiembrosYConfiguracion(
                greenhouseSelect.value
            );

        }
    );
}


// =========================================================
// CARGAR MIEMBROS + SENSORES
// =========================================================

async function cargarMiembrosYConfiguracion(codigo) {

    if (!codigo) return;

    const membersTableBody =
        document.getElementById("membersTableBody");

    const sensorsTableBody =
        document.getElementById("sensorsTableBody");

    const selectedInfo =
        document.getElementById("selectedGreenhouseInfo");


    if (membersTableBody) {

        membersTableBody.innerHTML = `
            <tr>
                <td colspan="3"
                    class="table-message">

                    Cargando miembros...

                </td>
            </tr>
        `;
    }


    if (sensorsTableBody) {

        sensorsTableBody.innerHTML = `
            <tr>
                <td colspan="3"
                    class="table-message">

                    Cargando sensores...

                </td>
            </tr>
        `;
    }


    try {

        // =====================================================
        // INFORMACIÓN DEL INVERNADERO
        // =====================================================

        const infoSnap = await get(
            ref(database, `greenhouses/${codigo}/info`)
        );

        const info = infoSnap.exists()
            ? infoSnap.val()
            : {};


        // =====================================================
        // MIEMBROS
        // =====================================================

        let miembrosSnap = await get(
            ref(database, `greenhouses/${codigo}/miembros`)
        );


        // =====================================================
        // MIGRACIÓN
        // =====================================================

        if (
            !miembrosSnap.exists() &&
            info.propietario === uidActual
        ) {

            await set(
                ref(
                    database,
                    `greenhouses/${codigo}/miembros/${uidActual}`
                ),
                {
                    rol: "administrador",
                    email: auth.currentUser?.email || ""
                }
            );

            miembrosSnap = await get(
                ref(
                    database,
                    `greenhouses/${codigo}/miembros`
                )
            );
        }


        const miembros =
            miembrosSnap.exists()
                ? miembrosSnap.val()
                : {};


        const miRol =
            miembros[uidActual]?.rol || "lector";


        const esAdmin =
            miRol === "administrador";


        // =====================================================
        // INFORMACIÓN ARRIBA DE LA TABLA
        // =====================================================

        if (selectedInfo) {

            selectedInfo.innerHTML = `

                <div style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:12px;
                    align-items:center;
                ">

                    <strong style="font-size:18px;">
                        ${escapeHtml(info.nombre || codigo)}
                    </strong>

                    <span>
                        Código:
                        <strong>
                            ${escapeHtml(codigo)}
                        </strong>
                    </span>

                    <span>
                        Tu rol:
                        <strong>
                            ${capitalizar(miRol)}
                        </strong>
                    </span>

                </div>
            `;
        }


        // =====================================================
        // TABLA DE MIEMBROS
        // =====================================================

        if (!membersTableBody) return;


        const listaMiembros =
            Object.entries(miembros);


        if (listaMiembros.length === 0) {

            membersTableBody.innerHTML = `

                <tr>

                    <td colspan="3"
                        class="table-message">

                        Este invernadero todavía no tiene miembros.

                    </td>

                </tr>
            `;

        } else {

            membersTableBody.innerHTML =
                listaMiembros.map(
                    ([memberUid, datos]) => {

                        const rolActual =
                            datos?.rol || "lector";

                        const email =
                            datos?.email ||
                            memberUid;

                        const soyYo =
                            memberUid === uidActual;


                        const opciones =
                            ROLES.map(
                                rol => `
                                    <option
                                        value="${rol}"
                                        ${
                                            rol === rolActual
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        ${capitalizar(rol)}
                                    </option>
                                `
                            ).join("");


                        return `

                            <tr>

                                <td>

                                    <div class="member-user">

                                        <div class="member-avatar">
                                            ${escapeHtml(
                                                email
                                                    .charAt(0)
                                                    .toUpperCase()
                                            )}
                                        </div>

                                        <div>

                                            <strong>
                                                ${escapeHtml(email)}
                                                ${
                                                    soyYo
                                                        ? " (tú)"
                                                        : ""
                                                }
                                            </strong>

                                            <small>
                                                ${escapeHtml(memberUid)}
                                            </small>

                                        </div>

                                    </div>

                                </td>


                                <td>

                                    <select
                                        class="role-select"
                                        data-codigo="${escapeHtml(codigo)}"
                                        data-uid="${escapeHtml(memberUid)}"
                                        ${
                                            esAdmin
                                                ? ""
                                                : "disabled"
                                        }
                                    >

                                        ${opciones}

                                    </select>

                                </td>


                                <td>

                                    ${
                                        esAdmin
                                            ? `
                                                <button
                                                    type="button"
                                                    class="delete-button remove-member"
                                                    data-codigo="${escapeHtml(codigo)}"
                                                    data-uid="${escapeHtml(memberUid)}"
                                                >
                                                    Quitar
                                                </button>
                                            `
                                            : ""
                                    }

                                </td>

                            </tr>
                        `;

                    }
                ).join("");
        }


        // =====================================================
        // SENSORES
        // =====================================================

        let sensoresConfigSnap =
            await get(
                ref(
                    database,
                    `greenhouses/${codigo}/sensoresConfig`
                )
            );


        // Si el invernadero es antiguo y todavía no tiene
        // configuración, añadimos los sensores por defecto.

        if (
            !sensoresConfigSnap.exists() &&
            esAdmin
        ) {

            for (const sensor of SENSOR_CATALOG) {

                await set(
                    ref(
                        database,
                        `greenhouses/${codigo}/sensoresConfig/${sensor.id}`
                    ),
                    {
                        activo: true
                    }
                );
            }


            sensoresConfigSnap =
                await get(
                    ref(
                        database,
                        `greenhouses/${codigo}/sensoresConfig`
                    )
                );
        }


        const sensoresConfig =
            sensoresConfigSnap.exists()
                ? sensoresConfigSnap.val()
                : {};


        if (!sensorsTableBody) return;


        sensorsTableBody.innerHTML =
            SENSOR_CATALOG.map(
                sensor => {

                    const añadido =
                        !!sensoresConfig[sensor.id];


                    if (!añadido) {

                        return `

                            <tr>

                                <td>
                                    ${escapeHtml(sensor.nombre)}
                                </td>

                                <td style="
                                    color:var(--text-light);
                                ">
                                    No añadido
                                </td>

                                <td>

                                    ${
                                        esAdmin
                                            ? `
                                                <button
                                                    type="button"
                                                    class="primary-button add-sensor"
                                                    style="
                                                        width:auto;
                                                        padding:8px 12px;
                                                        font-size:12px;
                                                    "
                                                    data-codigo="${escapeHtml(codigo)}"
                                                    data-sensor="${escapeHtml(sensor.id)}"
                                                >
                                                    Añadir
                                                </button>
                                            `
                                            : ""
                                    }

                                </td>

                            </tr>
                        `;
                    }


                    return `

                        <tr>

                            <td>
                                ${escapeHtml(sensor.nombre)}
                            </td>

                            <td>
                                Añadido
                            </td>

                            <td>

                                ${
                                    esAdmin
                                        ? `
                                            <button
                                                type="button"
                                                class="delete-button remove-sensor"
                                                data-codigo="${escapeHtml(codigo)}"
                                                data-sensor="${escapeHtml(sensor.id)}"
                                            >
                                                Quitar
                                            </button>
                                        `
                                        : ""
                                }

                            </td>

                        </tr>
                    `;

                }
            ).join("");


    } catch (error) {

        console.error(
            "Error cargando miembros/configuración:",
            error
        );


        if (membersTableBody) {

            membersTableBody.innerHTML = `

                <tr>

                    <td colspan="3"
                        class="table-message">

                        No se han podido cargar los miembros.

                    </td>

                </tr>
            `;
        }


        if (sensorsTableBody) {

            sensorsTableBody.innerHTML = `

                <tr>

                    <td colspan="3"
                        class="table-message">

                        No se han podido cargar los sensores.

                    </td>

                </tr>
            `;
        }
    }
}


// =========================================================
// CAMBIAR ROL
// =========================================================

membersContainer?.addEventListener(
    "change",
    async (event) => {

        if (
            !event.target.classList.contains(
                "role-select"
            )
        ) {
            return;
        }


        const select = event.target;

        const codigo =
            select.dataset.codigo;

        const uidMiembro =
            select.dataset.uid;

        const nuevoRol =
            select.value;


        try {

            const miembrosSnap =
                await get(
                    ref(
                        database,
                        `greenhouses/${codigo}/miembros`
                    )
                );


            const miembros =
                miembrosSnap.exists()
                    ? miembrosSnap.val()
                    : {};


            const rolAnterior =
                miembros[uidMiembro]?.rol;


            const numAdmins =
                Object.values(miembros)
                    .filter(
                        miembro =>
                            miembro.rol ===
                            "administrador"
                    )
                    .length;


            // Nunca dejar el invernadero sin administrador.

            if (
                rolAnterior === "administrador" &&
                nuevoRol !== "administrador" &&
                numAdmins <= 1
            ) {

                alert(
                    "No puedes quitarle el rol de administrador a la única persona que lo tiene."
                );

                select.value =
                    "administrador";

                return;
            }


            await set(
                ref(
                    database,
                    `greenhouses/${codigo}/miembros/${uidMiembro}/rol`
                ),
                nuevoRol
            );


            await cargarMiembrosYConfiguracion(
                codigo
            );


        } catch (error) {

            console.error(
                "Error cambiando rol:",
                error
            );

            alert(
                "No se ha podido cambiar el rol."
            );

            await cargarMiembrosYConfiguracion(
                codigo
            );
        }
    }
);


// =========================================================
// ACCIONES DE MIEMBROS Y SENSORES
// =========================================================

membersContainer?.addEventListener(
    "click",
    async (event) => {


        // =====================================================
        // AÑADIR SENSOR
        // =====================================================

        if (
            event.target.classList.contains(
                "add-sensor"
            )
        ) {

            const codigo =
                event.target.dataset.codigo;

            const sensorId =
                event.target.dataset.sensor;


            try {

                await set(
                    ref(
                        database,
                        `greenhouses/${codigo}/sensoresConfig/${sensorId}`
                    ),
                    {
                        activo: true
                    }
                );


                await cargarMiembrosYConfiguracion(
                    codigo
                );


            } catch (error) {

                console.error(
                    "Error añadiendo sensor:",
                    error
                );

                alert(
                    "No se ha podido añadir el sensor."
                );
            }


            return;
        }


        // =====================================================
        // QUITAR SENSOR
        // =====================================================

        if (
            event.target.classList.contains(
                "remove-sensor"
            )
        ) {

            const codigo =
                event.target.dataset.codigo;

            const sensorId =
                event.target.dataset.sensor;


            const confirmar =
                confirm(
                    "¿Quitar este sensor del invernadero? Dejará de verse en el dashboard."
                );


            if (!confirmar) return;


            try {

                await set(
                    ref(
                        database,
                        `greenhouses/${codigo}/sensoresConfig/${sensorId}`
                    ),
                    null
                );


                await cargarMiembrosYConfiguracion(
                    codigo
                );


            } catch (error) {

                console.error(
                    "Error quitando sensor:",
                    error
                );

                alert(
                    "No se ha podido quitar el sensor."
                );
            }


            return;
        }


        // =====================================================
        // QUITAR MIEMBRO
        // =====================================================

        if (
            !event.target.classList.contains(
                "remove-member"
            )
        ) {
            return;
        }


        const codigo =
            event.target.dataset.codigo;

        const uidMiembro =
            event.target.dataset.uid;


        try {

            const miembrosSnap =
                await get(
                    ref(
                        database,
                        `greenhouses/${codigo}/miembros`
                    )
                );


            const miembros =
                miembrosSnap.exists()
                    ? miembrosSnap.val()
                    : {};


            const rolDeEsaPersona =
                miembros[uidMiembro]?.rol;


            const numAdmins =
                Object.values(miembros)
                    .filter(
                        miembro =>
                            miembro.rol ===
                            "administrador"
                    )
                    .length;


            // Evitar eliminar al último administrador.

            if (
                rolDeEsaPersona ===
                    "administrador" &&
                numAdmins <= 1
            ) {

                alert(
                    "No puedes quitar al único administrador. Asciende a otra persona primero."
                );

                return;
            }


            const confirmar =
                confirm(
                    "¿Quitar a esta persona del invernadero?"
                );


            if (!confirmar) return;


            await set(
                ref(
                    database,
                    `greenhouses/${codigo}/miembros/${uidMiembro}`
                ),
                null
            );


            // Si eres tú quien se elimina,
            // quitamos también el índice personal.

            if (
                uidMiembro ===
                auth.currentUser.uid
            ) {

                await set(
                    ref(
                        database,
                        `users/${uidMiembro}/greenhouses/${codigo}`
                    ),
                    null
                );
            }


            await cargarInvernaderos();


        } catch (error) {

            console.error(
                "Error quitando miembro:",
                error
            );

            alert(
                "No se ha podido quitar a esta persona."
            );
        }
    }
);


// =========================================================
// REAUTENTICAR
// =========================================================

async function reautenticar(password) {

    const user =
        auth.currentUser;


    if (!user) {
        throw new Error(
            "No hay ningún usuario autenticado."
        );
    }


    const credencial =
        EmailAuthProvider.credential(
            user.email,
            password
        );


    await reauthenticateWithCredential(
        user,
        credencial
    );
}


// =========================================================
// CAMBIAR CORREO
// =========================================================

changeEmailForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const passwordActual =
            document.getElementById(
                "currentPasswordEmail"
            ).value;


        const nuevoCorreo =
            document.getElementById(
                "newEmail"
            ).value.trim();


        if (
            !passwordActual ||
            !nuevoCorreo
        ) {

            mostrarMensaje(
                emailMessage,
                "Rellena los dos campos."
            );

            return;
        }


        try {

            await reautenticar(
                passwordActual
            );


            await updateEmail(
                auth.currentUser,
                nuevoCorreo
            );


            mostrarMensaje(
                emailMessage,
                "Correo actualizado correctamente.",
                false
            );


            if (currentEmailEl) {
                currentEmailEl.textContent =
                    nuevoCorreo;
            }


            changeEmailForm.reset();


        } catch (error) {

            console.error(
                "Error actualizando correo:",
                error
            );

            mostrarMensaje(
                emailMessage,
                traducirError(
                    error.code
                )
            );
        }
    }
);


// =========================================================
// ELIMINAR CUENTA
// =========================================================

deleteAccountForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const passwordActual =
            document.getElementById(
                "currentPasswordDelete"
            ).value;


        if (!passwordActual) {

            mostrarMensaje(
                deleteMessage,
                "Introduce tu contraseña."
            );

            return;
        }


        const confirmar =
            confirm(
                "Esto eliminará tu cuenta de forma permanente. ¿Seguro que quieres continuar?"
            );


        if (!confirmar) return;


        try {

            await reautenticar(
                passwordActual
            );


            await deleteUser(
                auth.currentUser
            );


            window.location.href =
                "index.html";


        } catch (error) {

            console.error(
                "Error eliminando cuenta:",
                error
            );

            mostrarMensaje(
                deleteMessage,
                traducirError(
                    error.code
                )
            );
        }
    }
);


// =========================================================
// MENSAJES
// =========================================================

function mostrarMensaje(
    elemento,
    texto,
    esError = true
) {

    if (!elemento) return;


    elemento.textContent =
        texto;


    elemento.style.color =
        esError
            ? "var(--danger)"
            : "var(--primary)";
}


// =========================================================
// ERRORES FIREBASE
// =========================================================

function traducirError(codigo) {

    const mapa = {

        "auth/wrong-password":
            "Contraseña incorrecta.",

        "auth/invalid-credential":
            "Contraseña incorrecta.",

        "auth/email-already-in-use":
            "Ya existe una cuenta con ese correo.",

        "auth/invalid-email":
            "Ese correo no es válido.",

        "auth/requires-recent-login":
            "Por seguridad, vuelve a iniciar sesión e inténtalo de nuevo.",

        "PERMISSION_DENIED":
            "No tienes permiso para hacer esto.",

        "permission_denied":
            "No tienes permiso para hacer esto."
    };


    return mapa[codigo] ||
        "Ha ocurrido un error. Inténtalo de nuevo.";
}


// =========================================================
// ESCAPAR HTML
// =========================================================

function escapeHtml(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// CAPITALIZAR
// =========================================================

function capitalizar(texto) {

    if (!texto) return "";

    return texto.charAt(0).toUpperCase() +
        texto.slice(1);
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


        themeButton.textContent =
            dark
                ? "☀️"
                : "🌙";
    }
);


cargarTema();
