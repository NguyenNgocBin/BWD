(function () {
    const BACKEND_ORIGIN = "http://localhost:5001";
    const API_BASE_URL = `${BACKEND_ORIGIN}/api/v1/auth`;
    const LEADERBOARD_API_URL = `${BACKEND_ORIGIN}/api/v1/leaderboard/?scope=tong&limit=1`;
    const GAME_SESSIONS_API_URL = `${BACKEND_ORIGIN}/api/v1/game-sessions/me?limit=20`;
    const PROGRESSION_API_URL = `${BACKEND_ORIGIN}/api/v1/progression/me`;
    const HANOI_TIME_ZONE = "Asia/Ho_Chi_Minh";
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
        heroRank: document.getElementById("heroRank"),
        heroBestGame: document.getElementById("heroBestGame"),
        kpiPlayCount: document.getElementById("kpiPlayCount"),
        kpiAccuracy: document.getElementById("kpiAccuracy"),
        kpiStreak: document.getElementById("kpiStreak"),
        achievementCards: document.getElementById("achievementCards"),
        historyList: document.getElementById("historyList"),
        badgeGrid: document.getElementById("badgeGrid"),
        dailyMissionList: document.getElementById("dailyMissionList"),
        dailyRewardNote: document.getElementById("dailyRewardNote"),
        progressChart: document.getElementById("progressChart"),
        progressChartSummary: document.getElementById("progressChartSummary"),
        changeAvatarBtn: document.getElementById("changeAvatarBtn"),
        avatarPickerPanel: document.getElementById("avatarPickerPanel"),
        avatarOptionGrid: document.getElementById("avatarOptionGrid"),
        avatarPickerStatus: document.getElementById("avatarPickerStatus"),
        cancelAvatarBtn: document.getElementById("cancelAvatarBtn"),
        saveAvatarBtn: document.getElementById("saveAvatarBtn"),
        renameBtn: document.getElementById("renameBtn"),
        classGroupBtn: document.getElementById("classGroupBtn"),
        logoutBtn: document.getElementById("logoutBtn"),
        changePasswordBtn: document.getElementById("changePasswordBtn"),
        passwordPanel: document.getElementById("passwordPanel"),
        changePasswordForm: document.getElementById("changePasswordForm"),
        currentPassword: document.getElementById("currentPassword"),
        newPassword: document.getElementById("newPassword"),
        confirmPassword: document.getElementById("confirmPassword"),
        passwordStatus: document.getElementById("passwordStatus"),
        cancelPasswordBtn: document.getElementById("cancelPasswordBtn"),
        savePasswordBtn: document.getElementById("savePasswordBtn"),
    };

    let pendingAvatar = null;

    function dashboardCacheKey(user) {
        return user?.id ? `dongsonProfileDashboardV1:${user.id}` : null;
    }

    function readDashboardCache(user) {
        const key = dashboardCacheKey(user);
        if (!key) return null;
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            return null;
        }
    }

    function writeDashboardCache(user, data) {
        const key = dashboardCacheKey(user);
        if (!key) return;
        localStorage.setItem(key, JSON.stringify({ ...data, cachedAt: Date.now() }));
    }

    function getCookie(name) {
        try {
            const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
            return match ? decodeURIComponent(match[1]) : null;
        } catch (e) {
            return null;
        }
    }

    function getStoredAuth() {
        if (window.DongSonAuth?.getStoredAuth) {
            return window.DongSonAuth.getStoredAuth();
        }
        let token = null;
        let rawUser = null;
        try { token = localStorage.getItem("authToken"); } catch(e) {}
        if (!token) { try { token = sessionStorage.getItem("authToken"); } catch(e) {} }
        if (!token) { token = getCookie("authToken"); }

        try { rawUser = localStorage.getItem("authUser"); } catch(e) {}
        if (!rawUser) { try { rawUser = sessionStorage.getItem("authUser"); } catch(e) {} }
        if (!rawUser) { rawUser = getCookie("authUser"); }

        let user = null;
        if (rawUser) {
            try { user = JSON.parse(rawUser); } catch (error) { user = null; }
        }

        return { token, user };
    }

    function clearAuth(message) {
        if (window.DongSonAuth?.clearAuth) {
            window.DongSonAuth.clearAuth(message);
            return;
        }
        try { localStorage.removeItem("authToken"); } catch(e) {}
        try { localStorage.removeItem("authUser"); } catch(e) {}
        try { sessionStorage.removeItem("authToken"); } catch(e) {}
        try { sessionStorage.removeItem("authUser"); } catch(e) {}
        try { document.cookie = "authToken=; path=/; max-age=0;"; } catch(e) {}
        try { document.cookie = "authUser=; path=/; max-age=0;"; } catch(e) {}
        if (message) {
            try { sessionStorage.setItem("authNotice", message); } catch(e) {}
        }
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

    function hanoiDateKey(date) {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: HANOI_TIME_ZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).formatToParts(date);
        const value = (type) => parts.find((part) => part.type === type)?.value;
        return `${value("year")}-${value("month")}-${value("day")}`;
    }

    function formatHanoiDate(date, options) {
        return date.toLocaleDateString("vi-VN", { ...options, timeZone: HANOI_TIME_ZONE });
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
        if (els.subtitle) {
            els.subtitle.textContent = user.class_group
                ? `${user.email || "Người khám phá Đông Sơn"} · ${user.class_group}`
                : user.email || "Người khám phá Đông Sơn";
        }
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
            const err = new Error(data.message || "Không lấy được thông tin người dùng");
            err.status = response.status;
            throw err;
        }

        return data.user;
    }

    async function fetchGameData(token) {
        const headers = { Authorization: `Bearer ${token}` };
        const [leaderboardResponse, sessionsResponse, progressionResponse] = await Promise.all([
            fetch(LEADERBOARD_API_URL, { headers, cache: "no-store" }),
            fetch(GAME_SESSIONS_API_URL, { headers, cache: "no-store" }),
            fetch(PROGRESSION_API_URL, { headers, cache: "no-store" }),
        ]);
        const leaderboardData = await leaderboardResponse.json().catch(() => ({}));
        const sessionsData = await sessionsResponse.json().catch(() => ({}));
        const progressionData = await progressionResponse.json().catch(() => ({}));

        if (!leaderboardResponse.ok) {
            throw new Error(leaderboardData.message || "Không lấy được thống kê xếp hạng");
        }
        if (!sessionsResponse.ok) {
            throw new Error(sessionsData.message || "Không lấy được lịch sử chơi");
        }
        if (!progressionResponse.ok) {
            throw new Error(progressionData.message || "Không lấy được thành tựu và nhiệm vụ");
        }

        return {
            stats: leaderboardData.current_user,
            sessions: Array.isArray(sessionsData.sessions) ? sessionsData.sessions : [],
            progression: progressionData,
        };
    }

    function renderProgression(progression) {
        const achievements = progression?.achievements || [];
        const missions = progression?.daily_missions || [];

        if (els.badgeGrid) {
            els.badgeGrid.innerHTML = achievements.length
                ? achievements.map((item) => `
                    <article class="badge-item ${item.unlocked ? "unlocked" : "locked"}" title="${item.description}">
                        <span>${item.unlocked ? item.icon : "🔒"}</span>
                        <p>${item.title}</p>
                        <small>${item.unlocked ? "Đã mở khóa" : "Chưa đạt"}</small>
                    </article>
                `).join("")
                : "<p>Chưa có dữ liệu huy hiệu.</p>";
        }

        if (els.dailyMissionList) {
            els.dailyMissionList.innerHTML = missions.map((mission) => {
                const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100));
                return `
                    <div class="task-row ${mission.completed ? "is-complete" : ""}">
                        <div class="task-head"><span>${mission.title}</span><strong>${mission.progress}/${mission.target}</strong></div>
                        <div class="progress"><span style="width:${percent}%"></span></div>
                        <small>${mission.completed ? "Hoàn thành" : mission.reward}</small>
                    </div>
                `;
            }).join("");
        }
        if (els.dailyRewardNote) {
            els.dailyRewardNote.textContent = progression?.daily_completed === progression?.daily_total
                ? "Đã hoàn thành hôm nay — huy hiệu Sứ giả mỗi ngày đã được mở khóa."
                : `Hoàn thành ${progression?.daily_completed || 0}/${progression?.daily_total || 3} nhiệm vụ để nhận huy hiệu.`;
        }
    }

    function renderProgressChart(sessions) {
        if (!els.progressChart) return;

        const days = [];
        const scoreByDate = new Map();
        sessions.forEach((session) => {
            if (!session.played_at) return;
            const date = new Date(session.played_at);
            const key = hanoiDateKey(date);
            scoreByDate.set(key, (scoreByDate.get(key) || 0) + Number(session.score || 0));
        });

        for (let offset = 6; offset >= 0; offset -= 1) {
            const date = new Date();
            date.setDate(date.getDate() - offset);
            const key = hanoiDateKey(date);
            days.push({
                label: formatHanoiDate(date, { day: "2-digit", month: "2-digit" }),
                score: scoreByDate.get(key) || 0,
            });
        }

        const width = 700;
        const height = 250;
        const left = 42;
        const right = 18;
        const top = 24;
        const bottom = 42;
        const chartHeight = height - top - bottom;
        const maxScore = Math.max(1, ...days.map((day) => day.score));
        const points = days.map((day, index) => ({
            ...day,
            x: left + index * ((width - left - right) / (days.length - 1)),
            y: top + chartHeight - (day.score / maxScore) * chartHeight,
        }));
        const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");
        const areaString = `${left},${top + chartHeight} ${pointString} ${width - right},${top + chartHeight}`;
        const total = days.reduce((sum, day) => sum + day.score, 0);

        if (els.progressChartSummary) {
            els.progressChartSummary.textContent = `${formatScore(total)} điểm / 7 ngày`;
        }
        els.progressChart.setAttribute(
            "aria-label",
            `Biểu đồ tiến bộ 7 ngày, tổng cộng ${formatScore(total)} điểm.`
        );
        els.progressChart.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" role="presentation" focusable="false">
                <line class="chart-grid" x1="${left}" y1="${top}" x2="${width - right}" y2="${top}"></line>
                <line class="chart-grid" x1="${left}" y1="${top + chartHeight / 2}" x2="${width - right}" y2="${top + chartHeight / 2}"></line>
                <line class="chart-grid" x1="${left}" y1="${top + chartHeight}" x2="${width - right}" y2="${top + chartHeight}"></line>
                <polygon class="chart-area" points="${areaString}"></polygon>
                <polyline class="chart-line" points="${pointString}"></polyline>
                ${points.map((point) => `
                    <circle class="chart-point" cx="${point.x}" cy="${point.y}" r="5">
                        <title>${point.label}: ${formatScore(point.score)} điểm</title>
                    </circle>
                    <text class="chart-value" x="${point.x}" y="${Math.max(14, point.y - 11)}">${formatScore(point.score)}</text>
                    <text class="chart-label" x="${point.x}" y="${height - 13}">${point.label}</text>
                `).join("")}
            </svg>
        `;
    }

    function renderGameData(stats, sessions) {
        renderProgressChart(sessions);
        const playCount = stats
            ? Number(stats.motif_play_count || 0) + Number(stats.puzzle_play_count || 0) + Number(stats.quiz_play_count || 0)
            : sessions.length;
        const totalAnswers = sessions.reduce((sum, item) => sum + Number(item.total_questions || 0), 0);
        const totalCorrect = sessions.reduce((sum, item) => sum + Number(item.correct_count || 0), 0);
        const accuracy = totalAnswers ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
        const bestStreak = stats
            ? Math.max(stats.motif_best_streak || 0, stats.puzzle_best_streak || 0, stats.quiz_best_streak || 0)
            : Math.max(0, ...sessions.map((item) => Number(item.best_streak || 0)));

        if (els.heroRank) els.heroRank.textContent = stats?.rank ? `#${stats.rank}` : "Chưa có";
        if (els.heroBestGame) els.heroBestGame.textContent = stats?.best_game || "Chưa có";
        if (els.kpiPlayCount) els.kpiPlayCount.textContent = formatScore(playCount);
        if (els.kpiAccuracy) els.kpiAccuracy.textContent = `${accuracy}%`;
        if (els.kpiStreak) els.kpiStreak.textContent = formatScore(bestStreak);

        if (els.achievementCards) {
            const cards = [
                { title: "Lật thẻ", image: "../images/dongsonz3.jpg", score: stats?.motif_score, streak: stats?.motif_best_streak, plays: stats?.motif_play_count },
                { title: "Ghép hình", image: "../images/dongsonz2.png", score: stats?.puzzle_score, streak: stats?.puzzle_best_streak, plays: stats?.puzzle_play_count },
                { title: "Đúng/Sai", image: "../images/dongsonz4.png", score: stats?.quiz_score, streak: stats?.quiz_best_streak, plays: stats?.quiz_play_count },
            ];
            els.achievementCards.innerHTML = cards.map((card) => `
                <article class="game-ach-card">
                    <img src="${card.image}" alt="${card.title}">
                    <h3>${card.title}</h3>
                    <ul>
                        <li><span>Điểm cao nhất</span><strong>${formatScore(card.score)}</strong></li>
                        <li><span>Chuỗi tốt nhất</span><strong>${formatScore(card.streak)}</strong></li>
                        <li><span>Số lần chơi</span><strong>${formatScore(card.plays)}</strong></li>
                    </ul>
                </article>
            `).join("");
        }

        if (els.historyList) {
            if (!sessions.length) {
                els.historyList.innerHTML = "<p>Chưa có lượt chơi nào được đồng bộ.</p>";
            } else {
                els.historyList.innerHTML = sessions.map((session) => {
                    const playedAt = session.played_at
                        ? new Date(session.played_at).toLocaleString("vi-VN", { timeZone: HANOI_TIME_ZONE })
                        : "Không rõ thời gian";
                    return `
                        <article class="history-item">
                            <span class="dot">✓</span>
                            <div>
                                <h3>${session.game_name || session.game_code}</h3>
                                <p>${playedAt} • <b>+${formatScore(session.score)} điểm</b></p>
                            </div>
                        </article>
                    `;
                }).join("");
            }
        }
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

    async function changePassword(token, currentPassword, newPassword) {
        const response = await fetch(`${API_BASE_URL}/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
            }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || "Không thể đổi mật khẩu");
        }
        return data;
    }

    function togglePasswordPanel(open) {
        if (!els.passwordPanel) return;
        els.passwordPanel.toggleAttribute("hidden", !open);
        els.passwordPanel.style.display = open ? "" : "none";
        document.body.classList.toggle("avatar-picker-open", open);
        if (open) {
            els.changePasswordForm?.reset();
            els.passwordStatus.textContent = "Mật khẩu mới cần có ít nhất 6 ký tự.";
            els.passwordStatus.dataset.state = "default";
            window.setTimeout(() => els.currentPassword?.focus(), 0);
        }
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
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get("token");
        if (urlToken) {
            try { localStorage.setItem("authToken", urlToken); } catch(e) {}
            try { sessionStorage.setItem("authToken", urlToken); } catch(e) {}
            try { document.cookie = `authToken=${encodeURIComponent(urlToken)}; path=/; max-age=604800; SameSite=Lax`; } catch(e) {}
            try {
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (e) {}
        }

        const auth = getStoredAuth();
        const token = urlToken || auth.token;
        let user = auth.user;

        if (!token) {
            if (els.name) els.name.textContent = "Chưa đăng nhập";
            if (els.subtitle) {
                els.subtitle.innerHTML = 'Bạn chưa đăng nhập. Vui lòng <a href="./login.html?v=11" style="color:#d99b28;text-decoration:underline;font-weight:700;">Đăng nhập tại đây</a> để xem hồ sơ và điểm số của bạn.';
            }
            if (els.achievementCards) els.achievementCards.innerHTML = '<p>Đăng nhập để xem điểm từng game.</p>';
            if (els.badgeGrid) els.badgeGrid.innerHTML = '<p>Đăng nhập để xem bộ sưu tập huy hiệu.</p>';
            if (els.dailyMissionList) els.dailyMissionList.innerHTML = '<p>Đăng nhập để xem nhiệm vụ hằng ngày.</p>';
            if (els.historyList) els.historyList.innerHTML = '<p>Đăng nhập để xem lịch sử hoạt động.</p>';
            if (els.progressChart) els.progressChart.innerHTML = '<p style="text-align:center;padding:24px;color:#888;">Đăng nhập để xem biểu đồ tiến bộ.</p>';
            return;
        }

        renderUser(user);
        if (window.DongSonAuth?.renderHeaderAuth) {
            window.DongSonAuth.renderHeaderAuth();
        }

        // Hiển thị dữ liệu lần gần nhất ngay lập tức, sau đó âm thầm làm mới.
        const cached = readDashboardCache(user);
        let dashboardData = {
            stats: cached?.stats || null,
            sessions: cached?.sessions || [],
            progression: cached?.progression || null,
        };
        if (cached) {
            renderGameData(dashboardData.stats, dashboardData.sessions);
            renderProgression(dashboardData.progression);
        }

        const currentUserRequest = fetchCurrentUser(token);
        const gameDataRequest = fetchGameData(token);

        try {
            const freshUser = await currentUserRequest;
            if (window.DongSonAuth?.saveAuth) {
                window.DongSonAuth.saveAuth(token, freshUser);
            } else {
                persistUser(freshUser);
            }
            renderUser(freshUser);
            if (window.DongSonAuth?.renderHeaderAuth) {
                window.DongSonAuth.renderHeaderAuth();
            }
            try {
                const gameData = await gameDataRequest;
                dashboardData = gameData;
                renderGameData(gameData.stats, gameData.sessions);
                renderProgression(gameData.progression);
                writeDashboardCache(freshUser, gameData);
            } catch (gameDataError) {
                console.error(gameDataError);
                if (!cached) renderGameData(null, []);
            }

        } catch (error) {
            console.error("fetchCurrentUser failed:", error);
            if (error.status === 401) {
                if (els.subtitle) {
                    els.subtitle.innerHTML = 'Phiên đăng nhập đã hết hạn hoặc chưa đồng bộ. Vui lòng <a href="./login.html?v=11" style="color:#d99b28;text-decoration:underline;font-weight:700;">Đăng nhập lại tại đây</a>.';
                }
            }
        }
    }

    els.changeAvatarBtn?.addEventListener("click", () => {
        toggleAvatarPicker(true);
    });

    els.cancelAvatarBtn?.addEventListener("click", () => {
        toggleAvatarPicker(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (els.avatarPickerPanel && !els.avatarPickerPanel.hasAttribute("hidden")) toggleAvatarPicker(false);
        if (els.passwordPanel && !els.passwordPanel.hasAttribute("hidden")) togglePasswordPanel(false);
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
            window.alert("Vui lòng đăng nhập trước khi đổi ảnh đại diện.");
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
            window.alert("Vui lòng đăng nhập trước khi đổi tên.");
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

    els.classGroupBtn?.addEventListener("click", async () => {
        const { token, user } = getStoredAuth();
        if (!token || !user) return;
        const next = window.prompt("Nhập tên lớp hoặc nhóm (để trống nếu không dùng):", user.class_group || "");
        if (next === null) return;
        els.classGroupBtn.disabled = true;
        try {
            const updatedUser = await updateProfile(token, { class_group: next.trim() });
            persistUser(updatedUser);
            renderUser(updatedUser);
        } catch (error) {
            window.alert(error.message);
        } finally {
            els.classGroupBtn.disabled = false;
        }
    });

    els.changePasswordBtn?.addEventListener("click", () => togglePasswordPanel(true));
    els.cancelPasswordBtn?.addEventListener("click", () => togglePasswordPanel(false));
    els.changePasswordForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const { token } = getStoredAuth();
        if (!token) {
            window.alert("Vui lòng đăng nhập trước khi đổi mật khẩu.");
            return;
        }

        const currentPassword = els.currentPassword.value;
        const newPassword = els.newPassword.value;
        const confirmPassword = els.confirmPassword.value;
        if (newPassword.length < 6) {
            els.passwordStatus.textContent = "Mật khẩu mới phải có ít nhất 6 ký tự.";
            els.passwordStatus.dataset.state = "error";
            return;
        }
        if (newPassword !== confirmPassword) {
            els.passwordStatus.textContent = "Hai lần nhập mật khẩu mới chưa trùng khớp.";
            els.passwordStatus.dataset.state = "error";
            return;
        }

        els.savePasswordBtn.disabled = true;
        els.cancelPasswordBtn.disabled = true;
        els.passwordStatus.textContent = "Đang đổi mật khẩu...";
        els.passwordStatus.dataset.state = "default";
        try {
            const result = await changePassword(token, currentPassword, newPassword);
            els.passwordStatus.textContent = result.message || "Đổi mật khẩu thành công.";
            els.passwordStatus.dataset.state = "success";
            els.changePasswordForm.reset();
            window.setTimeout(() => togglePasswordPanel(false), 1000);
        } catch (error) {
            els.passwordStatus.textContent = error.message || "Không thể đổi mật khẩu.";
            els.passwordStatus.dataset.state = "error";
        } finally {
            els.savePasswordBtn.disabled = false;
            els.cancelPasswordBtn.disabled = false;
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
