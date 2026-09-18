const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");
const settingsButton = document.getElementById("settingsButton");


menuButton?.addEventListener("click", (event) => {

    event.stopPropagation();

    sideMenu?.classList.toggle("active");

});


document.addEventListener("click", (event) => {

    if (
        sideMenu &&
        !sideMenu.contains(event.target) &&
        !menuButton?.contains(event.target)
    ) {

        sideMenu.classList.remove("active");

    }

});


settingsButton?.addEventListener("click", () => {

    // De momento no hacemos nada

});
