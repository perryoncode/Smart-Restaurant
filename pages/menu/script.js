


if (document.cookie.includes("name=") == false){
    window.location.href = "../signup/"
}


let myProfile = document.querySelector(".myProfile")
let logoutButton = document.querySelector(".logoutButton")

logoutButton.addEventListener("click", clearCookies)
async function clearCookies(e) 
{
    
    e.preventDefault();
    document.cookie = "id=;path=/;max-age=0";
    document.cookie = "name=;path=/;max-age=0";
    document.cookie = "mail=;path=/;max-age=0";
    window.location.href = "../login/"

}
let data = document.cookie
let name=""
const parts = data.split(";")
for  (let part of parts) {
    part = part.trim();
    if (part.startsWith("name=")) {
        name = part.split("=")[1];
        break;
        

    }
}
myProfile.innerHTML = `<i class="fa-solid fa-user"></i> ${name}`;

