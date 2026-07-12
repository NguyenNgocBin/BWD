(function () {
    if (window.DongSonAuth) return;

    const TOKEN_KEY = "authToken";
    const USER_KEY = "authUser";
    const NOTICE_KEY = "authNotice";
    const originalFetch = window.fetch.bind(window);
    let hasShownExpiryNotice = false;

    function getStoredAuth() {
        const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
        const token = storage.getItem(TOKEN_KEY);
        const rawUser = storage.getItem(USER_KEY);
        let user = null;
        try {
            user = rawUser ? JSON.parse(rawUser) : null;
        } catch (error) {
            user = null;
        }
        return { token, user, storage };
    }

    function clearAuth(message) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        if (message) sessionStorage.setItem(NOTICE_KEY, message);
        window.dispatchEvent(new CustomEvent("dongson:auth-changed", { detail: { token: null, user: null } }));
    }

    function decodeTokenPayload(token) {
        try {
            const part = token.split(".")[1];
            if (!part) return null;
            const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
            const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
            return JSON.parse(decodeURIComponent(Array.from(atob(padded), (char) =>
                `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
            ).join("")));
        } catch (error) {
            return null;
        }
    }

    function isExpired(token) {
        const payload = decodeTokenPayload(token);
        return !payload || !payload.exp || payload.exp * 1000 <= Date.now();
    }

    function profileHrefFor(loginButton) {
        const loginHref = loginButton?.getAttribute("href") || "";
        return loginHref.replace(/login\.html(?:\?.*)?$/, "profile.html") || "./pages/profile.html";
    }

    function renderHeaderAuth() {
        const { token, user } = getStoredAuth();
        const buttons = document.querySelectorAll(".btn-login");
        buttons.forEach((button) => {
            if (!button.dataset.loginHref) {
                button.dataset.loginHref = button.getAttribute("href") || "./login.html";
            }
            if (token && user) {
                button.textContent = user.username || "Tài khoản";
                button.href = profileHrefFor(button);
                button.title = "Mở hồ sơ cá nhân";
                button.classList.add("is-authenticated");
            } else {
                button.textContent = "Đăng nhập";
                button.href = button.dataset.loginHref;
                button.classList.remove("is-authenticated");
                button.title = "Đăng nhập";
            }
        });
    }

    function showNotice(message) {
        if (!message || hasShownExpiryNotice) return;
        hasShownExpiryNotice = true;
        const notice = document.createElement("div");
        notice.textContent = message;
        notice.setAttribute("role", "status");
        Object.assign(notice.style, {
            position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)",
            zIndex: "10000", padding: "12px 18px", borderRadius: "10px",
            background: "#7a2e1d", color: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,.25)"
        });
        document.body.appendChild(notice);
        window.setTimeout(() => notice.remove(), 5000);
    }

    function expireSession(message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.") {
        clearAuth(message);
        renderHeaderAuth();
        showNotice(message);
    }

    function validateSession() {
        const { token } = getStoredAuth();
        if (token && isExpired(token)) expireSession();
        renderHeaderAuth();
    }

    window.fetch = async function (...args) {
        const response = await originalFetch(...args);
        if (response.status === 401 && getStoredAuth().token) {
            const data = await response.clone().json().catch(() => ({}));
            expireSession(data.message || "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.");
        }
        return response;
    };

    window.DongSonAuth = { getStoredAuth, clearAuth, validateSession, renderHeaderAuth };
    document.addEventListener("DOMContentLoaded", () => {
        validateSession();
        const notice = sessionStorage.getItem(NOTICE_KEY);
        if (notice) {
            sessionStorage.removeItem(NOTICE_KEY);
            showNotice(notice);
        }
    });
    window.addEventListener("storage", validateSession);
    window.addEventListener("dongson:auth-changed", renderHeaderAuth);
    window.setInterval(validateSession, 60000);
})();
