(function () {
    const API_BASE_URL = "https://bwd-d6e2.vercel.app/api/v1/auth";
    const track = document.getElementById("gamesTrack");
    const controls = document.querySelectorAll(".slide-btn");
    const heroName = document.getElementById("gameHeroName");
    const heroScore = document.getElementById("gameHeroScore");

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

    // Đổi điểm số thành chuỗi hiển thị.
    function formatScore(value) {
        return Number(value || 0).toLocaleString("vi-VN");
    }

    // Chỉ thay tên và điểm hiện tại vì BE đã có user và total_score.
    function renderHeroUser(user) {
        if (!user) return;
        if (heroName) heroName.textContent = user.username || "Người chơi";
        if (heroScore) heroScore.textContent = formatScore(user.total_score || 0);
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
