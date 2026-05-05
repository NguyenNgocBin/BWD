(function () {
    const API_BASE_URL = "http://localhost:5000/api/v1/auth";
    const form = document.getElementById("registerForm");
    const message = document.getElementById("registerMessage");
    const passwordInput = document.getElementById("registerPassword");
    const strength = document.getElementById("passwordStrength");

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

    function getPasswordStrength(password) {
        let score = 0;

        if (password.length >= 6) score += 1;
        if (password.length >= 10) score += 1;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        if (!password) {
            return { className: "", label: "Nhập mật khẩu để kiểm tra độ mạnh" };
        }

        if (score <= 2) {
            return { className: "is-weak", label: "Yếu" };
        }

        if (score <= 4) {
            return { className: "is-medium", label: "Trung bình" };
        }

        return { className: "is-strong", label: "Mạnh" };
    }

    function setupPasswordStrength() {
        const strengthText = strength?.querySelector(".strength-text");

        if (!passwordInput || !strength || !strengthText) return;

        passwordInput.addEventListener("input", () => {
            const result = getPasswordStrength(passwordInput.value);
            strength.classList.remove("is-weak", "is-medium", "is-strong");

            if (result.className) {
                strength.classList.add(result.className);
            }

            strengthText.textContent = result.label;
        });
    }

    async function register(payload) {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
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

            const username = form.username.value.trim();
            const email = form.email.value.trim().toLowerCase();
            const password = form.password.value;
            const confirmPassword = form.confirm_password.value;
            let isValid = true;

            if (!username) {
                setFieldError("username", "Vui lòng nhập tên người dùng");
                isValid = false;
            }

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
            } else if (password.length < 6) {
                setFieldError("password", "Mật khẩu phải có ít nhất 6 ký tự");
                isValid = false;
            }

            if (!confirmPassword) {
                setFieldError("confirm_password", "Vui lòng xác nhận mật khẩu");
                isValid = false;
            } else if (password !== confirmPassword) {
                setFieldError("confirm_password", "Mật khẩu xác nhận không khớp");
                isValid = false;
            }

            if (!isValid) return;

            const submitButton = form.querySelector(".auth-button");
            submitButton.disabled = true;

            try {
                await register({ username, email, password });
                setMessage("Đăng ký thành công, chuyển sang đăng nhập", true);
                window.setTimeout(() => {
                    window.location.href = "./login.html";
                }, 900);
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
    setupPasswordStrength();
    setupForm();
})();
