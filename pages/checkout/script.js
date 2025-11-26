// ==== CONFIG ====
const API_BASE = "https://api.dinedelight.tech"; // same as menu page

// ==== ELEMENTS ====
const itemsContainer = document.getElementById("checkoutItems");
const subtotalAmountEl = document.getElementById("subtotalAmount");
const taxAmountEl = document.getElementById("taxAmount");
const totalAmountEl = document.getElementById("totalAmount");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const emptyMessageEl = document.getElementById("emptyMessage");

const myProfile = document.querySelector(".myProfile");
const logoutButton = document.querySelector(".logoutButton");
const checkoutCountEl = document.getElementById("checkoutCount"); // in case you add it later in navbar

// ==== HELPERS ====
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

// Table info helper (sanitizes trailing slashes)
function getTableInfo(email) {
  if (!email) return null;
  // Remove any trailing slash or whitespace
  email = email.replace(/[\s\/]+$/, "");
  let match = email.match(/^table(\d+)@dinedelight\.tech$/i);
  if (!match) match = email.match(/^(\d+)@dinedelight\.tech$/i);
  if (!match) return null;
  const number = match[1];
  return { number, label: `Table ${number}`, mail: `table${number}@dinedelight.tech` };
}


// Add checklist state to cart items (default: checked)
let cart = JSON.parse(localStorage.getItem("cart")) || [];
cart.forEach(item => {
  if (item.checked === undefined) item.checked = true;
});
saveCart();

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCheckoutCount() {
  if (!checkoutCountEl) return;
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  checkoutCountEl.textContent = totalQty;
}

// Init profile (same style as menu page)
(function initProfile() {
  const name = getCookie("name");
  let email = getCookie("mail");
  const role = getCookie("role");
  const tableInfo = getTableInfo(email);
  const isTable = role === "table" || !!tableInfo;
  if (isTable && tableInfo) {
    // Always use sanitized label and mail
    if (myProfile) {
      myProfile.innerHTML = `<i class=\"fa-solid fa-user\"></i> ${tableInfo.label}`;
    }
    // Optionally, update cookie to correct mail if needed
    if (email !== tableInfo.mail) {
      document.cookie = `mail=${tableInfo.mail};path=/;max-age=${60 * 60 * 24 * 365 * 10}`;
    }
    return;
  }
  if (name && myProfile) {
    let displayName = name;
    try { displayName = decodeURIComponent(name); } catch (e) {}
    myProfile.innerHTML = `<i class=\"fa-solid fa-user\"></i> ${displayName}`;
  }
})();

// Logout behavior
if (logoutButton) {
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    document.cookie = "id=;path=/;max-age=0";
    document.cookie = "name=;path=/;max-age=0";
    document.cookie = "mail=;path=/;max-age=0";
    document.cookie = "role=;path=/;max-age=0";
    window.location.href = "/index.html";
  });
}

// ==== RENDER FUNCTIONS ====
function renderCart() {
  itemsContainer.innerHTML = "";

  if (!cart.length) {
    itemsContainer.style.display = "none";
    emptyMessageEl.style.display = "block";
    if (placeOrderBtn) {
      placeOrderBtn.disabled = true;
      placeOrderBtn.classList.add("disabled");
    }
    updateTotals();
    updateCheckoutCount();
    return;
  }

  itemsContainer.style.display = "block";
  emptyMessageEl.style.display = "none";
  if (placeOrderBtn) {
    placeOrderBtn.disabled = false;
    placeOrderBtn.classList.remove("disabled");
  }


  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "checkout-item";
    row.dataset.index = index;


    row.innerHTML = `
      <div class="ci-name">
        <i class="fa-solid fa-burger"></i> ${item.name}
      </div>
      <div class="ci-price">
        ₹${item.price}
      </div>
      <div class="ci-qty">
        <button class="qty-btn minus">-</button>
        <input
          type="number"
          class="qty-input"
          min="1"
          value="${item.quantity}"
        />
        <button class="qty-btn plus">+</button>
      </div>
      <div class="ci-total">
        ₹${item.price * item.quantity}
      </div>
      <input type="checkbox" class="item-check" ${item.checked !== false ? "checked" : ""} />
      <button class="remove-item" style="margin-left: 0.2em; vertical-align: middle;">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    itemsContainer.appendChild(row);
  });

  attachRowListeners();
  updateTotals();
  updateCheckoutCount();
}

function updateTotals() {
  // Only include checked items in totals
  const subtotal = cart.reduce(
    (sum, item) => (item.checked !== false ? sum + item.price * item.quantity : sum),
    0
  );
  const tax = 0; // set some % if you want
  const total = subtotal + tax;

  if (subtotalAmountEl) subtotalAmountEl.textContent = `₹${subtotal}`;
  if (taxAmountEl) taxAmountEl.textContent = `₹${tax}`;
  if (totalAmountEl) totalAmountEl.textContent = `₹${total}`;
}

// Attach event handlers for +, -, remove, and editable quantity
function attachRowListeners() {
  const rows = itemsContainer.querySelectorAll(".checkout-item");

  rows.forEach((row) => {
    const index = Number(row.dataset.index);
    const minusBtn = row.querySelector(".qty-btn.minus");
    const plusBtn = row.querySelector(".qty-btn.plus");
    const removeBtn = row.querySelector(".remove-item");
    const qtyInput = row.querySelector(".qty-input");
    const checkBox = row.querySelector(".item-check");

    // Checklist
    checkBox.addEventListener("change", () => {
      cart[index].checked = checkBox.checked;
      saveCart();
      updateTotals();
    });

    // - button
    minusBtn.addEventListener("click", () => {
      if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
      } else {
        cart.splice(index, 1);
      }
      saveCart();
      renderCart();
    });

    // + button
    plusBtn.addEventListener("click", () => {
      cart[index].quantity += 1;
      saveCart();
      renderCart();
    });

    // remove (X) button
    removeBtn.addEventListener("click", () => {
      cart.splice(index, 1);
      saveCart();
      renderCart();
    });

    // direct typing in the input
    qtyInput.addEventListener("change", () => {
      let val = parseInt(qtyInput.value, 10);
      if (isNaN(val) || val < 1) {
        val = 1;
      }
      cart[index].quantity = val;
      saveCart();
      renderCart();
    });
  });
}

// ==== ORDER SUBMISSION ====
// NOTE: change URL/payload to match your FastAPI backend if needed.
async function placeOrder() {
  // Only place checked items
  const checkedItems = cart.filter(item => item.checked !== false);
  if (!checkedItems.length) {
    alert("Please select at least one item to place an order.");
    return;
  }

  placeOrderBtn.disabled = true;
  placeOrderBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Placing Order...`;

  try {
    const userId = getCookie("id");
    const userName = getCookie("name");
    const userMail = getCookie("mail");

    const payload = {
      user_id: userId || null,
      name: userName || null,
      email: userMail || null,
      items: checkedItems.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.response !== "success") {
      throw new Error(data.message || "Failed to place order");
    }

    alert("Order placed successfully! 🎉 Your food is on the way.");

    // Remove only placed (checked) items from cart
    cart = cart.filter(item => item.checked === false);
    saveCart();
    renderCart();

    // Optionally redirect:
    // window.location.href = "../orders/success.html";
  } catch (err) {
    console.error(err);
    alert("Something went wrong placing your order. Please try again.");
  } finally {
    placeOrderBtn.disabled = false;
    placeOrderBtn.innerHTML = `<i class="fa-solid fa-check"></i> Place Order`;
  }
}

// ==== BUTTON LISTENERS ====
if (placeOrderBtn) {
  placeOrderBtn.addEventListener("click", placeOrder);
}

if (backToMenuBtn) {
  backToMenuBtn.addEventListener("click", () => {
    window.location.href = "../menu/index.html";
  });
}

// ==== INITIAL RENDER ====

// ==== ADDRESS CHECK ON LOAD ====
(async function checkUserAddress() {
  const userId = getCookie("id");
  const userMail = getCookie("mail");
  if (!userId || !userMail) {
    window.location.href = "../login/index.html";
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/profile?id=${encodeURIComponent(userId)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.response !== "success" || !data.user) return;
    const address = data.user.address;
    if (!address || address.trim() === "") {
      // Set a flag for toaster on profile page
      localStorage.setItem("showAddressToaster", "1");
      window.location.href = "../profile/index.html";
    }
  } catch (err) {
    // Optionally handle error
  }
})();

renderCart();
