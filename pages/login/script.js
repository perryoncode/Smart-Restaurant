if (document.cookie.includes("name=")){
    window.location.href = "../menu/"
}
const form = document.querySelector(".form");
const toaster = document.querySelector(".toaster");
form.addEventListener("submit", login);
async function login(e) {
    e.preventDefault();
    let mail = document.querySelector("#mail").value;
    let password = document.querySelector("#password").value;
    const data = JSON.stringify({ mail, password });
    try {
        const postBackend = await fetch("https://anya-restaurant.onrender.com/login", {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: data
        });
        const result = await postBackend.json();
        toaster.innerText = "";


        if (result.response === "success") {
            let maxAge = 60 * 60 * 24 * 365 * 10;
            document.cookie = `name=${result.user.name};path=/;max-age=${maxAge}`;
            document.cookie = `id=${result.user._id};path=/;max-age=${maxAge}`;
            document.cookie = `mail=${result.user.mail};path=/;max-age=${maxAge}`;
            toaster.innerText = "Success!";
            toaster.style.backgroundColor = "#65d965ff";
            toaster.style.color = "#ffffff";
            toaster.classList.add("show");
            document.querySelector("#mail").value = "";
            document.querySelector("#password").value = "";
            setTimeout(() => {
                toaster.classList.remove("show");
                window.location.href = "../menu/"
            }, 1500);
        } else if (result.response === "notExist") {
            toaster.innerText = "User doesn't exist";
            toaster.style.backgroundColor = "#fd9d1fff";
            toaster.style.color = "#ffffff";
            toaster.classList.add("show");
            document.querySelector("#mail").value = "";
            document.querySelector("#password").value = "";
            setTimeout(() => {
                toaster.classList.remove("show");
            }, 1500);
        } else if (result.response === "wrongPassword") {
            toaster.innerText = "Wrong Password";
            toaster.style.backgroundColor = "#ff4444ff";
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
    }

    catch (err) {
        toaster.innerText = "Network error!";
        toaster.style.backgroundColor = "#ea5050ff";
        toaster.style.color = "#ffffff";
        toaster.classList.add("show");
        setTimeout(() => {
            toaster.classList.remove("show");
        }, 1500);
    }
}