let loginForm = document.querySelector(".form");
let toaster = document.querySelector(".toaster");

loginForm.addEventListener("submit", login);

async function login(e) {
    e.preventDefault();
    let mail = document.querySelector("#mail").value;
    let password = document.querySelector("#password").value;
    const data = JSON.stringify({
        mail,
        password
    });
    try {
        const postBackend = await fetch("http://localhost:8000/login", {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: data
        });
        const result = await postBackend.json();
        toaster.innerText = "";
        if (result.response === "success") {
            toaster.innerText = "Success!";
            toaster.style.backgroundColor = "#65d965ff";
            toaster.style.color = "#ffffff";
            toaster.classList.add("show");
            document.querySelector("#mail").value = "";
            document.querySelector("#password").value = "";
            setTimeout(() => {
                toaster.classList.remove("show");
            }, 1500);
        } else {
            toaster.innerText = "Please try again later!";
            toaster.style.backgroundColor = "#ea5050ff";
            toaster.style.color = "#ffffff";
            toaster.classList.add("show");
            document.querySelector("#mail").value = "";
            document.querySelector("#password").value = "";
            setTimeout(() => {
                toaster.classList.remove("show");
            }, 1500);
        }
    } catch (err) {
        toaster.innerText = "Network error!";
        toaster.style.backgroundColor = "#ea5050ff";
        toaster.style.color = "#ffffff";
        toaster.classList.add("show");
        setTimeout(() => {
            toaster.classList.remove("show");
        }, 1500);
    }



}

