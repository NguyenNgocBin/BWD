(function () {
    const API_BASE_URL = "http://localhost:5000/api/v1/auth";
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

    async function login(email, password) {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Có lỗi xảy ra, vui lòng thử lại");
        }

        return data;
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
                const errorMessage =
                    error instanceof TypeError
                        ? "Khong ket noi duoc backend. Hay kiem tra Flask server dang chay o http://localhost:5000 va DATABASE_URL Supabase da dung."
                        : error.message;
                setMessage(errorMessage, false);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    setupPasswordToggles();
    setupSocialButtons();
    setupForm();
})();
