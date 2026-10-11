
const USERS_KEY = "rocketUsers";
const SESSION_KEY = "currentUserEmail";

const $ = (id) => document.getElementById(id);

function setMessage(id, text, type = "info") {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
    el.style.color = type === "error" ? "#ff8a8a" : type === "success" ? "#7be0a0" : "#becddc";
}

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;
    return getUsers().find((u) => u.email === email) || null;
}

function newSalt() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

async function hashPassword(password, salt) {
    const data = new TextEncoder().encode(salt + password);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function checkSecureContext(messageId) {
    if (window.crypto && crypto.subtle) return true;
    setMessage(messageId, "Accounts need https:// or localhost to work.", "error");
    return false;
}

function updateNav() {
    const link = $("authLink");
    if (!link) return;
    if (getCurrentUser()) {
        link.textContent = "Profile";
        link.href = "Profile.html";
    }
}

function setupRegister() {
    const form = $("registerForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!checkSecureContext("registerMessage")) return;

        const name = $("name").value.trim();
        const email = $("email").value.trim().toLowerCase();
        const password = $("password").value;
        const confirm = $("confirmPassword").value;

        if (!name || !email || !password || !confirm) {
            return setMessage("registerMessage", "Fill in every field.", "error");
        }
        if (password.length < 8) {
            return setMessage("registerMessage", "Use a password with at least 8 characters.", "error");
        }
        if (password !== confirm) {
            return setMessage("registerMessage", "Passwords don't match.", "error");
        }

        const users = getUsers();
        if (users.some((u) => u.email === email)) {
            return setMessage("registerMessage", "An account with this email already exists. Log in instead.", "error");
        }

        const salt = newSalt();
        users.push({
            name,
            email,
            salt,
            passwordHash: await hashPassword(password, salt),
            rocketryHistory: "",
            clubs: [],
            portfolio: ""
        });
        saveUsers(users);

        // Sign them straight in
        localStorage.setItem(SESSION_KEY, email);
        setMessage("registerMessage", "Account created. Taking you to your profile...", "success");
        setTimeout(() => (window.location.href = "Profile.html"), 600);
    });
}

function setupLogin() {
    const form = $("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!checkSecureContext("loginMessage")) return;

        const email = $("email").value.trim().toLowerCase();
        const password = $("password").value;
        const user = getUsers().find((u) => u.email === email);

        // Same message for both failures so it doesn't reveal which emails exist
        const fail = () => setMessage("loginMessage", "Email or password is incorrect.", "error");
        if (!user) return fail();

        const hash = await hashPassword(password, user.salt || "");
        if (hash !== user.passwordHash) return fail();

        localStorage.setItem(SESSION_KEY, user.email);
        setMessage("loginMessage", "Logged in. Redirecting...", "success");
        setTimeout(() => (window.location.href = "Profile.html"), 400);
    });
}

function setupProfile() {
    const form = $("profileForm");
    if (!form) return;

    const user = getCurrentUser();
    if (!user) {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "Login.html";
        return;
    }

    $("profileName").textContent = user.name;
    $("profileEmail").textContent = user.email;
    $("history").value = user.rocketryHistory || "";
    $("clubs").value = (user.clubs || []).join(", ");
    $("portfolio").value = user.portfolio || "";

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const users = getUsers();
        const i = users.findIndex((u) => u.email === user.email);
        if (i === -1) return;

        users[i].rocketryHistory = $("history").value.trim();
        users[i].clubs = $("clubs").value.split(",").map((c) => c.trim()).filter(Boolean);
        users[i].portfolio = $("portfolio").value.trim();
        saveUsers(users);
        setMessage("profileMessage", "Profile saved.", "success");
    });

    $("logoutButton").addEventListener("click", () => {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "Login.html";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateNav();
    setupRegister();
    setupLogin();
    setupProfile();
});
