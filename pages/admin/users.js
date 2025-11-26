// ==== CONFIG ====
const API_BASE = "http://20.197.51.157:8000";

// ==== ELEMENTS ====
const usersList = document.getElementById("usersList");
const userResult = document.getElementById("userResult");
const createUserForm = document.getElementById("createUserForm");
const myProfile = document.querySelector(".myProfile");
const logoutButton = document.querySelector(".logoutButton");

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

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// Navbar profile label
(function initNavbarProfile() {
  const name = getCookie("name");
  if (name && myProfile) {
    myProfile.innerHTML = `<i class="fa-solid fa-user"></i> ${name}`;
  }
})();

// Logout
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

// ==== RENDERING ====
function renderUsers(users) {
  usersList.innerHTML = "";
  if (!users || !users.length) {
    document.getElementById("usersHeader").style.display = "none";
    usersList.innerHTML = "<p>No users found.</p>";
    return;
  }
  // Show header with column names
  const header = document.getElementById("usersHeader");
  header.innerHTML = `
    <div>ID</div>
    <div>Name</div>
    <div>Email</div>
    <div>Address</div>
    <div>Actions</div>
  `;
  header.style.display = "grid";
  users.forEach((u) => {
    const row = document.createElement("div");
    row.className = "user-row";
    row.dataset.id = u._id;

    const name = u.name || "";
    const email = u.mail || u.email || "";
    const address = u.address || "";

    row.innerHTML = `
      <div class="meta"><span class="id-badge">#${u._id.slice(-6)}</span></div>
      <div class="name">${name}</div>
      <div class="email">${email}</div>
      <div class="address">${address}</div>
      <div class="actions">
        <button class="edit"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="delete"><i class="fa-solid fa-trash"></i> Delete</button>
      </div>
    `;

    // Edit handler
    row.querySelector(".edit").addEventListener("click", () => startEditRow(row, { name, email, address }));

    // Delete handler
    row.querySelector(".delete").addEventListener("click", () => deleteUser(u._id));

    usersList.appendChild(row);
  });
}

function startEditRow(row, data) {
  const { name, email, address } = data;
  const id = row.dataset.id;
  row.innerHTML = `
    <div class="meta"><span class="id-badge">#${id.slice(-6)}</span></div>
    <input type="text" class="edit-name" value="${name}" placeholder="Teena Sharma" />
    <input type="email" class="edit-email" value="${email}" placeholder="Email" />
    <input type="text" class="edit-address" value="${address}" placeholder="Address" />
    <div class="actions">
      <button class="save"><i class="fa-solid fa-floppy-disk"></i> Save</button>
      <button class="cancel"><i class="fa-solid fa-xmark"></i> Cancel</button>
    </div>
  `;

  row.querySelector(".save").addEventListener("click", async () => {
    const newName = row.querySelector(".edit-name").value.trim();
    const newEmail = row.querySelector(".edit-email").value.trim();
    const newAddress = row.querySelector(".edit-address").value.trim();
    if (!newName || !newEmail) {
      showToast("Name and Email are required", "error");
      return;
    }
    const payload = { name: newName, mail: newEmail, address: newAddress };
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || data.response !== "success") {
      if (data.response === "alreadyExists") {
        showToast("Email already in use.", "error");
      } else {
        showToast("Failed to update user", "error");
      }
      return;
    }
    showToast("User updated successfully");
    loadUsers();
  });

  row.querySelector(".cancel").addEventListener("click", loadUsers);
}

async function deleteUser(id) {
  if (!confirm("Delete this user? This cannot be undone.")) return;
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || data.response !== "success") {
    showToast("Failed to delete user", "error");
    return;
  }
  showToast("User deleted");
  loadUsers();
}

// ==== API ====
async function loadUsers() {
  usersList.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch(`${API_BASE}/users`);
    const data = await res.json();
    if (!res.ok || data.response !== "success") {
      usersList.innerHTML = "<p>Could not load users.</p>";
      return;
    }
    renderUsers(data.users || []);
  } catch (e) {
    usersList.innerHTML = "<p>Network error.</p>";
  }
}

// Create user via existing /register endpoint
if (createUserForm) {
  createUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameEl = document.getElementById("userName");
    const emailEl = document.getElementById("userEmail");
    const addressEl = document.getElementById("userAddress");
    const passEl = document.getElementById("userPassword");

    const name = nameEl.value.trim();
    const mail = emailEl.value.trim();
    const address = addressEl.value.trim();
    const password = passEl.value.trim();

    if (!name || !mail || !password) {
      showToast("All fields are required", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mail, password }),
      });
      const data = await res.json();
      if (!res.ok || data.response !== "success") {
        if (data.response === "alreadyExists") {
          showToast("Email already exists", "error");
        } else {
          showToast("Failed to create user", "error");
        }
        return;
      }
      // If address provided, set it via admin update after creation
      if (address) {
        try {
          const listRes = await fetch(`${API_BASE}/users`);
          const listData = await listRes.json();
          if (listRes.ok && listData.users) {
            const created = listData.users.find(u => (u.mail || u.email) === mail);
            if (created) {
              await fetch(`${API_BASE}/users/${encodeURIComponent(created._id)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address })
              });
            }
          }
        } catch (e) {}
      }
      showToast("User created");
      nameEl.value = "";
      emailEl.value = "";
      addressEl.value = "";
      passEl.value = "";
      loadUsers();
    } catch (e) {
      showToast("Network error", "error");
    }
  });
}

// ==== RUN ====
loadUsers();
