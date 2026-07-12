(function () {
    if (window.__BXH_PAGE_INITIALIZED__) {
        return;
    }
    window.__BXH_PAGE_INITIALIZED__ = true;

    const BACKEND_ORIGIN = "http://localhost:5000";
    const AUTH_API_BASE_URL = `${BACKEND_ORIGIN}/api/v1/auth`;
    const LEADERBOARD_API_URL = `${BACKEND_ORIGIN}/api/v1/leaderboard/`;
    const DEFAULT_AVATAR = "../images/chim-lac-pattern.png";
    const ACTIVE_SCOPE_STORAGE_KEY = "dongsonLeaderboardActiveScope";
    const PODIUM_AVATARS = [
        "../images/TrongDongHV.jpg",
        "../images/chim-lac-pattern.png",
        "../images/TrongDong.png",
    ];

    const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
    const bodyEl = document.getElementById("leaderTableBody");
    const tableHeadRowEl = document.querySelector(".leader-table thead tr");

    const ids = {
        userScore: document.getElementById("userScore"),
        userRank: document.getElementById("userRank"),
        userBest: document.getElementById("userBest"),
        stripRank: document.getElementById("stripRank"),
        stripName: document.getElementById("stripName"),
        stripTop: document.getElementById("stripTop"),
        stripScore: document.getElementById("stripScore"),
        stripScoreLabel: document.querySelector(".my-rank-strip > div:last-child span"),

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

    const scopeLabels = {
        tong: "Tổng điểm",
        motifhunt: "Lật thẻ họa tiết",
        puzzle: "Ghép hình",
        codechayquiz: "Đúng / Sai",
    };

    const tableConfigs = {
        tong: {
            emptyColspan: 6,
            headers: ["Hạng", "Người chơi", "Lật thẻ", "Quiz", "Ghép hình", "Tổng điểm"],
            cells: (row) => [
                formatScore(row.motif_score),
                formatScore(row.quiz_score),
                formatScore(row.puzzle_score),
                formatScore(row.total_score),
            ],
        },
        motifhunt: {
            emptyColspan: 5,
            headers: ["Hạng", "Người chơi", "Điểm lật thẻ", "Combo tốt nhất", "Số giây"],
            cells: (row) => [
                formatScore(row.score),
                formatScore(row.best_streak),
                formatScore(row.duration_seconds),
            ],
        },
        puzzle: {
            emptyColspan: 5,
            headers: ["Hạng", "Người chơi", "Điểm ghép hình", "Mốc hoàn thành", "Số giây"],
            cells: (row) => [
                formatScore(row.score),
                formatScore(row.best_streak),
                formatScore(row.duration_seconds),
            ],
        },
        codechayquiz: {
            emptyColspan: 5,
            headers: ["Hạng", "Người chơi", "Điểm đúng / sai", "Chuỗi đúng", "Số giây"],
            cells: (row) => [
                formatScore(row.score),
                formatScore(row.best_streak),
                formatScore(row.duration_seconds),
            ],
        },
    };

    let activeScope = "tong";
    const leaderboardCache = new Map();
    const leaderboardRequestCache = new Map();
    const currentUserCache = new Map();

    function isValidScope(scope) {
        return Object.prototype.hasOwnProperty.call(scopeLabels, scope);
    }

    function getInitialScope() {
        const savedScope = sessionStorage.getItem(ACTIVE_SCOPE_STORAGE_KEY);
        if (isValidScope(savedScope)) {
            return savedScope;
        }

        const activeButton = document.querySelector(".tab-btn.active");
        if (activeButton && isValidScope(activeButton.dataset.tab)) {
            return activeButton.dataset.tab;
        }

        return "tong";
    }

    function setActiveButton(scope) {
        tabButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.tab === scope);
        });
    }

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

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function isLikelyImageUrl(value) {
        const avatar = String(value || "").trim();
        if (!avatar) return false;
        if (/^data:image\//i.test(avatar)) return true;
        if (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(avatar)) return true;
        if (/^https?:\/\//i.test(avatar) && avatar.includes("/")) return true;
        if (/^\.{0,2}\//.test(avatar)) return true;
        return false;
    }

    function resolveAvatarUrl(avatar, fallbackAvatar = DEFAULT_AVATAR) {
        return isLikelyImageUrl(avatar) ? avatar.trim() : fallbackAvatar;
    }

    function buildAvatarFallbackAttribute(fallbackAvatar) {
        return `this.onerror=null;this.src='${fallbackAvatar}'`;
    }

    async function fetchCurrentUser(token) {
        if (currentUserCache.has(token)) {
            return currentUserCache.get(token);
        }

        const response = await fetch(`${AUTH_API_BASE_URL}/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || "Không lấy được thông tin người dùng");
        }

        currentUserCache.set(token, data.user);
        return data.user;
    }

    function getLeaderboardCacheKey(scope, token) {
        return `${scope}::${token || "guest"}`;
    }

    async function fetchLeaderboard(scope, options = {}) {
        const { token } = getStoredAuth();
        const cacheKey = getLeaderboardCacheKey(scope, token);

        if (!options.forceRefresh && leaderboardCache.has(cacheKey)) {
            return leaderboardCache.get(cacheKey);
        }

        if (leaderboardRequestCache.has(cacheKey)) {
            return leaderboardRequestCache.get(cacheKey);
        }

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const request = fetch(`${LEADERBOARD_API_URL}?scope=${encodeURIComponent(scope)}&limit=20`, {
            headers,
            cache: "no-store",
        })
            .then(async (response) => {
                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.message || "Không lấy được bảng xếp hạng");
                }

                leaderboardCache.set(cacheKey, data);
                return data;
            })
            .finally(() => {
                leaderboardRequestCache.delete(cacheKey);
            });

        leaderboardRequestCache.set(cacheKey, request);
        return request;
    }

    function prefetchOtherScopes(currentScope) {
        Object.keys(scopeLabels)
            .filter((scope) => scope !== currentScope)
            .forEach((scope) => {
                fetchLeaderboard(scope).catch(() => {
                    // Không chặn thao tác chính nếu prefetch thất bại.
                });
            });
    }

    function buildTopPercentText(rank) {
        if (!rank) {
            return "Chưa có hạng";
        }
        return "Đã có thứ hạng trên BXH";
    }

    function buildPodiumTag(scope, index) {
        if (scope === "motifhunt") {
            return index === 0 ? "Ghi nhớ" : index === 1 ? "Nhanh mắt" : "Ổn định";
        }

        if (scope === "puzzle") {
            return index === 0 ? "Khéo léo" : index === 1 ? "Tăng tốc" : "Bền bỉ";
        }

        if (scope === "codechayquiz") {
            return index === 0 ? "Kiến thức" : index === 1 ? "Phản xạ" : "Ổn định";
        }

        return index === 0 ? "Thủ lĩnh" : index === 1 ? "Bứt tốc" : "Ổn định";
    }

    function buildPodiumNote(entry, scope) {
        if (scope === "motifhunt") {
            return `Điểm lật thẻ cao nhất: ${formatScore(entry.motif_score)}.`;
        }

        if (scope === "puzzle") {
            return `Điểm ghép hình cao nhất: ${formatScore(entry.puzzle_score)}.`;
        }

        if (scope === "codechayquiz") {
            return `Điểm đúng / sai cao nhất: ${formatScore(entry.quiz_score)}.`;
        }

        return `Tổng điểm hiện tại: ${formatScore(entry.total_score)}.`;
    }

    function localizeBestGameLabel(label) {
        const normalized = (label || "").trim().toLowerCase();

        if (normalized === "ghep hinh") return "Ghép hình";
        if (normalized === "dung / sai") return "Đúng / Sai";
        if (normalized === "lat the hoa tiet") return "Lật thẻ họa tiết";
        if (normalized === "tong diem") return "Tổng điểm";
        if (normalized === "chua co") return "Chưa có";

        return label || "Chưa có";
    }

    function renderTableHeaders(scope) {
        const config = tableConfigs[scope] || tableConfigs.tong;
        if (!tableHeadRowEl) return;

        tableHeadRowEl.innerHTML = config.headers
            .slice(0, config.emptyColspan)
            .map((header) => `<th>${header}</th>`)
            .join("");
    }

    function renderRows(rows, scope, emptyMessage = "Chưa có dữ liệu bảng xếp hạng cho mục này.") {
        const config = tableConfigs[scope] || tableConfigs.tong;
        renderTableHeaders(scope);

        if (!rows.length) {
            bodyEl.innerHTML = `
                <tr>
                    <td colspan="${config.emptyColspan}">${emptyMessage}</td>
                </tr>
            `;
            return;
        }

        bodyEl.innerHTML = rows
            .map(
                (row) => `
                <tr>
                    <td>#${row.rank}</td>
                    <td class="player-cell"><img src="${resolveAvatarUrl(row.avatar)}" alt="${escapeHtml(row.username)}" onerror="${buildAvatarFallbackAttribute(DEFAULT_AVATAR)}">${escapeHtml(row.username)}</td>
                    ${config.cells(row).map((cell, index, cells) => `<td class="${index === cells.length - 1 ? "score-col" : ""}">${cell}</td>`).join("")}
                </tr>
            `
            )
            .join("");
    }

    function setPodiumAvatar(element, avatarUrl, fallbackAvatar) {
        element.textContent = "";
        element.style.backgroundImage = `url("${resolveAvatarUrl(avatarUrl, fallbackAvatar)}")`;
    }

    function renderPodiumSlot(key, entry, scope, index) {
        if (!entry) {
            ids[`${key}Name`].textContent = "Chưa có người chơi";
            ids[`${key}Score`].textContent = "0 điểm";
            ids[`${key}Tag`].textContent = "Đang chờ";
            ids[`${key}Note`].textContent = "Hãy chơi game để tạo điểm đầu tiên.";
            setPodiumAvatar(ids[`${key}Avatar`], "", PODIUM_AVATARS[index] || DEFAULT_AVATAR);
            return;
        }

        const selectedScore = scope === "tong"
            ? entry.total_score
            : scope === "puzzle"
                ? entry.puzzle_score
                : scope === "motifhunt"
                    ? entry.motif_score
                    : entry.quiz_score;

        ids[`${key}Name`].textContent = entry.username;
        ids[`${key}Score`].textContent = `${formatScore(selectedScore)} điểm`;
        ids[`${key}Tag`].textContent = buildPodiumTag(scope, index);
        ids[`${key}Note`].textContent = buildPodiumNote(entry, scope);
        setPodiumAvatar(ids[`${key}Avatar`], entry.avatar, PODIUM_AVATARS[index] || DEFAULT_AVATAR);
    }

    function renderUserSummary(data, fallbackUser) {
        const currentUser = data.current_user;
        if (currentUser) {
            const selectedScore = data.scope === "tong"
                ? currentUser.total_score
                : currentUser.selected_score;

            ids.userScore.textContent = formatScore(selectedScore);
            ids.userRank.textContent = currentUser.rank ? `#${currentUser.rank}` : "Chưa có";
            ids.userBest.textContent = localizeBestGameLabel(currentUser.best_game);
            ids.stripRank.textContent = currentUser.rank || "-";
            ids.stripName.textContent = `Bạn (${currentUser.username})`;
            ids.stripTop.textContent = buildTopPercentText(currentUser.rank);
            ids.stripScore.textContent = formatScore(selectedScore);
            if (ids.stripScoreLabel) {
                ids.stripScoreLabel.textContent = data.scope === "tong" ? "Tổng điểm" : "Điểm tab này";
            }
            return;
        }

        if (fallbackUser) {
            ids.userScore.textContent = formatScore(fallbackUser.total_score || 0);
            ids.userRank.textContent = "Chưa có";
            ids.userBest.textContent = "Chưa có";
            ids.stripRank.textContent = "-";
            ids.stripName.textContent = `Bạn (${fallbackUser.username})`;
            ids.stripTop.textContent = "Chơi game để lên hạng";
            ids.stripScore.textContent = formatScore(fallbackUser.total_score || 0);
            if (ids.stripScoreLabel) {
                ids.stripScoreLabel.textContent = "Tổng điểm";
            }
            return;
        }

        ids.userScore.textContent = "0";
        ids.userRank.textContent = "Chưa đăng nhập";
        ids.userBest.textContent = "Chưa có";
        ids.stripRank.textContent = "-";
        ids.stripName.textContent = "Bạn";
        ids.stripTop.textContent = "Đăng nhập để đồng bộ điểm";
        ids.stripScore.textContent = "0";
        if (ids.stripScoreLabel) {
            ids.stripScoreLabel.textContent = "Tổng điểm";
        }
    }

    function renderEmptyState(scope, fallbackUser) {
        renderUserSummary({ current_user: null, entries: [], scope }, fallbackUser);
        renderPodiumSlot("first", null, scope, 0);
        renderPodiumSlot("second", null, scope, 1);
        renderPodiumSlot("third", null, scope, 2);
        renderRows([], scope, "Chưa có dữ liệu bảng xếp hạng cho mục này.");
    }

    function renderErrorPodiumSlot(key, fallbackAvatar, message) {
        ids[`${key}Name`].textContent = "Không tải được BXH";
        ids[`${key}Score`].textContent = "--";
        ids[`${key}Tag`].textContent = "Lỗi kết nối";
        ids[`${key}Note`].textContent = message;
        setPodiumAvatar(ids[`${key}Avatar`], "", fallbackAvatar);
    }

    function renderErrorState(scope, fallbackUser, error) {
        const message = error?.message || "Không kết nối được máy chủ bảng xếp hạng.";
        renderUserSummary({ current_user: null, entries: [], scope }, fallbackUser);
        ids.userRank.textContent = "Lỗi tải dữ liệu";
        ids.userBest.textContent = "Tạm thời chưa có";
        ids.stripTop.textContent = "Kiểm tra backend hoặc dữ liệu máy chủ";

        renderErrorPodiumSlot("first", PODIUM_AVATARS[0] || DEFAULT_AVATAR, message);
        renderErrorPodiumSlot("second", PODIUM_AVATARS[1] || DEFAULT_AVATAR, message);
        renderErrorPodiumSlot("third", PODIUM_AVATARS[2] || DEFAULT_AVATAR, message);
        renderRows([], scope, `Không tải được bảng xếp hạng: ${message}`);
    }

    async function render(scope) {
        if (!isValidScope(scope)) {
            scope = "tong";
        }

        activeScope = scope;
        sessionStorage.setItem(ACTIVE_SCOPE_STORAGE_KEY, scope);
        setActiveButton(scope);
        const { token, user } = getStoredAuth();

        try {
            const data = await fetchLeaderboard(scope);
            if (scope !== activeScope) return;

            if (!data.entries.length) {
                renderEmptyState(scope, user);
                return;
            }

            renderUserSummary(data, user);
            renderPodiumSlot("first", data.entries[0], scope, 0);
            renderPodiumSlot("second", data.entries[1], scope, 1);
            renderPodiumSlot("third", data.entries[2], scope, 2);
            renderRows(data.entries.slice(3), scope);
            prefetchOtherScopes(scope);
        } catch (error) {
            console.error(error);
            renderErrorState(scope, user, error);
        }

        if (!token || scope !== "tong") {
            return;
        }

        try {
            const freshUser = await fetchCurrentUser(token);
            if (scope === activeScope) {
                ids.stripName.textContent = `Bạn (${freshUser.username})`;
            }
        } catch (error) {
            // Giữ dữ liệu đã render từ leaderboard.
        }
    }

    tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
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

    tabButtons.forEach((button) => {
        const label = scopeLabels[button.dataset.tab];
        if (label) {
            button.title = label;
        }
    });

    render(getInitialScope());
    initLazyCardAnimation();
})();
