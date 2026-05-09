(function () {
    const API_BASE_URL = "http://localhost:5000/api/v1/auth";
    const track = document.getElementById("gamesTrack");
    const controls = document.querySelectorAll(".slide-btn");
    const heroName = document.getElementById("gameHeroName");
    const heroScore = document.getElementById("gameHeroScore");

    // Lay token va user dang luu sau khi dang nhap.
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

    // Doi diem so thanh chuoi hien thi.
    function formatScore(value) {
        return Number(value || 0).toLocaleString("vi-VN");
    }

    // Chi thay ten va diem hien tai vi BE da co user va total_score.
    function renderHeroUser(user) {
        if (!user) return;
        if (heroName) heroName.textContent = user.username || "Người chơi";
        if (heroScore) heroScore.textContent = formatScore(user.total_score || 0);
    }

    // Lay user moi nhat tu backend neu co token.
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
            // Neu backend chua phan hoi, giu dataset gia dang hien thi.
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
