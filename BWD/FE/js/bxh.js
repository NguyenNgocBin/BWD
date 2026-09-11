(function () {
    if (window.__BXH_PAGE_INITIALIZED__) {
        return;
    }
    window.__BXH_PAGE_INITIALIZED__ = true;

    const BACKEND_ORIGIN = "http://localhost:5001";
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
    const periodFilterEl = document.getElementById("periodFilter");
    const groupFilterEl = document.getElementById("groupFilter");
    const applyFilterBtn = document.getElementById("applyLeaderboardFilter");

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
    let activePeriod = "all";
    let activeGroup = "";
    const leaderboardCache = new Map();
    const leaderboardRequestCache = new Map();
    const currentUserCache = new Map();

    const MOCK_PLAYERS_RAW = [
        {
            username: "Huyền My",
            avatar: "../images/TrongDongHV.jpg",
            total_score: 18940,
            quiz_score: 6200,
            puzzle_score: 7940,
            motif_score: 4800,
            quiz_best_streak: 18,
            puzzle_best_streak: 15,
            motif_best_streak: 12,
            quiz_duration_seconds: 35,
            puzzle_duration_seconds: 65,
            motif_duration_seconds: 42,
            badges: [{ icon: "🏆", title: "Thủ lĩnh tuần" }],
        },
        {
            username: "Quang Minh",
            avatar: "../images/chim-lac-pattern.png",
            total_score: 17520,
            quiz_score: 5800,
            puzzle_score: 7220,
            motif_score: 4500,
            quiz_best_streak: 15,
            puzzle_best_streak: 12,
            motif_best_streak: 10,
            quiz_duration_seconds: 39,
            puzzle_duration_seconds: 72,
            motif_duration_seconds: 48,
            badges: [{ icon: "⚡", title: "Bứt tốc" }],
        },
        {
            username: "Gia Bảo",
            avatar: "../images/TrongDong.png",
            total_score: 16880,
            quiz_score: 5500,
            puzzle_score: 7180,
            motif_score: 4200,
            quiz_best_streak: 13,
            puzzle_best_streak: 10,
            motif_best_streak: 9,
            quiz_duration_seconds: 44,
            puzzle_duration_seconds: 78,
            motif_duration_seconds: 52,
            badges: [{ icon: "🛡️", title: "Ổn định" }],
        },
        {
            username: "Hoàng Nam",
            avatar: "../images/dongsonz1.jpg",
            total_score: 15900,
            quiz_score: 5100,
            puzzle_score: 6800,
            motif_score: 4000,
            quiz_best_streak: 11,
            puzzle_best_streak: 9,
            motif_best_streak: 8,
            quiz_duration_seconds: 48,
            puzzle_duration_seconds: 84,
            motif_duration_seconds: 56,
            badges: [{ icon: "🎯", title: "Chiến binh" }],
        },
        {
            username: "Thanh Hà",
            avatar: "../images/TD_Cam_Giang.jpg",
            total_score: 15200,
            quiz_score: 4900,
            puzzle_score: 6500,
            motif_score: 3800,
            quiz_best_streak: 10,
            puzzle_best_streak: 8,
            motif_best_streak: 7,
            quiz_duration_seconds: 52,
            puzzle_duration_seconds: 90,
            motif_duration_seconds: 60,
            badges: [{ icon: "🌟", title: "Tiềm năng" }],
        },
        {
            username: "Minh Khôi",
            avatar: "../images/TD_Huu_Chung.png",
            total_score: 14400,
            quiz_score: 4600,
            puzzle_score: 6200,
            motif_score: 3600,
            quiz_best_streak: 9,
            puzzle_best_streak: 7,
            motif_best_streak: 6,
            quiz_duration_seconds: 56,
            puzzle_duration_seconds: 96,
            motif_duration_seconds: 64,
            badges: [],
        },
        {
            username: "Lan Anh",
            avatar: "../images/chim-lac-pattern.png",
            total_score: 13600,
            quiz_score: 4300,
            puzzle_score: 5900,
            motif_score: 3400,
            quiz_best_streak: 8,
            puzzle_best_streak: 7,
            motif_best_streak: 6,
            quiz_duration_seconds: 60,
            puzzle_duration_seconds: 102,
            motif_duration_seconds: 68,
            badges: [],
        },
        {
            username: "Quốc Tuấn",
            avatar: "../images/TD_SaoVang.jpg",
            total_score: 13000,
            quiz_score: 4100,
            puzzle_score: 5700,
            motif_score: 3200,
            quiz_best_streak: 7,
            puzzle_best_streak: 6,
            motif_best_streak: 5,
            quiz_duration_seconds: 65,
            puzzle_duration_seconds: 110,
            motif_duration_seconds: 72,
            badges: [],
        },
        {
            username: "Thục Quyên",
            avatar: "../images/coloa.png",
            total_score: 12300,
            quiz_score: 3900,
            puzzle_score: 5400,
            motif_score: 3000,
            quiz_best_streak: 6,
            puzzle_best_streak: 5,
            motif_best_streak: 5,
            quiz_duration_seconds: 70,
            puzzle_duration_seconds: 115,
            motif_duration_seconds: 75,
            badges: [],
        },
        {
            username: "Đức Trọng",
            avatar: "../images/hoangha.png",
            total_score: 11600,
            quiz_score: 3700,
            puzzle_score: 5100,
            motif_score: 2800,
            quiz_best_streak: 5,
            puzzle_best_streak: 5,
            motif_best_streak: 4,
            quiz_duration_seconds: 75,
            puzzle_duration_seconds: 120,
            motif_duration_seconds: 80,
            badges: [],
        },
    ];

    function getMockLeaderboardData(scope, user) {
        let sortedList = [];
        if (scope === "tong") {
            sortedList = [...MOCK_PLAYERS_RAW].sort((a, b) => b.total_score - a.total_score);
        } else if (scope === "motifhunt") {
            sortedList = [...MOCK_PLAYERS_RAW].sort((a, b) => b.motif_score - a.motif_score);
        } else if (scope === "puzzle") {
            sortedList = [...MOCK_PLAYERS_RAW].sort((a, b) => b.puzzle_score - a.puzzle_score);
        } else if (scope === "codechayquiz") {
            sortedList = [...MOCK_PLAYERS_RAW].sort((a, b) => b.quiz_score - a.quiz_score);
        } else {
            sortedList = [...MOCK_PLAYERS_RAW];
        }

        const entries = sortedList.map((item, index) => {
            const rank = index + 1;
            const entry = {
                rank,
                username: item.username,
                avatar: item.avatar,
                badges: item.badges || [],
                total_score: item.total_score,
                quiz_score: item.quiz_score,
                puzzle_score: item.puzzle_score,
                motif_score: item.motif_score,
            };

            if (scope === "tong") {
                entry.selected_score = item.total_score;
            } else if (scope === "motifhunt") {
                entry.score = item.motif_score;
                entry.selected_score = item.motif_score;
                entry.best_streak = item.motif_best_streak;
                entry.duration_seconds = item.motif_duration_seconds;
            } else if (scope === "puzzle") {
                entry.score = item.puzzle_score;
                entry.selected_score = item.puzzle_score;
                entry.best_streak = item.puzzle_best_streak;
                entry.duration_seconds = item.puzzle_duration_seconds;
            } else if (scope === "codechayquiz") {
                entry.score = item.quiz_score;
                entry.selected_score = item.quiz_score;
                entry.best_streak = item.quiz_best_streak;
                entry.duration_seconds = item.quiz_duration_seconds;
            }
            return entry;
        });

        let current_user = null;
        if (user) {
            const uTotal = user.total_score || 8650;
            current_user = {
                user_id: user.id || "current_user",
                username: user.username || "Bạn",
                avatar: user.avatar || DEFAULT_AVATAR,
                rank: 12,
                total_score: uTotal,
                quiz_score: 3200,
                puzzle_score: 3450,
                motif_score: 2000,
                best_streak: 7,
                duration_seconds: 55,
                best_game: "Ghép hình",
                selected_score: scope === "tong" ? uTotal : (scope === "puzzle" ? 3450 : (scope === "motifhunt" ? 2000 : 3200)),
            };
        }

        return {
            scope,
            entries,
            current_user,
        };
    }

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
        return `${scope}::${activePeriod}::${activeGroup}::${token || "guest"}`;
    }

    async function fetchLeaderboard(scope, options = {}) {
        const { token, user } = getStoredAuth();
        const cacheKey = getLeaderboardCacheKey(scope, token);

        if (!options.forceRefresh && leaderboardCache.has(cacheKey)) {
            return leaderboardCache.get(cacheKey);
        }

        if (leaderboardRequestCache.has(cacheKey)) {
            return leaderboardRequestCache.get(cacheKey);
        }

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const params = new URLSearchParams({ scope, limit: "20", period: activePeriod });
        if (activeGroup) params.set("group", activeGroup);
        const request = fetch(`${LEADERBOARD_API_URL}?${params.toString()}`, {
            headers,
            cache: "no-store",
        })
            .then(async (response) => {
                const data = await response.json().catch(() => ({}));

                if (!response.ok || !Array.isArray(data.entries) || !data.entries.length) {
                    console.warn(`[BXH] API không trả về entries hợp lệ cho scope=${scope}, dùng mock data.`);
                    return getMockLeaderboardData(scope, user);
                }

                leaderboardCache.set(cacheKey, data);
                return data;
            })
            .catch((err) => {
                console.warn(`[BXH] Kết nối thất bại (${err.message}), dùng mock data cho scope=${scope}.`);
                return getMockLeaderboardData(scope, user);
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
                    <td class="player-cell"><img src="${resolveAvatarUrl(row.avatar)}" alt="${escapeHtml(row.username)}" onerror="${buildAvatarFallbackAttribute(DEFAULT_AVATAR)}"><span>${escapeHtml(row.username)}${renderBadges(row.badges)}</span></td>
                    ${config.cells(row).map((cell, index, cells) => `<td class="${index === cells.length - 1 ? "score-col" : ""}">${cell}</td>`).join("")}
                </tr>
            `
            )
            .join("");
    }

    function renderBadges(badges) {
        if (!Array.isArray(badges) || !badges.length) return "";
        return `<span class="leader-badges">${badges.map((badge) => `<span class="leader-badge" title="${escapeHtml(badge.title)}">${escapeHtml(badge.icon)} ${escapeHtml(badge.title)}</span>`).join("")}</span>`;
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
        if (entry.badges?.length) {
            ids[`${key}Tag`].textContent = `${entry.badges[0].icon} ${entry.badges[0].title}`;
        }
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
            let data = await fetchLeaderboard(scope);
            if (scope !== activeScope) return;

            if (!data || !Array.isArray(data.entries) || !data.entries.length) {
                data = getMockLeaderboardData(scope, user);
            }

            renderUserSummary(data, user);
            renderPodiumSlot("first", data.entries[0], scope, 0);
            renderPodiumSlot("second", data.entries[1], scope, 1);
            renderPodiumSlot("third", data.entries[2], scope, 2);
            renderRows(data.entries.slice(3), scope);
            prefetchOtherScopes(scope);
        } catch (error) {
            console.error(error);
            const mockData = getMockLeaderboardData(scope, user);
            renderUserSummary(mockData, user);
            renderPodiumSlot("first", mockData.entries[0], scope, 0);
            renderPodiumSlot("second", mockData.entries[1], scope, 1);
            renderPodiumSlot("third", mockData.entries[2], scope, 2);
            renderRows(mockData.entries.slice(3), scope);
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

    applyFilterBtn?.addEventListener("click", () => {
        activePeriod = periodFilterEl?.value || "all";
        activeGroup = groupFilterEl?.value.trim() || "";
        leaderboardCache.clear();
        leaderboardRequestCache.clear();
        render(activeScope);
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

    const initialScope = getInitialScope();
    // Khởi động tải cả bốn tab ngay lập tức. render() sẽ dùng lại chính Promise
    // đang chạy nên không tạo request trùng cho tab hiện tại.
    Object.keys(scopeLabels).forEach((scope) => {
        fetchLeaderboard(scope).catch(() => {
            // Tab lỗi vẫn được render() xử lý khi người dùng mở tab đó.
        });
    });
    render(initialScope);
    initLazyCardAnimation();
    window.addEventListener("dongson:auth-changed", () => {
        leaderboardCache.clear();
        leaderboardRequestCache.clear();
        render(activeScope);
    });
})();
