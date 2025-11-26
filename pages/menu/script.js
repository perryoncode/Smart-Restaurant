setTimeout(() => {
  if (!document.cookie.includes("name=")) {
  }
}, 2000);

const API_BASE = "https://api.dinedelight.tech";

const menuContainer = document.querySelector(".menu");
const input = document.getElementById("searchInput");
const myProfile = document.querySelector(".myProfile");
const logoutButton = document.querySelector(".logoutButton");
const viewItemsBtn = document.querySelector(".viewItems");
const checkoutCountEl = document.getElementById("checkoutCount");

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const raw = parts.pop().split(";").shift();
    try {
      return decodeURIComponent(raw);
    } catch (e) {
      return raw;
    }
  }
  return null;
}

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function updateCheckoutCount() {
  if (!checkoutCountEl) return;
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  checkoutCountEl.textContent = totalQty;
}

updateCheckoutCount();


function getTableInfo(email) {
  if (!email) return null;
  let match = email.match(/^table(\d+)@dinedelight\.tech$/i);
  if (!match) match = email.match(/^(\d+)@dinedelight\.tech$/i);
  if (!match) return null;
  const number = match[1];
  return { number, label: `Table ${number}` };
}

(function initProfile() {
  const name = getCookie("name");
  const email = getCookie("mail");
  const role = getCookie("role");
  const isTable = role === "table" || !!getTableInfo(email);
  if (isTable && myProfile) {
    myProfile.style.display = "none";
    return;
  }
  if (name && myProfile) {
    myProfile.innerHTML = `<i class="fa-solid fa-user"></i> ${name}`;
  }
})();

if (logoutButton) {
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    document.cookie = "id=;path=/;max-age=0";
    document.cookie = "name=;path=/;max-age=0";
    document.cookie = "mail=;path=/;max-age=0";
    window.location.href = "/index.html";
  });
}

let dishNamesForTypewriter = [
  "Brownie",
  "Chole Bhature",
  "Fries",
  "Maggie",
  "Momos",
  "Panipuri",
  "Paneer Tikka",
  "Soya Chaap",
];

async function loadDishes() {
  try {
    const res = await fetch(`${API_BASE}/dishes`);
    const data = await res.json();

    if (data.response !== "success") {
      menuContainer.innerHTML = "<p>Unable to load menu right now.</p>";
      return;
    }

    const dishes = data.dishes;
    if (!dishes.length) {
      menuContainer.innerHTML = "<p>No dishes available at the moment.</p>";
      return;
    }

    dishNamesForTypewriter = dishes.map((d) => d.name);

    menuContainer.innerHTML = "";

    dishes.forEach((dish) => {
      const card = document.createElement("div");
      card.className = "card";

      const imgSrc = `./dishes/${dish.image}`;

      card.innerHTML = `
        <img src="${imgSrc}" alt="${dish.name}">
        <div class="info">
          <p class="title">${dish.name}</p>
          <div class="info-actions">
            <p class="price">
              <i class="fa-solid fa-indian-rupee-sign"></i> ${dish.price}
            </p>
            <button class="add-to-cart"
              data-name="${dish.name}"
              data-price="${dish.price}">
              <i class="fa-solid fa-burger"></i> Add to Table
            </button>
          </div>
        </div>
      `;

      menuContainer.appendChild(card);
    });

    document.querySelectorAll(".add-to-cart").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.name;
        const price = Number(btn.dataset.price);

        const existing = cart.find((item) => item.name === name);
        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({
            name,
            price,
            quantity: 1,
          });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        updateCheckoutCount();
      });
    });
  } catch (err) {
    menuContainer.innerHTML = "<p>Network error while loading menu.</p>";
  }
}

if (viewItemsBtn) {
  viewItemsBtn.addEventListener("click", () => {
    if (!cart.length) {
      alert("No items added to table yet.");
      return;
    }
    // Go to checkout page
    window.location.href = "../checkout/index.html";
  });
}

let dishIndex = 0;
let charIndex = 0;
let typing = true;

function typeWriter() {
  if (!input) return;
  const currentDish = dishNamesForTypewriter[dishIndex] || "";
  if (typing) {
    if (charIndex <= currentDish.length) {
      input.placeholder = currentDish.slice(0, charIndex);
      charIndex++;
      setTimeout(typeWriter, 100);
    } else {
      typing = false;
      setTimeout(typeWriter, 1000);
    }
  } else {
    if (charIndex > 0) {
      input.placeholder = currentDish.slice(0, charIndex);
      charIndex--;
      setTimeout(typeWriter, 40);
    } else {
      typing = true;
      dishIndex = (dishIndex + 1) % dishNamesForTypewriter.length;
      setTimeout(typeWriter, 400);
    }
  }
}

loadDishes();
typeWriter();
