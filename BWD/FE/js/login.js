(function () {
    const BACKEND_ORIGIN = "https://bwd-d6e2.vercel.app";
    const API_BASE_URL = `${BACKEND_ORIGIN}/api/v1/auth`;
    const REQUEST_TIMEOUT_MS = 8000;
    const BACKEND_UNAVAILABLE_MESSAGE = `Không kết nối được backend. Hãy chạy Flask server ở ${BACKEND_ORIGIN} rồi thử lại.`;
    const form = document.getElementById("loginForm");
    const message = document.getElementById("loginMessage");

    function setMessage(text, isSuccess) {
        if (!message) return;
        message.textContent = text || "";
        message.classList.toggle("is-success", Boolean(isSuccess));
    }

    function setFieldError(fieldName, text) {
        const field = form?.elements[fieldName];
        const error = form?.querySelector(`[data-error-for="${fieldName}"]`);

        if (field) {
            field.classList.toggle("is-invalid", Boolean(text));
        }

        if (error) {
            error.textContent = text || "";
        }
    }

    function clearErrors() {
        form.querySelectorAll(".auth-input").forEach((input) => {
            input.classList.remove("is-invalid");
        });

        form.querySelectorAll(".field-error").forEach((error) => {
            error.textContent = "";
        });
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function setupPasswordToggles() {
        document.querySelectorAll("[data-toggle-password]").forEach((button) => {
            button.addEventListener("click", () => {
                const input = document.getElementById(button.dataset.togglePassword);
                const icon = button.querySelector(".material-symbols-outlined");

                if (!input) return;

                const shouldShow = input.type === "password";
                input.type = shouldShow ? "text" : "password";
                button.setAttribute("aria-label", shouldShow ? "Ẩn mật khẩu" : "Hiện mật khẩu");

                if (icon) {
                    icon.textContent = shouldShow ? "visibility_off" : "visibility";
                }
            });
        });
    }

    function setupSocialButtons() {
        document.querySelectorAll("[data-social]").forEach((button) => {
            button.addEventListener("click", () => {
                setMessage(`${button.dataset.social} chưa được cấu hình ở BE`, false);
            });
        });
    }

    async function requestJson(url, options) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        let response;
        try {
            response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
        } catch (error) {
            throw new Error(BACKEND_UNAVAILABLE_MESSAGE);
        } finally {
            window.clearTimeout(timeoutId);
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (response.status >= 500) {
                throw new Error(
                    data.error
                        ? `Backend đang lỗi server: ${data.error}`
                        : "Backend đang lỗi server. Kiểm tra terminal Flask, DATABASE_URL và JWT_SECRET."
                );
            }

            throw new Error(data.message || "Có lỗi xảy ra, vui lòng thử lại");
        }

        return data;
    }

    async function login(email, password) {
        return requestJson(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
    }

    function setupForm() {
        if (!form) return;

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearErrors();
            setMessage("");

            const email = form.email.value.trim().toLowerCase();
            const password = form.password.value;
            let isValid = true;

            if (!email) {
                setFieldError("email", "Vui lòng nhập email");
                isValid = false;
            } else if (!isValidEmail(email)) {
                setFieldError("email", "Email không hợp lệ");
                isValid = false;
            }

            if (!password) {
                setFieldError("password", "Vui lòng nhập mật khẩu");
                isValid = false;
            }

            if (!isValid) return;

            const submitButton = form.querySelector(".auth-button");
            submitButton.disabled = true;

            try {
                const data = await login(email, password);
                const storage = form.remember.checked ? localStorage : sessionStorage;
                localStorage.removeItem("authToken");
                localStorage.removeItem("authUser");
                sessionStorage.removeItem("authToken");
                sessionStorage.removeItem("authUser");
                storage.setItem("authToken", data.token);
                storage.setItem("authUser", JSON.stringify(data.user));
                setMessage("Đăng nhập thành công", true);
                window.location.href = "./profile.html";
            } catch (error) {
                setMessage(error.message || "Không đăng nhập được, vui lòng thử lại", false);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    setupPasswordToggles();
    setupSocialButtons();
    setupForm();
})();
