(function () {
    if (window.DongSonAuth) return;

    const TOKEN_KEY = "authToken";
    const USER_KEY = "authUser";
    const NOTICE_KEY = "authNotice";
    const originalFetch = window.fetch.bind(window);
    let hasShownExpiryNotice = false;

    function getCookie(name) {
        try {
            const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
            return match ? decodeURIComponent(match[1]) : null;
        } catch (e) {
            return null;
        }
    }

    function setCookie(name, value, days = 7) {
        try {
            const maxAge = days * 86400;
            const secure = window.location.protocol === "https:" ? "; Secure" : "";
            document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
        } catch (e) {}
    }

    function removeCookie(name) {
        try {
            document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
        } catch (e) {}
    }

    function getStoredAuth() {
        let token = null;
        let rawUser = null;
        try { token = localStorage.getItem(TOKEN_KEY); } catch (e) {}
        if (!token) { try { token = sessionStorage.getItem(TOKEN_KEY); } catch (e) {} }
        if (!token) { token = getCookie(TOKEN_KEY); }

        try { rawUser = localStorage.getItem(USER_KEY); } catch (e) {}
        if (!rawUser) { try { rawUser = sessionStorage.getItem(USER_KEY); } catch (e) {} }
        if (!rawUser) { rawUser = getCookie(USER_KEY); }

        let user = null;
        if (rawUser) {
            try { user = JSON.parse(rawUser); } catch (error) { user = null; }
        }
        return { token, user };
    }

    function saveAuth(token, user) {
        if (!token) return;
        const userStr = typeof user === "string" ? user : JSON.stringify(user || {});
        try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
        try { localStorage.setItem(USER_KEY, userStr); } catch (e) {}
        try { sessionStorage.setItem(TOKEN_KEY, token); } catch (e) {}
        try { sessionStorage.setItem(USER_KEY, userStr); } catch (e) {}
        setCookie(TOKEN_KEY, token);
        setCookie(USER_KEY, userStr);
        renderHeaderAuth();
        window.dispatchEvent(new CustomEvent("dongson:auth-changed", { detail: { token, user } }));
    }

    function clearAuth(message) {
        try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
        try { localStorage.removeItem(USER_KEY); } catch (e) {}
        try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
        try { sessionStorage.removeItem(USER_KEY); } catch (e) {}
        removeCookie(TOKEN_KEY);
        removeCookie(USER_KEY);
        if (message) {
            try { sessionStorage.setItem(NOTICE_KEY, message); } catch (e) {}
        }
        renderHeaderAuth();
        window.dispatchEvent(new CustomEvent("dongson:auth-changed", { detail: { token: null, user: null } }));
    }

    function profileHrefFor(button) {
        const href = button?.dataset.loginHref || button?.getAttribute("href") || "";
        if (href.includes("../login.html")) {
            return "../profile.html";
        }
        if (href.includes("./pages/login.html") || href.includes("pages/login.html")) {
            return "./pages/profile.html";
        }
        return "./profile.html";
    }

    function renderHeaderAuth() {
        const { token, user } = getStoredAuth();
        const isLoginPage = document.body?.dataset?.authPage === "login" || window.location.pathname.endsWith("/login.html");
        const buttons = document.querySelectorAll(".btn-login");
        buttons.forEach((button) => {
            if (!button.dataset.loginHref) {
                button.dataset.loginHref = button.getAttribute("href") || "./login.html";
            }
            if (token && user) {
                button.textContent = user.username || "Tài khoản";
                button.href = profileHrefFor(button);
                button.title = "Mở hồ sơ cá nhân (" + (user.username || "") + ")";
                button.classList.add("is-authenticated");
            } else {
                if (isLoginPage) {
                    button.textContent = "Đăng ký";
                    button.href = "./register.html";
                } else {
                    button.textContent = "Đăng nhập";
                    button.href = button.dataset.loginHref;
                }
                button.classList.remove("is-authenticated");
                button.title = isLoginPage ? "Đăng ký tài khoản mới" : "Đăng nhập";
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

    window.DongSonAuth = { getStoredAuth, saveAuth, clearAuth, renderHeaderAuth };

    function initAuth() {
        renderHeaderAuth();
        try {
            const notice = sessionStorage.getItem(NOTICE_KEY);
            if (notice) {
                sessionStorage.removeItem(NOTICE_KEY);
                showNotice(notice);
            }
        } catch (e) {}
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAuth);
    } else {
        initAuth();
    }

    window.addEventListener("storage", renderHeaderAuth);
    window.addEventListener("dongson:auth-changed", renderHeaderAuth);
})();
