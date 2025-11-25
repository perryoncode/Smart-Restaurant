
const params = new URLSearchParams(window.location.search);
const tableId = params.get("tableId");

if (!tableId) {
    
    window.location.href = "/login/";
}


document.cookie = "id=;path=/;max-age=0";
document.cookie = "name=;path=/;max-age=0";
document.cookie = "mail=;path=/;max-age=0";


const maxAge = 60 * 10;

document.cookie = `name=Table ${tableId};path=/;max-age=${maxAge}`;
document.cookie = `id=${tableId};path=/;max-age=${maxAge}`;
document.cookie = `mail=${tableId}@dinedelight.tech;path=/;max-age=${maxAge}`;

window.location.href = "../menu/";




