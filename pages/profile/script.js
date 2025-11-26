// ==== CONFIG ====
const API_BASE = "https://api.dinedelight.tech";

// ==== ELEMENTS ====
const myProfile = document.querySelector(".myProfile");
const logoutButton = document.querySelector(".logoutButton");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const addressInput = document.getElementById("address");
const profileTypeBadge = document.getElementById("profileTypeBadge");
const infoMessageEl = document.getElementById("infoMessage");
const saveBtn = document.getElementById("saveBtn");
const profileForm = document.getElementById("profileForm");

// ==== HELPERS ====
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    // Always decode URI components for all cookies
    try {
      return decodeURIComponent(parts.pop().split(";").shift());
    } catch (e) {
      return parts.pop().split(";").shift();
    }
  }
  return null;
}


function setInfoMessage(text) {
  if (!infoMessageEl) return;
  infoMessageEl.textContent = text || "";
}

/**
 * Detect table account from email.
 * Supports BOTH:
 *  - table9@dinedelight.tech
 *  - 9@dinedelight.tech        (your current qr.js)
 */
function getTableInfo(email) {
  if (!email) return null;

  // pattern 1: table9@dinedelight.tech
  let match = email.match(/^table(\d+)@dinedelight\.tech\/?$/i);

  // pattern 2: 9@dinedelight.tech
  if (!match) {
    match = email.match(/^(\d+)@dinedelight\.tech\/?$/i);
  }

  if (!match) return null;

  // Remove any trailing non-digit chars (e.g., slash)
  let number = match[1].replace(/\D+$/, "");
  return {
    number,
    label: `Table ${number}`,
  };
}

// Lock fields for table accounts
function lockTableProfileUI(tableLabel) {
  if (profileTypeBadge) {
    profileTypeBadge.textContent = "Table Account";
    profileTypeBadge.classList.add("table");
  }

  if (usernameInput) {
    usernameInput.readOnly = true;
  }
  if (emailInput) {
    emailInput.readOnly = true;
  }
  if (addressInput) {
    addressInput.readOnly = true;
  }

  if (saveBtn) {
    saveBtn.classList.add("disabled");
    saveBtn.disabled = true;
  }

  setInfoMessage(
    "This is a table account. Details are fixed and managed by the restaurant."
  );

  // For safety, prevent any default submit behaviour too
  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
    });
  }
}

// Enable UI for normal user accounts
function enableUserProfileUI() {
  if (profileTypeBadge) {
    profileTypeBadge.textContent = "User Account";
    profileTypeBadge.classList.remove("table");
  }
  if (usernameInput) usernameInput.readOnly = false;
  if (emailInput) emailInput.readOnly = false;
  if (addressInput) addressInput.readOnly = false;

  if (saveBtn) {
    saveBtn.classList.remove("disabled");
    saveBtn.disabled = false;
  }

  setInfoMessage("You can update your profile details and save the changes.");
}

// Initialize navbar profile text (same pattern as other pages)
(function initNavbarProfile() {
  const name = getCookie("name");
  if (name && myProfile) {
    myProfile.innerHTML = `<i class="fa-solid fa-user"></i> ${name}`;
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

// ==== INITIAL DATA LOAD ====
async function initProfilePage() {
  const userId = getCookie("id");
  const role = getCookie("role"); // optional, if you set it

  if (!userId) {
    // Not logged in → send to login
    window.location.href = "../login/index.html";
    return;
  }

  // Always fetch from backend
  try {
    // Always use cookies/localStorage for table accounts, ignore backend for these fields
    const cookieMail = getCookie("mail");
    const cookieName = getCookie("name");
    const role = getCookie("role");
    const tableInfo = getTableInfo(cookieMail);
    const isTable = role === "table" || !!tableInfo;
    if (isTable) {
      const tableLabel = tableInfo?.label || (cookieName ? cookieName.replace(/\/$/, "") : "Table");
      if (usernameInput) usernameInput.value = tableLabel;
      if (emailInput) emailInput.value = cookieMail ? cookieMail.replace(/\/$/, "") : "";
      let tableAddress = localStorage.getItem("tableAddress") || tableLabel;
      if (addressInput) addressInput.value = tableAddress;
      if (myProfile) myProfile.innerHTML = `<i class=\"fa-solid fa-user\"></i> ${tableLabel}`;
      if (profileTypeBadge) {
        profileTypeBadge.textContent = "Table Account";
        profileTypeBadge.classList.add("table");
      }
      lockTableProfileUI(tableLabel);
      return;
    }

    // Normal user: fetch from backend
    const res = await fetch(`${API_BASE}/profile?id=${encodeURIComponent(userId)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.response !== "success" || !data.user) return;
    const user = data.user;
    enableUserProfileUI();
    if (usernameInput) usernameInput.value = user.name || "";
    if (emailInput) emailInput.value = user.email || "";
    if (addressInput) addressInput.value = user.address || "";
    if (myProfile) myProfile.innerHTML = `<i class=\"fa-solid fa-user\"></i> ${user.name || "Profile"}`;
  } catch (err) {
    console.warn("Could not load profile info:", err);
  }
}

// ==== SAVE HANDLER (only for normal user accounts) ====
if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = getCookie("id");
    const cookieMail = getCookie("mail");
    const role = getCookie("role");

    if (!userId) {
      alert("You are not logged in. Please log in again.");
      window.location.href = "../login/index.html";
      return;
    }

    // If it's a table account, do nothing (UI should already be locked)
    if (role === "table" || getTableInfo(cookieMail)) {
      return;
    }

    const name = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const address = addressInput.value.trim();

    if (!name || !email) {
      alert("Name and email are required.");
      return;
    }

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.classList.add("disabled");
      saveBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    try {

      // Prepare payload for /update_profile
      // Use current cookie mail as identifier, send new_mail if changed
      const payload = {
        mail: cookieMail,
        name: name,
        address: address,
      };
      if (email && email !== cookieMail) {
        payload.new_mail = email;
      }

      const res = await fetch(`${API_BASE}/update_profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.response !== "success") {
        throw new Error(data.message || "Failed to update profile");
      }

      // Update cookies with new name/email
      document.cookie = `name=${encodeURIComponent(name)};path=/;max-age=${60 * 60 * 24 * 7}`;
      const effectiveEmail = email && email !== cookieMail ? email : cookieMail;
      document.cookie = `mail=${encodeURIComponent(effectiveEmail)};path=/;max-age=${60 * 60 * 24 * 7}`;

      setInfoMessage("Profile updated successfully ✅");
      alert("Profile updated successfully!");

      // Update navbar text
      if (myProfile) {
        myProfile.innerHTML = `<i class="fa-solid fa-user"></i> ${name}`;
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while updating your profile.");
      setInfoMessage("Could not save changes. Please try again.");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.remove("disabled");
        saveBtn.innerHTML =
          '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
      }
    }
  });
}

// ==== RUN INIT ====

// Show toaster if redirected from checkout due to missing address
if (localStorage.getItem("showAddressToaster") === "1") {
  setInfoMessage("Please add a valid address to proceed with checkout.");
  infoMessageEl.style.backgroundColor = "#fd9d1fff";
  infoMessageEl.style.color = "#fff";
  setTimeout(() => {
    infoMessageEl.textContent = "";
    infoMessageEl.style.backgroundColor = "";
    infoMessageEl.style.color = "";
    localStorage.removeItem("showAddressToaster");
  }, 3500);
}

initProfilePage();

// Back to Menu button behavior (like checkout)
const backToMenuBtn = document.getElementById("backToMenuBtn");
if (backToMenuBtn) {
  backToMenuBtn.addEventListener("click", () => {
    window.location.href = "../menu/index.html";
  });
}
