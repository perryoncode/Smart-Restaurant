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
        const postBackend = await fetch("https://api.dinedelight.tech/login", {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: data
        });
        const result = await postBackend.json();
        toaster.innerText = "";


        if (result.response === "success") {
            let maxAge = 60 * 60 * 24 * 365 * 10;
            // Table account detection
            let isTable = false;
            let tableNumber = null;
            if (result.user.mail) {
                // Only treat as table if mail matches tableX@dinedelight.tech or X@dinedelight.tech exactly
                let tableMatch = result.user.mail.match(/^table(\d+)@dinedelight\.tech$/i);
                if (!tableMatch) tableMatch = result.user.mail.match(/^(\d+)@dinedelight\.tech$/i);
                if (tableMatch) {
                    isTable = true;
                    tableNumber = tableMatch[1].replace(/[\/]/g, "").replace(/\D/g, "");
                } else {
                    isTable = false;
                    tableNumber = null;
                }
            }
            // Clear all relevant cookies
            document.cookie = "id=;path=/;max-age=0";
            document.cookie = "name=;path=/;max-age=0";
            document.cookie = "mail=;path=/;max-age=0";
            document.cookie = "role=;path=/;max-age=0";
                        if (isTable && tableNumber) {
                                // Remove all slashes from table number for cookies
                                let cleanTableNumber = (tableNumber + '').replace(/[\/]/g, "");
                                let cleanMail = `table${cleanTableNumber}@dinedelight.tech`;
                                document.cookie = `name=Table ${cleanTableNumber};path=/;max-age=${maxAge}`;
                                document.cookie = `id=${cleanTableNumber};path=/;max-age=${maxAge}`;
                                document.cookie = `mail=${cleanMail};path=/;max-age=${maxAge}`;
                                document.cookie = `role=table;path=/;max-age=${maxAge}`;
                                localStorage.setItem("tableAddress", `Table ${cleanTableNumber}`);
                                // Debug: log the mail cookie value after setting
                                setTimeout(() => {
                                    console.log('DEBUG: mail cookie after login:', document.cookie.split('; ').find(row => row.startsWith('mail=')));
                                }, 100);
                        } else {
                document.cookie = `name=${result.user.name};path=/;max-age=${maxAge}`;
                document.cookie = `id=${result.user._id};path=/;max-age=${maxAge}`;
                document.cookie = `mail=${result.user.mail};path=/;max-age=${maxAge}`;
                document.cookie = `role=user;path=/;max-age=${maxAge}`;
                localStorage.removeItem("tableAddress");
            }
            // Debug: log the mail cookie value after setting
            setTimeout(() => {
                console.log('DEBUG: mail cookie after login:', document.cookie.split('; ').find(row => row.startsWith('mail=')));
            }, 100);
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