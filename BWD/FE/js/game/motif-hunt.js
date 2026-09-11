const TOTAL_TIME = 120;
const STORAGE_KEY = "dongson_motif_hunt_v2";
const FLIP_BACK_DELAY = 900;
const BACKEND_ORIGIN =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5001"
        : "https://bwd-backend.vercel.app";
const GAME_SESSION_API_URL = `${BACKEND_ORIGIN}/api/v1/game-sessions/`;

const motifs = [
    {
        id: "chim-lac",
        name: "Chim Lạc",
        symbol: "BIRD",
        image: "../../images/home-motifs/motif-bird-3.png",
        detail: "Dáng chim đang bay, gắn với chuyển động và khát vọng.",
        fact: "Chim Lạc là mô-típ rất nổi bật trên trống đồng Đông Sơn.",
    },
    {
        id: "ngoi-sao",
        name: "Ngôi sao",
        symbol: "STAR",
        image: "../../images/TD_SaoVang.jpg",
        detail: "Tâm mặt trống với nhiều tia nhọn tỏa đều ra xung quanh.",
        fact: "Ngôi sao nhiều cánh ở giữa mặt trống thường được hiểu là hình tượng mặt trời.",
    },
    {
        id: "thuyen",
        name: "Thuyền",
        symbol: "BOAT",
        image: "../../images/home-motifs/motif-boat-1.png",
        detail: "Dáng dài, chuyển động theo nhịp nước, gợi sinh hoạt sông ngòi.",
        fact: "Hình thuyền cho thấy cư dân Đông Sơn có đời sống gắn chặt với sông nước.",
    },
    {
        id: "vu-cong",
        name: "Con người",
        symbol: "PEOPLE",
        image: "../../images/home-motifs/motif-gold-dancers.png",
        detail: "Nhân vật nhảy múa, hóa trang hoặc tham gia nghi lễ cộng đồng.",
        fact: "Mô-típ người nhảy múa giúp hình dung sinh hoạt lễ hội thời Đông Sơn.",
    },
    {
        id: "nha-san",
        name: "Nhà sàn",
        symbol: "HOUSE",
        image: "../../images/home-motifs/motif-gold-house.png",
        detail: "Kiến trúc dựng cao, thể hiện không gian cư trú quen thuộc.",
        fact: "Nhà sàn xuất hiện trong nhiều hình khắc, gợi lên môi trường sinh sống của cư dân cổ.",
    },
    {
        id: "vong-tron",
        name: "Vòng tròn",
        symbol: "RING",
        image: "../../images/TrongDongHV.jpg",
        detail: "Các dải hoa văn lặp lại thành vòng đều quanh tâm trống.",
        fact: "Những vòng tròn đồng tâm tạo nhịp điệu thị giác đặc trưng cho mặt trống.",
    },
];

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const boardEl = document.getElementById("motif-board");
const scoreEl = document.getElementById("score-value");
const comboEl = document.getElementById("combo-value");
const timeEl = document.getElementById("time-left");
const roundEl = document.getElementById("round-value");
const targetNameEl = document.getElementById("target-name");
const targetHintEl = document.getElementById("target-hint");
const remainingTargetsEl = document.getElementById("remaining-targets");
const statusLineEl = document.getElementById("status-line");
const factLineEl = document.getElementById("fact-line");
const bestScoreEl = document.getElementById("best-score");
const playCountEl = document.getElementById("play-count");
const accuracyEl = document.getElementById("accuracy-value");

const state = {
    playing: false,
    score: 0,
    combo: 0,
    bestCombo: 0,
    timeLeft: TOTAL_TIME,
    timer: null,
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: motifs.length,
    lockBoard: false,
    moves: 0,
    matches: 0,
    sessionSaved: false,
};

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
            // Bỏ qua auth user lỗi định dạng.
        }
    });
}

function readStats() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
            bestScore: 0,
            playCount: 0,
            lastAccuracy: 0,
        };
    } catch (error) {
        return {
            bestScore: 0,
            playCount: 0,
            lastAccuracy: 0,
        };
    }
}

function writeStats(payload) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function renderStats() {
    const stats = readStats();

    if (bestScoreEl) {
        bestScoreEl.textContent = String(stats.bestScore || 0);
    }

    if (playCountEl) {
        playCountEl.textContent = String(stats.playCount || 0);
    }

    if (accuracyEl) {
        accuracyEl.textContent = `${Math.round(stats.lastAccuracy || 0)}%`;
    }
}

function updateHud() {
    if (scoreEl) {
        scoreEl.textContent = String(state.score);
    }

    if (comboEl) {
        comboEl.textContent = String(state.combo);
    }

    if (timeEl) {
        timeEl.textContent = `${state.timeLeft}s`;
    }

    if (roundEl) {
        roundEl.textContent = String(state.matchedPairs);
    }

    if (remainingTargetsEl) {
        remainingTargetsEl.textContent = `Còn ${state.totalPairs - state.matchedPairs} cặp`;
    }
}

function setStatus(text) {
    if (statusLineEl) {
        statusLineEl.textContent = text;
    }
}

function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
}

function createDeck() {
    return shuffle(
        motifs.flatMap((motif) => [
            { ...motif, cardKey: `${motif.id}-a` },
            { ...motif, cardKey: `${motif.id}-b` },
        ])
    );
}

function setCardFace(button, motif) {
    button.innerHTML = `
        <span class="card-face card-front" aria-hidden="true">
            <span class="card-back-mark">Đông Sơn</span>
            <strong>Lật thẻ</strong>
        </span>
        <span class="card-face card-back">
            <img class="card-image" src="${motif.image}" alt="${motif.name}">
        </span>
    `;
}

function revealCard(cardEl) {
    cardEl.classList.add("flipped");
}

function hideCard(cardEl) {
    cardEl.classList.remove("flipped");
}

function updateBestCombo() {
    state.bestCombo = Math.max(state.bestCombo, state.combo);
}

function lockMatchedCards(cards, motif) {
    cards.forEach((cardEl) => {
        cardEl.classList.add("matched");
        cardEl.disabled = true;
    });

    state.combo += 1;
    updateBestCombo();
    state.matchedPairs += 1;
    state.matches += 1;
    state.score += 20 + (state.combo >= 2 ? 10 : 0);

    if (factLineEl) {
        factLineEl.textContent = motif.fact;
    }

    updateHud();

    if (state.matchedPairs >= state.totalPairs) {
        finishGame(true);
        return;
    }

    setStatus(`Chính xác. Bạn đã ghép được cặp "${motif.name}".`);
}

function resetFlippedCards(cards) {
    state.lockBoard = true;
    window.setTimeout(() => {
        cards.forEach((cardEl) => hideCard(cardEl));
        state.lockBoard = false;
        updateHud();
        setStatus("Hai thẻ không giống nhau, đã úp lại. Hãy thử tiếp.");
    }, FLIP_BACK_DELAY);
}

function resolveTurn() {
    const [firstCard, secondCard] = state.flippedCards;
    if (!firstCard || !secondCard) return;

    const isMatch = firstCard.dataset.motifId === secondCard.dataset.motifId;
    state.moves += 1;

    if (isMatch) {
        const matchedMotif = motifs.find((motif) => motif.id === firstCard.dataset.motifId);
        lockMatchedCards([firstCard, secondCard], matchedMotif);
        state.flippedCards = [];
        return;
    }

    state.combo = 0;
    state.score = Math.max(0, state.score - 5);
    const cardsToHide = [...state.flippedCards];
    state.flippedCards = [];
    resetFlippedCards(cardsToHide);
}

function handleCardClick(cardEl) {
    if (!state.playing || state.lockBoard || cardEl.disabled || cardEl.classList.contains("flipped")) {
        return;
    }

    revealCard(cardEl);
    state.flippedCards.push(cardEl);

    if (state.flippedCards.length === 1) {
        setStatus("Đã lật 1 thẻ. Hãy chọn thêm 1 thẻ nữa để ghép cặp.");
        return;
    }

    if (state.flippedCards.length === 2) {
        resolveTurn();
    }
}

function renderBoard() {
    if (!boardEl) return;

    boardEl.innerHTML = "";
    const deck = createDeck();

    deck.forEach((motif) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "motif-card";
        button.dataset.motifId = motif.id;
        button.dataset.cardKey = motif.cardKey;
        setCardFace(button, motif);
        button.addEventListener("click", () => handleCardClick(button));
        boardEl.appendChild(button);
    });

    updateHud();
}

function clearTimer() {
    if (state.timer) {
        window.clearInterval(state.timer);
        state.timer = null;
    }
}

function startTimer() {
    clearTimer();
    state.timer = window.setInterval(() => {
        state.timeLeft -= 1;
        updateHud();

        if (state.timeLeft <= 0) {
            finishGame(false);
        }
    }, 1000);
}

async function submitMotifSession(completedAllPairs) {
    if (state.sessionSaved) return false;

    state.sessionSaved = true;
    const { token } = getStoredAuth();
    if (!token) {
        return false;
    }

    const payload = {
        game_code: "motifhunt",
        score: state.score,
        correct_count: state.matches,
        wrong_count: state.moves - state.matches,
        total_questions: state.moves,
        duration_seconds: TOTAL_TIME - state.timeLeft,
        best_streak: state.bestCombo,
        level_reached: 1,
        metadata: {
            completed: completedAllPairs,
            matched_pairs: state.matchedPairs,
            total_pairs: state.totalPairs,
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
            throw new Error(data.message || "Không lưu được kết quả game");
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

async function finishGame(completedAllPairs) {
    if (!state.playing) return;

    state.playing = false;
    state.lockBoard = true;
    clearTimer();

    const accuracy = state.moves ? (state.matches / state.moves) * 100 : 0;
    const stats = readStats();

    writeStats({
        bestScore: Math.max(stats.bestScore || 0, state.score),
        playCount: (stats.playCount || 0) + 1,
        lastAccuracy: accuracy,
    });

    renderStats();
    updateHud();

    const synced = await submitMotifSession(completedAllPairs);
    const isLoggedIn = Boolean(getStoredAuth().token);
    const unsyncedMessage = isLoggedIn
        ? "Không thể đồng bộ điểm với máy chủ. Hãy kiểm tra kết nối rồi thử lại."
        : "Điểm chưa được đồng bộ. Hãy đăng nhập để lưu điểm, lịch sử và thứ hạng.";

    if (completedAllPairs) {
        if (targetNameEl) {
            targetNameEl.textContent = "Bạn đã lật đúng toàn bộ cặp thẻ";
        }

        if (targetHintEl) {
            targetHintEl.textContent = `Điểm cuối: ${state.score}. Độ chính xác: ${Math.round(accuracy)}%.`;
        }

        setStatus(
            synced
                ? "Hoàn thành bàn chơi. Điểm đã được đồng bộ lên bảng xếp hạng."
                : `Hoàn thành bàn chơi. ${unsyncedMessage}`
        );

        if (remainingTargetsEl) {
            remainingTargetsEl.textContent = "Còn 0 cặp";
        }
        return;
    }

    if (targetNameEl) {
        targetNameEl.textContent = "Hết thời gian";
    }

    if (targetHintEl) {
        targetHintEl.textContent = `Bạn đã ghép được ${state.matchedPairs}/${state.totalPairs} cặp. Điểm cuối: ${state.score}.`;
    }

    setStatus(
        synced
            ? "Kết quả đã được đồng bộ lên bảng xếp hạng."
            : unsyncedMessage
    );
}

function startGame() {
    clearTimer();
    state.playing = true;
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.timeLeft = TOTAL_TIME;
    state.flippedCards = [];
    state.matchedPairs = 0;
    state.lockBoard = false;
    state.moves = 0;
    state.matches = 0;
    state.sessionSaved = false;

    if (targetNameEl) {
        targetNameEl.textContent = "Lật 2 thẻ để tìm cặp giống nhau";
    }

    if (targetHintEl) {
        targetHintEl.textContent = "Nếu 2 thẻ giống ảnh thì được cộng điểm. Nếu không giống nhau, 2 thẻ vừa lật sẽ úp lại.";
    }

    if (factLineEl) {
        factLineEl.textContent = "Hãy ghi nhớ vị trí từng hoạ tiết Đông Sơn để ghép cặp nhanh hơn.";
    }

    renderBoard();
    updateHud();
    setStatus("Ván mới bắt đầu. Hãy lật lá đầu tiên.");
    startTimer();

    const board = document.getElementById("motif-board");
    if (board) {
        const headerHeight = 70;
        const targetTop = board.getBoundingClientRect().top + window.pageYOffset - headerHeight - 10;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    }
}

if (startBtn) {
    startBtn.addEventListener("click", startGame);
}

if (restartBtn) {
    restartBtn.addEventListener("click", startGame);
}

renderStats();
updateHud();
