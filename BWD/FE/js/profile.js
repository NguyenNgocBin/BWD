(function () {
    const BACKEND_ORIGIN = "https://bwd-d6e2.vercel.app";
    const API_BASE_URL = `${BACKEND_ORIGIN}/api/v1/auth`;
    const DEFAULT_AVATAR = "../images/dongsonz1.jpg";

    const els = {
        name: document.getElementById("profileName"),
        avatar: document.getElementById("profileAvatar"),
        subtitle: document.getElementById("profileSubtitle"),
        heroTotalScore: document.getElementById("heroTotalScore"),
        kpiTotalScore: document.getElementById("kpiTotalScore"),
        renameBtn: document.getElementById("renameBtn"),
        logoutBtn: document.getElementById("logoutBtn"),
    };

    // Lấy token và user đang lưu sau khi đăng nhập.
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

    // Xóa thông tin đăng nhập đã lưu ở trình duyệt.
    function clearAuth() {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("authUser");
    }

    // Lưu user mới nhất vào nơi đang chứa authUser.
    function persistUser(user) {
        const payload = JSON.stringify(user);
        if (localStorage.getItem("authUser")) {
            localStorage.setItem("authUser", payload);
        }

        if (sessionStorage.getItem("authUser")) {
            sessionStorage.setItem("authUser", payload);
        }
    }

    // Đổi điểm số thành chuỗi để hiển thị.
    function formatScore(value) {
        return Number(value || 0).toLocaleString("vi-VN");
    }

    // Chỉ cập nhật những trường BE đã có dữ liệu thật: tên, email, avatar, total_score.
    function renderUser(user) {
        if (!user) return;

        const totalScore = formatScore(user.total_score || 0);
        if (els.name) els.name.textContent = user.username || "Người dùng";
        if (els.subtitle) els.subtitle.textContent = user.email || "Người khám phá Đông Sơn";
        if (els.avatar) els.avatar.src = user.avatar || DEFAULT_AVATAR;
        if (els.heroTotalScore) els.heroTotalScore.textContent = totalScore;
        if (els.kpiTotalScore) els.kpiTotalScore.textContent = totalScore;
    }

    // Gọi API /me để lấy user mới nhất từ backend.
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

    // Gọi API /profile để cập nhật username thật trong database.
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

    // Gọi logout backend rồi xóa auth local.
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

    // Nạp profile: dùng local trước, sau đó đồng bộ lại với backend.
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
