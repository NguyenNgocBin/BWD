(function () {
    const API_BASE_URL = "https://bwd-d6e2.vercel.app/api/v1/auth";
    const DATA = {
        tong: {
            user: { score: "12,450", rank: "#42", best: "Tìm h?a ti?t", top: "Top 5% ngu?i choi" },
            top3: [
                { name: "Huy?n My", score: "18.940 di?m", tag: "Gi? phong d?", note: "D?n d?u nh? t?c d? tr? l?i và d? chính xác cao.", avatar: "../images/dongsonz3.jpg" },
                { name: "Quang Minh", score: "17.520 di?m", tag: "B?t t?c", note: "Chu?i 9 lu?t chính xác liên ti?p.", avatar: "../images/dongsonz2.png" },
                { name: "Gia B?o", score: "16.880 di?m", tag: "?n d?nh", note: "Ði?m s? d?u ? c? ba nhóm trò choi.", avatar: "../images/dongsonz4.png" },
            ],
            rows: [
                { rank: "#4", name: "Hoàng Nam", pattern: "4,200", puzzle: "5,100", total: "12,100", avatar: "../images/dongsonz1.jpg" },
                { rank: "#5", name: "Thanh Hà", pattern: "3,850", puzzle: "5,900", total: "11,950", avatar: "../images/dongsonz2.png" },
                { rank: "#6", name: "Ð?c Duy", pattern: "4,500", puzzle: "4,200", total: "10,800", avatar: "../images/dongsonz4.png" },
            ],
        },
        hoatiet: {
            user: { score: "5,320", rank: "#18", best: "Tìm h?a ti?t", top: "Top 3% ngu?i choi" },
            top3: [
                { name: "B?o Trân", score: "7.180 di?m", tag: "Tinh m?t", note: "Nh?n di?n dúng các h?a ti?t khó nh?t.", avatar: "../images/dongsonz4.png" },
                { name: "Huy?n My", score: "6.990 di?m", tag: "S?c nét", note: "Gi? nh?p tr? l?i nhanh qua nhi?u vòng.", avatar: "../images/dongsonz3.jpg" },
                { name: "Qu?c An", score: "6.620 di?m", tag: "Quan sát", note: "Ði?m thu?ng cao t? các lu?t không sai.", avatar: "../images/TrongDongHV.jpg" },
            ],
            rows: [
                { rank: "#4", name: "Ng?c Nhi", pattern: "6,200", puzzle: "3,900", total: "10,100", avatar: "../images/dongsonz1.jpg" },
                { rank: "#5", name: "H?i Ðang", pattern: "5,980", puzzle: "3,800", total: "9,780", avatar: "../images/dongsonz2.png" },
                { rank: "#6", name: "Minh Khôi", pattern: "5,700", puzzle: "3,650", total: "9,350", avatar: "../images/dongsonz3.jpg" },
            ],
        },
        ghephinh: {
            user: { score: "4,980", rank: "#25", best: "Ghép hình", top: "Top 8% ngu?i choi" },
            top3: [
                { name: "Quang Minh", score: "8.220 di?m", tag: "T?c d? cao", note: "Hoàn thành m?nh ghép v?i th?i gian ng?n nh?t.", avatar: "../images/dongsonz2.png" },
                { name: "Ð?c Duy", score: "7.900 di?m", tag: "B?n b?", note: "Gi? chu?i hoàn thành ?n d?nh trong tu?n.", avatar: "../images/dongsonz4.png" },
                { name: "M? Linh", score: "7.440 di?m", tag: "Khéo léo", note: "Sai s? th?p ? các màn ghép hình l?n.", avatar: "../images/TrongDong.png" },
            ],
            rows: [
                { rank: "#4", name: "Gia Hân", pattern: "4,100", puzzle: "7,000", total: "11,100", avatar: "../images/dongsonz1.jpg" },
                { rank: "#5", name: "Tr?ng Khang", pattern: "3,600", puzzle: "6,900", total: "10,500", avatar: "../images/dongsonz3.jpg" },
                { rank: "#6", name: "Kim Sa", pattern: "3,950", puzzle: "6,200", total: "10,150", avatar: "../images/TrongDongHV.jpg" },
            ],
        },
        dungsai: {
            user: { score: "2,150", rank: "#33", best: "Ðúng / Sai", top: "Top 12% ngu?i choi" },
            top3: [
                { name: "Gia B?o", score: "5.910 di?m", tag: "Ph?n x?", note: "B?m dáp án nhanh nhung v?n gi? d? chính xác.", avatar: "../images/dongsonz4.png" },
                { name: "Hà Vy", score: "5.700 di?m", tag: "Ki?n th?c", note: "N?i b?t ? các câu h?i van hóa Ðông Son.", avatar: "../images/dongsonz1.jpg" },
                { name: "Hoàng Nam", score: "5.330 di?m", tag: "Ch?c tay", note: "Ít m?c l?i ? các lu?t quy?t d?nh.", avatar: "../images/TrongDongHV.jpg" },
            ],
            rows: [
                { rank: "#4", name: "Lê Anh", pattern: "3,900", puzzle: "4,900", total: "8,800", avatar: "../images/dongsonz2.png" },
                { rank: "#5", name: "Ngân Hà", pattern: "3,750", puzzle: "4,550", total: "8,300", avatar: "../images/dongsonz3.jpg" },
                { rank: "#6", name: "Tùng Lâm", pattern: "3,680", puzzle: "4,300", total: "7,980", avatar: "../images/TrongDong.png" },
            ],
        },
    };

    const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
    const bodyEl = document.getElementById("leaderTableBody");

    const ids = {
        userScore: document.getElementById("userScore"),
        userRank: document.getElementById("userRank"),
        userBest: document.getElementById("userBest"),
        stripRank: document.getElementById("stripRank"),
        stripName: document.getElementById("stripName"),
        stripTop: document.getElementById("stripTop"),
        stripScore: document.getElementById("stripScore"),

        firstName: document.getElementById("firstName"),
        firstScore: document.getElementById("firstScore"),
        firstTag: document.getElementById("firstTag"),
        firstNote: document.getElementById("firstNote"),
        firstAvatar: document.getElementById("firstAvatar"),

        secondName: document.getElementById("secondName"),
        secondScore: document.getElementById("secondScore"),
        secondTag: document.getElementById("secondTag"),
        secondNote: document.getElementById("secondNote"),
        secondAvatar: document.getElementById("secondAvatar"),

        thirdName: document.getElementById("thirdName"),
        thirdScore: document.getElementById("thirdScore"),
        thirdTag: document.getElementById("thirdTag"),
        thirdNote: document.getElementById("thirdNote"),
        thirdAvatar: document.getElementById("thirdAvatar"),
    };

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

    function formatScore(value) {
        return Number(value || 0).toLocaleString("vi-VN");
    }

    function getInitials(name) {
        return name
            .trim()
            .split(/\s+/)
            .slice(-2)
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase();
    }

    async function fetchCurrentUser(token) {
        const response = await fetch(`${API_BASE_URL}/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || "Khong lay duoc thong tin nguoi dung");
        }

        return data.user;
    }

    async function hydrateCurrentUserForTotalTab() {
        const { token, user } = getStoredAuth();

        if (user) {
            const score = formatScore(user.total_score || 0);
            ids.userScore.textContent = score;
            ids.stripName.textContent = `B?n (${user.username})`;
            ids.stripScore.textContent = score;
        }

        if (!token) return;

        try {
            const freshUser = await fetchCurrentUser(token);
            const score = formatScore(freshUser.total_score || 0);
            ids.userScore.textContent = score;
            ids.stripName.textContent = `B?n (${freshUser.username})`;
            ids.stripScore.textContent = score;
        } catch (error) {
            // N?u backend chua ph?n h?i, gi? dataset gi? dang hi?n th?.
        }
    }

    function renderRows(rows) {
        bodyEl.innerHTML = rows
            .map(
                (row) => `
                <tr>
                    <td>${row.rank}</td>
                    <td class="player-cell"><img src="${row.avatar}" alt="${row.name}">${row.name}</td>
                    <td>${row.pattern}</td>
                    <td>${row.puzzle}</td>
                    <td class="score-col">${row.total}</td>
                </tr>
            `
            )
            .join("");
    }

    function render(tabKey) {
        const data = DATA[tabKey];
        if (!data) return;

        ids.userScore.textContent = data.user.score;
        ids.userRank.textContent = data.user.rank;
        ids.userBest.textContent = data.user.best;

        ids.stripRank.textContent = data.user.rank.replace("#", "");
        ids.stripTop.textContent = data.user.top;
        ids.stripScore.textContent = data.user.score;

        ids.firstName.textContent = data.top3[0].name;
        ids.firstScore.textContent = data.top3[0].score;
        ids.firstTag.textContent = data.top3[0].tag;
        ids.firstNote.textContent = data.top3[0].note;
        ids.firstAvatar.textContent = getInitials(data.top3[0].name);

        ids.secondName.textContent = data.top3[1].name;
        ids.secondScore.textContent = data.top3[1].score;
        ids.secondTag.textContent = data.top3[1].tag;
        ids.secondNote.textContent = data.top3[1].note;
        ids.secondAvatar.textContent = getInitials(data.top3[1].name);

        ids.thirdName.textContent = data.top3[2].name;
        ids.thirdScore.textContent = data.top3[2].score;
        ids.thirdTag.textContent = data.top3[2].tag;
        ids.thirdNote.textContent = data.top3[2].note;
        ids.thirdAvatar.textContent = getInitials(data.top3[2].name);

        renderRows(data.rows);

        if (tabKey === "tong") {
            hydrateCurrentUserForTotalTab();
        }
    }

    tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            tabButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            render(btn.dataset.tab);
        });
    });

    function initLazyCardAnimation() {
        const cards = Array.from(document.querySelectorAll(".lazy-card"));
        if (!cards.length) return;

        if (!("IntersectionObserver" in window)) {
            cards.forEach((card) => card.classList.add("is-visible"));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.22, rootMargin: "0px 0px -40px" }
        );

        cards.forEach((card) => observer.observe(card));
    }

    render("tong");
    initLazyCardAnimation();
})();
