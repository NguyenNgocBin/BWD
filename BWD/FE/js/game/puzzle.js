const LEVELS = {
    1: { rows: 2, cols: 2, pieces: 4 },
    2: { rows: 2, cols: 3, pieces: 6 },
    3: { rows: 3, cols: 3, pieces: 9 },
};

const MAX_TIME = 60;
const BACKEND_ORIGIN = "http://localhost:5000";
const GAME_SESSION_API_URL = `${BACKEND_ORIGIN}/api/v1/game-sessions/`;
const LEADERBOARD_API_URL = `${BACKEND_ORIGIN}/api/v1/leaderboard/?scope=puzzle&limit=10`;

const scoreEl = document.getElementById("score-value");
const comboEl = document.getElementById("combo-value");
const timeEl = document.getElementById("time-value");
const levelEl = document.getElementById("current-level");
const statusLine = document.getElementById("status-line");
const comboBanner = document.getElementById("combo-banner");

const board = document.getElementById("puzzle-board");
const tray = document.getElementById("piece-tray");

const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const switchLevelBtn = document.getElementById("switch-level-btn");
const levelButtons = Array.from(document.querySelectorAll(".level-btn"));

const popup = document.getElementById("learn-popup");
const popupClose = document.getElementById("popup-close");
const rankingList = document.getElementById("ranking-list");

const state = {
    currentLevel: 1,
    highestUnlocked: 1,
    completedLevels: new Set(),
    score: 0,
    combo: 0,
    timeLeft: MAX_TIME,
    timer: null,
    playing: false,
    placedCount: 0,
    totalPieces: 0,
    dragging: null,
    pointerId: null,
    correctPlacements: 0,
    wrongAttempts: 0,
    runActive: false,
    sessionSaved: false,
    runHighestLevel: 1,
    sessionStartedAt: null,
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

function persistUserTotalScore(nextTotalScore) {
    ["localStorage", "sessionStorage"].forEach((storageName) => {
        const storage = window[storageName];
        const rawUser = storage.getItem("authUser");
        if (!rawUser) return;

        try {
            const user = JSON.parse(rawUser);
            user.total_score = nextTotalScore;
            storage.setItem("authUser", JSON.stringify(user));
        } catch (error) {
            // Bo qua auth user loi dinh dang.
        }
    });
}

function setSwitchLevelBtnVisible(visible) {
    switchLevelBtn.classList.toggle("show", visible);
}

function hasCompletedAllLevels() {
    return state.completedLevels.size >= Object.keys(LEVELS).length;
}

function updateHUD() {
    scoreEl.textContent = String(state.score);
    comboEl.textContent = String(state.combo);
    timeEl.textContent = String(state.timeLeft);
    levelEl.textContent = String(state.currentLevel);
}

function setStatus(text) {
    statusLine.textContent = text;
}

function showCombo(text) {
    comboBanner.textContent = text;
    comboBanner.classList.add("show");
    setTimeout(() => comboBanner.classList.remove("show"), 700);
}

function startRunIfNeeded() {
    if (state.runActive) return;

    state.runActive = true;
    state.sessionSaved = false;
    state.correctPlacements = 0;
    state.wrongAttempts = 0;
    state.runHighestLevel = state.currentLevel;
    state.sessionStartedAt = Date.now();
}

function finishRun() {
    state.runActive = false;
}

function getRunDurationSeconds() {
    if (!state.sessionStartedAt) return 0;
    return Math.max(1, Math.round((Date.now() - state.sessionStartedAt) / 1000));
}

async function submitPuzzleSession(success) {
    if (!state.runActive || state.sessionSaved) return false;

    state.sessionSaved = true;
    const { token } = getStoredAuth();
    if (!token) {
        return false;
    }

    const payload = {
        game_code: "puzzle",
        score: state.score,
        correct_count: state.correctPlacements,
        wrong_count: state.wrongAttempts,
        total_questions: state.correctPlacements + state.wrongAttempts,
        duration_seconds: getRunDurationSeconds(),
        best_streak: state.completedLevels.size,
        level_reached: Math.max(state.runHighestLevel, state.currentLevel),
        metadata: {
            completed: success,
            completed_levels: Array.from(state.completedLevels).sort((a, b) => a - b),
        },
    };

    try {
        const response = await fetch(GAME_SESSION_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Khong luu duoc ket qua game");
        }

        if (typeof data.user_total_score === "number") {
            persistUserTotalScore(data.user_total_score);
        }

        return true;
    } catch (error) {
        console.error(error);
        state.sessionSaved = false;
        return false;
    }
}

async function renderRanking() {
    try {
        const response = await fetch(LEADERBOARD_API_URL);
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(data.entries)) {
            throw new Error(data.message || "Khong lay duoc leaderboard");
        }

        if (!data.entries.length) {
            rankingList.innerHTML = "<li>Chưa có điểm nào. Chơi ngay để lên top.</li>";
            return;
        }

        rankingList.innerHTML = data.entries
            .map((item, idx) => `<li>${idx + 1}. ${item.username} - ${item.puzzle_score} điểm</li>`)
            .join("");
    } catch (error) {
        rankingList.innerHTML = "<li>Chưa tải được bảng xếp hạng từ máy chủ.</li>";
    }
}

function addCorrectScore() {
    state.combo += 1;
    state.correctPlacements += 1;
    let bonus = 0;

    if (state.combo === 2) bonus = 5;
    else if (state.combo === 3) bonus = 10;
    else if (state.combo >= 4) bonus = 15;

    state.score += 10 + bonus;

    if (state.combo >= 2) {
        showCombo(`COMBO x${state.combo} 🔥 +${bonus}`);
    }
}

function addWrongPenalty() {
    state.score -= 5;
    state.combo = 0;
    state.wrongAttempts += 1;
}

function getSpeedBonus() {
    if (state.timeLeft >= 40) return 50;
    if (state.timeLeft >= 20) return 30;
    return 10;
}

function clearTimer() {
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
}

function startTimer() {
    clearTimer();
    state.timeLeft = MAX_TIME;
    updateHUD();

    state.timer = setInterval(() => {
        state.timeLeft -= 1;
        updateHUD();

        if (state.timeLeft <= 0) {
            clearTimer();
            endLevel(false);
        }
    }, 1000);
}

function safeAudioContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;

    if (!safeAudioContext.ctx) {
        safeAudioContext.ctx = new Ctx();
    }
    return safeAudioContext.ctx;
}

function playTing() {
    const ctx = safeAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(820, ctx.currentTime);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
}

function clearBoardAndTray() {
    board.innerHTML = "";
    tray.innerHTML = "";
}

function createSlots(levelCfg, boardRect) {
    const slots = [];
    const slotW = boardRect.width / levelCfg.cols;
    const slotH = boardRect.height / levelCfg.rows;

    for (let r = 0; r < levelCfg.rows; r += 1) {
        for (let c = 0; c < levelCfg.cols; c += 1) {
            const idx = r * levelCfg.cols + c;
            const slot = document.createElement("div");
            slot.className = "slot";
            slot.dataset.slotId = String(idx);
            slot.style.left = `${c * slotW}px`;
            slot.style.top = `${r * slotH}px`;
            slot.style.width = `${slotW}px`;
            slot.style.height = `${slotH}px`;
            board.appendChild(slot);
            slots.push(slot);
        }
    }

    return { slots, slotW, slotH };
}

function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function makePiece(id, row, col, levelCfg, slotW, slotH) {
    const piece = document.createElement("div");
    piece.className = "piece";
    piece.dataset.pieceId = String(id);
    piece.dataset.targetSlot = String(id);
    piece.dataset.row = String(row);
    piece.dataset.col = String(col);
    piece.style.width = `${slotW}px`;
    piece.style.height = `${slotH}px`;

    const fullWidth = slotW * levelCfg.cols;
    const fullHeight = slotH * levelCfg.rows;
    piece.style.backgroundSize = `${fullWidth}px ${fullHeight}px`;
    piece.style.backgroundPosition = `-${col * slotW}px -${row * slotH}px`;

    const trayRect = tray.getBoundingClientRect();
    const margin = 8;
    const maxX = Math.max(margin, trayRect.width - slotW - margin);
    const maxY = Math.max(margin, trayRect.height - slotH - margin);
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);

    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.dataset.homeLeft = String(x);
    piece.dataset.homeTop = String(y);

    attachDrag(piece);
    tray.appendChild(piece);

    return piece;
}

function updateLevelButtons() {
    levelButtons.forEach((btn) => {
        const level = Number(btn.dataset.level);
        btn.classList.remove("active", "locked", "completed");

        if (level === state.currentLevel) btn.classList.add("active");
        if (state.completedLevels.has(level)) btn.classList.add("completed");

        if (level <= state.highestUnlocked) {
            btn.disabled = false;
            btn.classList.add("unlocked");
        } else {
            btn.disabled = true;
            btn.classList.add("locked");
        }
    });
}

function setBoardShape(level) {
    board.classList.remove("level-2", "complete-glow");
    if (level === 2) board.classList.add("level-2");
}

function setupLevel(level) {
    state.currentLevel = level;
    state.combo = 0;
    state.placedCount = 0;
    state.runHighestLevel = Math.max(state.runHighestLevel, level);

    clearTimer();
    clearBoardAndTray();
    setBoardShape(level);

    const cfg = LEVELS[level];
    state.totalPieces = cfg.pieces;

    const boardRect = board.getBoundingClientRect();
    const { slots, slotW, slotH } = createSlots(cfg, boardRect);

    const ids = shuffle(slots.map((_, idx) => idx));
    ids.forEach((id) => {
        const row = Math.floor(id / cfg.cols);
        const col = id % cfg.cols;
        makePiece(id, row, col, cfg, slotW, slotH);
    });

    updateHUD();
    updateLevelButtons();
    setSwitchLevelBtnVisible(false);
    setStatus(`Level ${level}: kéo thả ${cfg.pieces} mảnh vào đúng vị trí.`);
}

function snapToSlot(piece, slot) {
    const boardRect = board.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();

    piece.style.left = `${slotRect.left - boardRect.left}px`;
    piece.style.top = `${slotRect.top - boardRect.top}px`;

    board.appendChild(piece);
    piece.classList.remove("dragging", "wrong");
    piece.classList.add("correct");
    piece.style.zIndex = "5";
    piece.dataset.locked = "true";
    slot.classList.add("filled");
}

function returnToTray(piece) {
    if (piece.parentElement !== tray) {
        tray.appendChild(piece);
    }

    piece.style.left = `${Number(piece.dataset.homeLeft)}px`;
    piece.style.top = `${Number(piece.dataset.homeTop)}px`;
    piece.classList.remove("dragging", "correct");
    piece.classList.add("wrong");
    setTimeout(() => piece.classList.remove("wrong"), 300);
}

function handleDrop(piece) {
    const targetId = piece.dataset.targetSlot;
    const pieceRect = piece.getBoundingClientRect();
    const centerX = pieceRect.left + pieceRect.width / 2;
    const centerY = pieceRect.top + pieceRect.height / 2;

    const slots = Array.from(board.querySelectorAll(".slot"));
    const hitSlot = slots.find((slot) => {
        if (slot.classList.contains("filled")) return false;
        const rect = slot.getBoundingClientRect();
        return centerX >= rect.left && centerX <= rect.right && centerY >= rect.top && centerY <= rect.bottom;
    });

    if (hitSlot && hitSlot.dataset.slotId === targetId) {
        snapToSlot(piece, hitSlot);
        addCorrectScore();
        playTing();
        state.placedCount += 1;
        setStatus(`Chuẩn! Đã ghép ${state.placedCount}/${state.totalPieces} mảnh.`);

        if (state.placedCount === state.totalPieces) {
            endLevel(true);
        }
    } else {
        addWrongPenalty();
        returnToTray(piece);
        setStatus("Sai vị trí, mảnh đã quay lại chỗ cũ (-5 điểm).");
    }

    updateHUD();
}

function attachDrag(piece) {
    piece.addEventListener("pointerdown", (event) => {
        if (!state.playing) return;
        if (piece.dataset.locked === "true") return;
        if (state.pointerId !== null) return;

        state.pointerId = event.pointerId;
        state.dragging = {
            piece,
            offsetX: event.clientX - piece.getBoundingClientRect().left,
            offsetY: event.clientY - piece.getBoundingClientRect().top,
        };

        piece.classList.add("dragging");
        piece.setPointerCapture(event.pointerId);

        if (piece.parentElement !== tray) {
            const pieceRect = piece.getBoundingClientRect();
            const trayRect = tray.getBoundingClientRect();
            tray.appendChild(piece);
            piece.style.left = `${pieceRect.left - trayRect.left}px`;
            piece.style.top = `${pieceRect.top - trayRect.top}px`;
        }
    });

    piece.addEventListener("pointermove", (event) => {
        if (!state.dragging) return;
        if (event.pointerId !== state.pointerId) return;

        const trayRect = tray.getBoundingClientRect();
        const x = event.clientX - trayRect.left - state.dragging.offsetX;
        const y = event.clientY - trayRect.top - state.dragging.offsetY;

        piece.style.left = `${x}px`;
        piece.style.top = `${y}px`;
    });

    piece.addEventListener("pointerup", (event) => {
        if (!state.dragging) return;
        if (event.pointerId !== state.pointerId) return;

        piece.releasePointerCapture(event.pointerId);
        state.pointerId = null;
        state.dragging = null;
        handleDrop(piece);
    });

    piece.addEventListener("pointercancel", () => {
        if (!state.dragging) return;
        state.pointerId = null;
        state.dragging = null;
        returnToTray(piece);
    });
}

function showPopup() {
    popup.classList.remove("hidden");
}

function hidePopup() {
    popup.classList.add("hidden");
}

async function endLevel(success) {
    state.playing = false;
    clearTimer();

    if (!success) {
        state.combo = 0;
        setSwitchLevelBtnVisible(false);
        updateHUD();
        const synced = await submitPuzzleSession(false);
        const unsyncedMessage = getStoredAuth().token
            ? "Không thể đồng bộ điểm với máy chủ. Hãy kiểm tra kết nối rồi thử lại."
            : "Điểm chưa được đồng bộ. Hãy đăng nhập để lưu điểm, lịch sử và thứ hạng.";
        finishRun();
        state.sessionStartedAt = null;
        setStatus(
            synced
                ? "Hết giờ. Kết quả đã được lưu vào lịch sử chơi."
                : `Hết giờ. ${unsyncedMessage}`
        );
        await renderRanking();
        return;
    }

    const speedBonus = getSpeedBonus();
    const completeBonus = 50;
    const totalLevels = Object.keys(LEVELS).length;
    state.score += speedBonus + completeBonus;
    board.classList.add("complete-glow");
    state.completedLevels.add(state.currentLevel);
    showPopup();

    if (!hasCompletedAllLevels()) {
        state.highestUnlocked = Math.max(state.highestUnlocked, state.currentLevel + 1);
        setStatus(`Hoàn thành Level ${state.currentLevel}! +${speedBonus} thưởng tốc độ, +50 thưởng hoàn thành.`);
    } else {
        const synced = await submitPuzzleSession(true);
        const unsyncedMessage = getStoredAuth().token
            ? "Không thể đồng bộ điểm với máy chủ. Hãy kiểm tra kết nối rồi thử lại."
            : "Điểm chưa được đồng bộ. Hãy đăng nhập để lưu điểm, lịch sử và thứ hạng.";
        finishRun();
        state.sessionStartedAt = null;
        setStatus(
            synced
                ? `Bạn đã phá đảo! Điểm cuối: ${state.score}. Kết quả đã được đồng bộ lên bảng xếp hạng.`
                : `Bạn đã phá đảo! Điểm cuối: ${state.score}. ${unsyncedMessage}`
        );
        await renderRanking();
    }

    state.combo = 0;
    setSwitchLevelBtnVisible(!hasCompletedAllLevels());
    updateHUD();
    updateLevelButtons();
}

function startLevel() {
    startRunIfNeeded();
    setSwitchLevelBtnVisible(false);
    setupLevel(state.currentLevel);
    state.playing = true;
    startTimer();
}

function resetGame() {
    clearTimer();
    state.currentLevel = 1;
    state.highestUnlocked = 1;
    state.completedLevels.clear();
    state.score = 0;
    state.combo = 0;
    state.playing = false;
    state.timeLeft = MAX_TIME;
    state.correctPlacements = 0;
    state.wrongAttempts = 0;
    state.runActive = false;
    state.sessionSaved = false;
    state.runHighestLevel = 1;
    state.sessionStartedAt = null;
    setSwitchLevelBtnVisible(false);
    hidePopup();
    setupLevel(1);
}

function switchToAnotherLevel() {
    if (hasCompletedAllLevels()) {
        setSwitchLevelBtnVisible(false);
        setStatus("Bạn đã hoàn thành toàn bộ 3 level. Hãy bấm Chơi lại từ đầu nếu muốn thử một lượt mới.");
        return;
    }

    const unlockedLevels = Object.keys(LEVELS)
        .map(Number)
        .filter((level) => level <= state.highestUnlocked)
        .sort((a, b) => a - b);

    if (unlockedLevels.length <= 1) {
        setStatus("Hiện tại mới mở 1 level. Hoàn thành thêm level để chuyển nhanh.");
        return;
    }

    const currentIndex = unlockedLevels.indexOf(state.currentLevel);
    const nextIndex = (currentIndex + 1) % unlockedLevels.length;
    const targetLevel = unlockedLevels[nextIndex];

    state.playing = false;
    clearTimer();
    hidePopup();
    setupLevel(targetLevel);
    setStatus(`Đã chuyển sang Level ${targetLevel}. Nhấn "Bắt đầu level" để chơi.`);
}

levelButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const level = Number(btn.dataset.level);
        if (level > state.highestUnlocked) return;
        state.playing = false;
        clearTimer();
        setupLevel(level);
    });
});

startBtn.addEventListener("click", () => {
    hidePopup();
    startLevel();
});

resetBtn.addEventListener("click", () => {
    resetGame();
});

switchLevelBtn.addEventListener("click", () => {
    switchToAnotherLevel();
});

popupClose.addEventListener("click", () => {
    hidePopup();
});

window.addEventListener("resize", () => {
    if (!state.playing) {
        setupLevel(state.currentLevel);
    }
});

renderRanking();
setupLevel(1);
updateHUD();
