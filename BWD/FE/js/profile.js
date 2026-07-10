(function () {
    const BACKEND_ORIGIN = "http://localhost:5000";
    const API_BASE_URL = `${BACKEND_ORIGIN}/api/v1/auth`;
    const DEFAULT_AVATAR = "../images/dongsonz1.jpg";
    const AVATAR_OPTIONS = [
        { value: "../images/chim-lac-pattern.png", label: "Chim Lạc" },
        { value: "../images/TrongDongHV.jpg", label: "Trống đồng hoa văn" },
        { value: "../images/TrongDong.png", label: "Trống đồng cổ" },
        { value: "../images/ngocLu.gif", label: "Trống đồng Ngọc Lũ" },
        { value: "../images/dongsonz3.jpg", label: "Họa tiết Đông Sơn" },
        { value: "../images/TD_SaoVang.jpg", label: "Biểu tượng sao vàng" },
    ];

    const els = {
        name: document.getElementById("profileName"),
        avatar: document.getElementById("profileAvatar"),
        subtitle: document.getElementById("profileSubtitle"),
        heroTotalScore: document.getElementById("heroTotalScore"),
        kpiTotalScore: document.getElementById("kpiTotalScore"),
        changeAvatarBtn: document.getElementById("changeAvatarBtn"),
        avatarPickerPanel: document.getElementById("avatarPickerPanel"),
        avatarOptionGrid: document.getElementById("avatarOptionGrid"),
        avatarPickerStatus: document.getElementById("avatarPickerStatus"),
        cancelAvatarBtn: document.getElementById("cancelAvatarBtn"),
        saveAvatarBtn: document.getElementById("saveAvatarBtn"),
        renameBtn: document.getElementById("renameBtn"),
        logoutBtn: document.getElementById("logoutBtn"),
    };

    let pendingAvatar = null;

    function getStoredAuth() {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        const rawUser = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");

        let user = null;
        if (rawUser) {
            try {
                user = JSON.parse(rawUser);
            } catch (error) {
                user = null;
            }
        }

        return { token, user };
    }

    function clearAuth() {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("authUser");
    }

    function persistUser(user) {
        const payload = JSON.stringify(user);
        if (localStorage.getItem("authUser")) {
            localStorage.setItem("authUser", payload);
        }

        if (sessionStorage.getItem("authUser")) {
            sessionStorage.setItem("authUser", payload);
        }
    }

    function formatScore(value) {
        return Number(value || 0).toLocaleString("vi-VN");
    }

    function resolveAvatar(avatar) {
        if (!avatar || avatar === "default-avatar.png") {
            return DEFAULT_AVATAR;
        }

        return avatar;
    }

    function setAvatarPickerStatus(message, isError = false) {
        if (!els.avatarPickerStatus) return;
        els.avatarPickerStatus.textContent = message || "";
        els.avatarPickerStatus.dataset.state = isError ? "error" : "default";
    }

    function renderAvatarOptions(currentAvatar) {
        if (!els.avatarOptionGrid) return;

        const resolvedAvatar = resolveAvatar(currentAvatar);
        pendingAvatar = resolvedAvatar;
        els.avatarOptionGrid.innerHTML = AVATAR_OPTIONS.map((option) => {
            const isActive = option.value === resolvedAvatar;
            return `
                <button
                    type="button"
                    class="avatar-option${isActive ? " is-active" : ""}"
                    data-avatar="${option.value}"
                    aria-pressed="${isActive ? "true" : "false"}"
                >
                    <img src="${option.value}" alt="${option.label}">
                    <span>${option.label}</span>
                </button>
            `;
        }).join("");
    }

    function updateAvatarSelectionUI(nextAvatar) {
        els.avatarOptionGrid?.querySelectorAll(".avatar-option").forEach((button) => {
            const isActive = button.dataset.avatar === nextAvatar;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
    }

    function toggleAvatarPicker(forceOpen) {
        if (!els.avatarPickerPanel) return;

        const shouldOpen = typeof forceOpen === "boolean"
            ? forceOpen
            : els.avatarPickerPanel.hasAttribute("hidden");

        if (shouldOpen) {
            const { user } = getStoredAuth();
            renderAvatarOptions(user?.avatar);
            els.avatarPickerPanel.style.display = "";
            els.avatarPickerPanel.removeAttribute("hidden");
            document.body.classList.add("avatar-picker-open");
            setAvatarPickerStatus("Chọn ảnh rồi bấm Lưu để cập nhật.");
            return;
        }

        els.avatarPickerPanel.setAttribute("hidden", "");
        els.avatarPickerPanel.style.display = "none";
        document.body.classList.remove("avatar-picker-open");
        pendingAvatar = null;
        setAvatarPickerStatus("");
    }

    function renderUser(user) {
        if (!user) return;

        const totalScore = formatScore(user.total_score || 0);
        const finalAvatar = resolveAvatar(user.avatar);

        if (els.name) els.name.textContent = user.username || "Người dùng";
        if (els.subtitle) els.subtitle.textContent = user.email || "Người khám phá Đông Sơn";
        if (els.avatar) {
            els.avatar.src = finalAvatar;
            els.avatar.onerror = () => {
                els.avatar.onerror = null;
                els.avatar.src = DEFAULT_AVATAR;
            };
        }
        if (els.heroTotalScore) els.heroTotalScore.textContent = totalScore;
        if (els.kpiTotalScore) els.kpiTotalScore.textContent = totalScore;

        renderAvatarOptions(finalAvatar);
    }

    async function fetchCurrentUser(token) {
        const response = await fetch(`${API_BASE_URL}/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || "Không lấy được thông tin người dùng");
        }

        return data.user;
    }

    async function updateProfile(token, payload) {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || "Không cập nhật được hồ sơ");
        }

        return data.user;
    }

    async function logout(token) {
        if (token) {
            try {
                await fetch(`${API_BASE_URL}/logout`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            } catch (error) {
                // Nếu server tạm thời không phản hồi, vẫn đăng xuất local.
            }
        }

        clearAuth();
        window.location.href = "./login.html";
    }

    async function hydrateProfile() {
        const { token, user } = getStoredAuth();

        if (!token) {
            window.location.href = "./login.html";
            return;
        }

        renderUser(user);

        try {
            const freshUser = await fetchCurrentUser(token);
            persistUser(freshUser);
            renderUser(freshUser);
        } catch (error) {
            clearAuth();
            window.location.href = "./login.html";
        }
    }

    els.changeAvatarBtn?.addEventListener("click", () => {
        toggleAvatarPicker(true);
    });

    els.cancelAvatarBtn?.addEventListener("click", () => {
        toggleAvatarPicker(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && els.avatarPickerPanel && !els.avatarPickerPanel.hasAttribute("hidden")) {
            toggleAvatarPicker(false);
        }
    });

    els.avatarOptionGrid?.addEventListener("click", (event) => {
        const button = event.target.closest(".avatar-option");
        if (!button) return;

        const nextAvatar = button.dataset.avatar;
        if (!nextAvatar) return;
        pendingAvatar = nextAvatar;
        updateAvatarSelectionUI(nextAvatar);
        setAvatarPickerStatus("Đã chọn ảnh mới. Bấm Lưu để áp dụng.");
    });

    els.saveAvatarBtn?.addEventListener("click", async () => {
        const { token, user } = getStoredAuth();
        if (!token || !user || !pendingAvatar) {
            window.location.href = "./login.html";
            return;
        }

        els.changeAvatarBtn.disabled = true;
        els.saveAvatarBtn.disabled = true;
        els.cancelAvatarBtn.disabled = true;
        setAvatarPickerStatus("Đang lưu ảnh đại diện...");

        try {
            const updatedUser = await updateProfile(token, { avatar: pendingAvatar });
            persistUser(updatedUser);
            renderUser(updatedUser);
            toggleAvatarPicker(false);
        } catch (error) {
            updateAvatarSelectionUI(resolveAvatar(user.avatar));
            setAvatarPickerStatus(error.message || "Không thể cập nhật ảnh đại diện.", true);
        } finally {
            els.changeAvatarBtn.disabled = false;
            els.saveAvatarBtn.disabled = false;
            els.cancelAvatarBtn.disabled = false;
        }
    });

    els.renameBtn?.addEventListener("click", async () => {
        const { token, user } = getStoredAuth();
        if (!token || !user) {
            window.location.href = "./login.html";
            return;
        }

        const next = window.prompt("Nhập tên hiển thị mới:", user.username || "");
        if (!next) return;

        const username = next.trim();
        if (!username) return;

        els.renameBtn.disabled = true;
        try {
            const updatedUser = await updateProfile(token, { username });
            persistUser(updatedUser);
            renderUser(updatedUser);
        } catch (error) {
            window.alert(error.message);
        } finally {
            els.renameBtn.disabled = false;
        }
    });

    els.logoutBtn?.addEventListener("click", async () => {
        const ok = window.confirm("Bạn chắc chắn muốn đăng xuất?");
        if (!ok) return;

        els.logoutBtn.disabled = true;
        const { token } = getStoredAuth();
        await logout(token);
    });

    hydrateProfile();
})();
