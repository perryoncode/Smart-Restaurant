let registerForm = document.querySelector("#form")
let submitButton = document.querySelector(".submitButton")
let toaster = document.querySelector(".toaster")

submitButton.addEventListener("click", register)
async function register(e) {
    e.preventDefault();
    let name = document.querySelector("#name").value
    let email = document.querySelector("#mail").value
    let password = document.querySelector("#password").value
    const data = JSON.stringify(
        {
            name,
            email,
            password
        }
    )
    const postBackend = await fetch("http://localhost:8000/register", {
        headers: {
            "Content-Type": "application/json",
        },
        method: "Post",
        body: data
    })

    const result = await postBackend.json()
    toaster.innerText = "";

    if (result.response === "success") {
        toaster.innerText = "Success!"
        toaster.style.backgroundColor = "#65d965ff"
        toaster.style.color = "#ffffff"
        toaster.classList.add("show")
        document.querySelector("#name").value = "";
        document.querySelector("#mail").value = "";
        document.querySelector("#password").value = "";
        setTimeout(() => {
            toaster.classList.remove("show");
        }, 1500)


    }
    else {
        toaster.innerText = "Please try again later!"
        toaster.style.backgroundColor = "#ea5050ff"
        toaster.style.color = "#ffffff"
        toaster.classList.add("show")
        document.querySelector("#name").value = "";
        document.querySelector("#mail").value = "";
        document.querySelector("#password").value = "";
        setTimeout(() => {
            toaster.classList.remove("show");
        }, 1500)
    }




}

