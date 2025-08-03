let registerForm = document.querySelector("#form")
let submitButton = document.querySelector(".submitButton")

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


}