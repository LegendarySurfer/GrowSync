// =========================================================
// GROWSYNC - DASHBOARD
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

const greenhouseName =
    document.getElementById(
        "greenhouseName"
    );

const greenhouseCode =
    document.getElementById(
        "greenhouseCode"
    );

const userAvatar =
    document.getElementById(
        "userAvatar"
    );

const backButton =
    document.getElementById(
        "backButton"
    );

const themeButton =
    document.getElementById(
        "themeButton"
    );


// =========================================================
// INVERNADERO SELECCIONADO
// =========================================================

const selectedGreenhouse =
    localStorage.getItem(
        "selectedGreenhouse"
    );


if (!selectedGreenhouse) {

    window.location.href =
        "invernaderos.html";

}


// =========================================================
// DATOS TEMPORALES
// =========================================================

const greenhouseData = {

    "GS-001245": {

        name:
            "Invernadero Terraza",

        code:
            "GS-001245"

    },

    "GS-008721": {

        name:
            "Invernadero Huerto",

        code:
            "GS-008721"

    }

};


// =========================================================
// MOSTRAR DATOS
// =========================================================

if (
    selectedGreenhouse &&
    greenhouseData[selectedGreenhouse]
) {

    const greenhouse =
        greenhouseData[
            selectedGreenhouse
        ];


    greenhouseName.textContent =
        greenhouse.name;


    greenhouseCode.textContent =
        greenhouse.code;

}


// =========================================================
// SESIÓN
// =========================================================

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            // window.location.href = "login.html";

            return;
        }


        console.log(
            "Dashboard usuario:",
            user.uid
        );

    }
);


// =========================================================
// VOLVER
// =========================================================

backButton?.addEventListener(
    "click",
    () => {

        window.location.href =
            "invernaderos.html";

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
