(function () {
    const BACKEND_ORIGIN =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? "http://localhost:5001"
            : "https://bwd-backend.vercel.app";
    const API_BASE_URL = `${BACKEND_ORIGIN}/api/v1/auth`;
    const track = document.getElementById("gamesTrack");
    const controls = document.querySelectorAll(".slide-btn");
    const heroName = document.getElementById("gameHeroName");
    const heroScore = document.getElementById("gameHeroScore");
    const gameCards = Array.from(document.querySelectorAll(".game-card[data-game-status]"));

    // Lấy token và user đang lưu sau khi đăng nhập.
    function getStoredAuth() {
        if (window.DongSonAuth?.getStoredAuth) {
            return window.DongSonAuth.getStoredAuth();
        }
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

    // Đổi điểm số thành chuỗi hiển thị.
    function formatScore(value) {
        return Number(value || 0).toLocaleString("vi-VN");
    }

    // Chỉ thay tên và điểm hiện tại vì BE đã có user và total_score.
    function renderHeroUser(user) {
        if (heroName) heroName.textContent = user?.username || "Khách tham quan";
        if (heroScore) heroScore.textContent = formatScore(user?.total_score || 0);
    }

    function renderGameStatuses() {
        const { token } = getStoredAuth();
        gameCards.forEach((card) => {
            const status = card.dataset.gameStatus;
            const label = card.querySelector("[data-status-label]");
            const button = card.querySelector(".card-btn");
            if (!label) return;

            if (status === "development") {
                label.textContent = "Đang phát triển";
                label.dataset.state = "development";
                if (button) {
                    button.textContent = "Sắp ra mắt";
                    button.setAttribute("aria-disabled", "true");
                    button.removeAttribute("href");
                }
                return;
            }

            label.textContent = token ? "Đã sẵn sàng" : "Cần đăng nhập để lưu điểm";
            label.dataset.state = token ? "ready" : "login-required";
        });
    }

    // Lấy user mới nhất từ backend nếu có token.
    async function hydrateHeroUser() {
        const { token, user } = getStoredAuth();
        renderHeroUser(user);

        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                renderHeroUser(data.user);
            }
        } catch (error) {
            // Nếu backend chưa phản hồi, giữ dataset giả đang hiển thị.
        }
    }

    hydrateHeroUser();
    renderGameStatuses();
    window.addEventListener("dongson:auth-changed", () => {
        const { user } = getStoredAuth();
        renderHeroUser(user);
        renderGameStatuses();
    });

    if (!track || !controls.length) return;

    const getStep = () => Math.max(track.clientWidth * 0.85, 260);

    controls.forEach((button) => {
        button.addEventListener("click", () => {
            const dir = button.dataset.dir === "next" ? 1 : -1;
            track.scrollBy({
                left: getStep() * dir,
                behavior: "smooth",
            });
        });
    });
})();
