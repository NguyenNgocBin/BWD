import {
    FaceLandmarker,
    FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const BACKEND_ORIGIN = "http://localhost:5001";
const GAME_SESSION_API_URL = `${BACKEND_ORIGIN}/api/v1/game-sessions/`;
const LEADERBOARD_API_URL = `${BACKEND_ORIGIN}/api/v1/leaderboard/?scope=codechayquiz&limit=10`;

const CHAPTERS = [
    {
        title: "Nguồn gốc trống đồng",
        questions: [
            { question: "Trống đồng Đông Sơn được làm chủ yếu từ gì?", A: "Sắt", B: "Đồng", correct: "B" },
            { question: "Nền văn hóa nào gắn liền với trống đồng nổi tiếng ở Việt Nam?", A: "Đông Sơn", B: "Óc Eo", correct: "A" },
            { question: "Trống đồng Đông Sơn xuất hiện mạnh vào giai đoạn nào?", A: "Sơ kỳ đồ đồng", B: "Cuối thời đại đồ đồng", correct: "B" },
            { question: "Khu vực phát hiện nhiều trống đồng cổ là đâu?", A: "Bắc Bộ và Bắc Trung Bộ", B: "Tây Nam Bộ", correct: "A" },
            { question: "Một trong các chức năng ban đầu của trống đồng là gì?", A: "Nghi lễ cộng đồng", B: "Nấu ăn", correct: "A" },
        ],
    },
    {
        title: "Hoa văn và biểu tượng",
        questions: [
            { question: "Hình thường nằm ở trung tâm mặt trống là gì?", A: "Ngôi sao nhiều cánh", B: "Hình vuông", correct: "A" },
            { question: "Chim Lạc trên trống đồng thường biểu trưng cho điều gì?", A: "Khát vọng và sự vận động", B: "Sự tĩnh lặng", correct: "A" },
            { question: "Hoa văn vòng tròn đồng tâm cho thấy đặc điểm nào?", A: "Tư duy nhịp điệu và trật tự", B: "Không có ý nghĩa", correct: "A" },
            { question: "Hình người giã gạo trên trống đồng phản ánh điều gì?", A: "Sinh hoạt lao động", B: "Trò chơi điện tử", correct: "A" },
            { question: "Biểu tượng thuyền trên một số trống đồng liên quan đến gì?", A: "Giao thương và di chuyển", B: "Bay trên trời", correct: "A" },
        ],
    },
    {
        title: "Kỹ thuật và cấu tạo",
        questions: [
            { question: "Trống đồng thường được đúc bằng kỹ thuật nào?", A: "Đúc khuôn", B: "In 3D", correct: "A" },
            { question: "Mặt trống đồng thường có đặc điểm gì?", A: "Phẳng, có hoa văn", B: "Nhiều lỗ thủng", correct: "A" },
            { question: "Âm thanh trống đồng phụ thuộc nhiều vào yếu tố nào?", A: "Độ dày và hình dáng thân", B: "Màu sơn", correct: "A" },
            { question: "Thân trống đồng thường gồm các phần cơ bản nào?", A: "Mặt, tang, thân, chân", B: "Nắp, quai, vòi", correct: "A" },
            { question: "Quá trình đúc trống đồng đòi hỏi điều gì cao?", A: "Tay nghề thủ công", B: "Lắp ráp vít", correct: "A" },
        ],
    },
    {
        title: "Giá trị lịch sử",
        questions: [
            { question: "Trống đồng là tư liệu quý để nghiên cứu gì?", A: "Đời sống xã hội cổ", B: "Thiết kế ô tô", correct: "A" },
            { question: "Hình ảnh lễ hội trên trống đồng cho thấy điều gì?", A: "Đời sống tinh thần phong phú", B: "Không có nghi lễ", correct: "A" },
            { question: "Trống đồng thể hiện trình độ nổi bật nào của cư dân xưa?", A: "Luyện kim", B: "Lập trình máy tính", correct: "A" },
            { question: "Giá trị của trống đồng trong lịch sử Việt Nam là gì?", A: "Biểu tượng văn hóa lâu bền", B: "Vật dụng hiện đại", correct: "A" },
            { question: "Trống đồng còn phản ánh mối quan hệ nào?", A: "Giao lưu khu vực", B: "Cô lập tuyệt đối", correct: "A" },
        ],
    },
    {
        title: "Bảo tồn và phát huy",
        questions: [
            { question: "Bảo tồn trống đồng cần ưu tiên điều gì?", A: "Lưu giữ hiện vật đúng điều kiện", B: "Để ngoài trời nắng", correct: "A" },
            { question: "Số hóa trống đồng giúp ích gì?", A: "Lan tỏa tri thức rộng rãi", B: "Làm mất dữ liệu", correct: "A" },
            { question: "Hoạt động phù hợp để phát huy giá trị trống đồng là gì?", A: "Triển lãm giáo dục", B: "Giấu trong kho kín", correct: "A" },
            { question: "Người trẻ có thể góp phần bảo tồn bằng cách nào?", A: "Tìm hiểu và chia sẻ kiến thức đúng", B: "Lan truyền thông tin sai", correct: "A" },
            { question: "Mục tiêu cuối cùng của bảo tồn di sản là gì?", A: "Giữ gìn và truyền lại cho thế hệ sau", B: "Xóa bỏ dấu tích", correct: "A" },
        ],
    },
];

const QUESTIONS_PER_CHAPTER = 5;
const QUESTIONS = CHAPTERS.flatMap((chapter, chapterIndex) =>
    chapter.questions.map((q) => ({ ...q, chapterIndex }))
);

const scoreEl = document.getElementById("score");
const currentQuestionEl = document.getElementById("current-question");
const totalQuestionEl = document.getElementById("total-question");
const timeEl = document.getElementById("time");
const questionEl = document.getElementById("question");
const questionSubtitleEl = document.getElementById("question-subtitle");
const answerAEl = document.getElementById("answerA");
const answerBEl = document.getElementById("answerB");
const feedbackEl = document.getElementById("feedback");
const headStatusEl = document.getElementById("head-status");
const trackingDotEl = document.getElementById("tracking-dot");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const cameraToggleBtn = document.getElementById("camera-toggle-btn");
const nextChapterBtn = document.getElementById("next-chapter-btn");
const webcamEl = document.getElementById("webcam");
const streakValueEl = document.getElementById("streak-value");
const accuracyValueEl = document.getElementById("accuracy-value");
const bestScoreValueEl = document.getElementById("best-score-value");
const chapterProgressItems = Array.from(document.querySelectorAll("#chapter-progress-list .progress-item"));
const rankingBoardEl = document.querySelector(".ranking-list");
const cameraQuestionBarEl = document.getElementById("camera-question-bar");
const cameraQBadgeEl = document.getElementById("camera-q-badge");
const cameraQTitleEl = document.getElementById("camera-q-title");

function scrollToQuestionArea() {
    const target = document.querySelector(".question-intro") || document.querySelector(".game-content");
    if (!target) return;

    const header = document.querySelector("header.header");
    const headerHeight = header ? header.offsetHeight : 70;
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;

    window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
    });
}

let currentQuestionIndex = 0;
let score = 0;
let bestScore = 0;
let timeLeft = 10;
let timer = null;
let isLocked = false;
let gameStarted = false;
let cameraStarted = false;
let streamRef = null;
let isInitializing = false;
let detectLoopStarted = false;
let isWaitingForNextChapter = false;

let currentDirection = "center";
let hasChosenByHead = false;
let directionStreak = 0;
let smoothRollDeg = 0;
let waitingForCenter = false;
let centerStreak = 0;

let currentStreak = 0;
let bestStreak = 0;
let correctCount = 0;
let answeredCount = 0;
let sessionStartedAt = null;
let sessionSaved = false;

let faceLandmarker = null;
let lastVideoTime = -1;

totalQuestionEl.textContent = QUESTIONS.length;

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
            // Bo qua auth user loi dinh dang.
        }
    });
}

const MOCK_QUIZ_LEADERBOARD = [
    { username: "Huyền My", quiz_score: "6.200" },
    { username: "Quang Minh", quiz_score: "5.800" },
    { username: "Gia Bảo", quiz_score: "5.500" },
    { username: "Hoàng Nam", quiz_score: "5.100" },
];

async function renderQuizLeaderboard() {
    if (!rankingBoardEl) return;

    const medals = ["🥇", "🥈", "🥉"];

    function renderItems(entries) {
        rankingBoardEl.innerHTML = entries.slice(0, 4).map((entry, index) => `
            <div class="ranking-item ${index === 0 ? "top-1" : ""}">
                <span class="rank-medal">${medals[index] || `<span class="rank-order">${index + 1}</span>`}</span>
                <span class="rank-name">${entry.username}</span>
                <span class="rank-score">${Number(entry.quiz_score || entry.score || 0).toLocaleString("vi-VN") || entry.quiz_score} điểm</span>
            </div>
        `).join("");
    }

    try {
        const response = await fetch(LEADERBOARD_API_URL);
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(data.entries) || !data.entries.length) {
            renderItems(MOCK_QUIZ_LEADERBOARD);
            return;
        }

        renderItems(data.entries);
    } catch (error) {
        renderItems(MOCK_QUIZ_LEADERBOARD);
    }
}

function getSessionDurationSeconds() {
    if (!sessionStartedAt) return 0;
    return Math.max(1, Math.round((Date.now() - sessionStartedAt) / 1000));
}

async function submitQuizSession() {
    if (sessionSaved) return false;

    sessionSaved = true;
    const { token } = getStoredAuth();
    if (!token) {
        return false;
    }

    const payload = {
        game_code: "codechayquiz",
        score,
        correct_count: correctCount,
        wrong_count: answeredCount - correctCount,
        total_questions: answeredCount,
        duration_seconds: getSessionDurationSeconds(),
        best_streak: bestStreak,
        level_reached: CHAPTERS.length,
        metadata: {
            chapters_completed: CHAPTERS.length,
            input_mode: "camera_quiz",
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
            throw new Error(data.message || "Khong luu duoc ket qua quiz");
        }

        if (typeof data.user_total_score === "number") {
            persistUserTotalScore(data.user_total_score);
        }

        return true;
    } catch (error) {
        console.error(error);
        sessionSaved = false;
        return false;
    }
}

function setCameraIndicator(isOn) {
    if (!trackingDotEl) return;
    trackingDotEl.classList.toggle("active", isOn);
}

function updateAchievementUI() {
    if (streakValueEl) streakValueEl.textContent = String(currentStreak);

    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    if (accuracyValueEl) accuracyValueEl.textContent = `${accuracy}%`;

    bestScore = Math.max(bestScore, score);
    if (bestScoreValueEl) bestScoreValueEl.textContent = String(bestScore);
}

function getCurrentChapterIndex() {
    return Math.floor(currentQuestionIndex / QUESTIONS_PER_CHAPTER);
}

function updateChapterProgressUI() {
    const completedChapterCount = Math.floor(currentQuestionIndex / QUESTIONS_PER_CHAPTER);
    const currentChapter = getCurrentChapterIndex();

    chapterProgressItems.forEach((item, index) => {
        item.classList.remove("active", "completed");

        if (index < completedChapterCount) {
            item.classList.add("completed");
            return;
        }

        if (!isWaitingForNextChapter && index === currentChapter && index < CHAPTERS.length) {
            item.classList.add("active");
            return;
        }

        if (isWaitingForNextChapter && index === completedChapterCount && index < CHAPTERS.length) {
            item.classList.add("active");
        }
    });
}

function setIdleUI() {
    document.body.classList.remove("game-active");
    if (cameraQuestionBarEl) {
        cameraQuestionBarEl.style.display = "none";
    }

    questionEl.textContent = "Nhấn Bắt đầu để chơi";
    if (questionSubtitleEl) {
        questionSubtitleEl.textContent = "Hãy định vị khuôn mặt vào khung hình để hệ thống xác nhận danh tính trước khi bắt đầu.";
    }

    feedbackEl.textContent = "";
    headStatusEl.textContent = cameraStarted ? "Đang nhìn thẳng" : "Chưa bắt đầu";
    answerAEl.style.display = "none";
    answerBEl.style.display = "none";
    answerAEl.classList.remove("correct", "wrong");
    answerBEl.classList.remove("correct", "wrong");
    nextChapterBtn.classList.remove("show");

    setCameraIndicator(cameraStarted);
    updateChapterProgressUI();
    updateAchievementUI();
}

setIdleUI();

function updateTimerDisplay() {
    timeEl.textContent = timeLeft;
}

function resetTimer() {
    clearInterval(timer);
    timeLeft = 10;
    updateTimerDisplay();

    timer = setInterval(() => {
        timeLeft -= 1;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeOut();
        }
    }, 1000);
}

function showCorrectAnswer() {
    const current = QUESTIONS[currentQuestionIndex];
    if (current.correct === "A") {
        answerAEl.classList.add("correct");
    } else {
        answerBEl.classList.add("correct");
    }
}

function registerAnswer(isCorrect) {
    answeredCount += 1;

    if (isCorrect) {
        currentStreak += 1;
        bestStreak = Math.max(bestStreak, currentStreak);
        correctCount += 1;

        const streakBonus = currentStreak >= 2 ? Math.min(currentStreak - 1, 4) * 5 : 0;
        const earnedScore = 10 + streakBonus;
        score += earnedScore;
        scoreEl.textContent = score;

        if (streakBonus > 0) {
            feedbackEl.textContent = `Chính xác! +10 điểm, thưởng chuỗi +${streakBonus}`;
        } else {
            feedbackEl.textContent = "Chính xác! +10 điểm";
        }
    } else {
        currentStreak = 0;
    }

    updateAchievementUI();
}

function handleTimeOut() {
    if (isLocked) return;

    isLocked = true;
    answerAEl.disabled = true;
    answerBEl.disabled = true;

    registerAnswer(false);
    feedbackEl.textContent = "Hết giờ!";
    showCorrectAnswer();

    setTimeout(nextQuestion, 1400);
}

function loadQuestion() {
    const current = QUESTIONS[currentQuestionIndex];
    const chapter = CHAPTERS[current.chapterIndex];

    answerAEl.style.display = "block";
    answerBEl.style.display = "block";
    currentQuestionEl.textContent = String(currentQuestionIndex + 1);
    questionEl.textContent = current.question;

    if (questionSubtitleEl) {
        const questionInChapter = (currentQuestionIndex % QUESTIONS_PER_CHAPTER) + 1;
        questionSubtitleEl.textContent = `${chapter.title} - Câu ${questionInChapter}/${QUESTIONS_PER_CHAPTER}. Nghiêng trái để chọn A, nghiêng phải để chọn B.`;
    }

    if (cameraQuestionBarEl && cameraQTitleEl) {
        cameraQuestionBarEl.style.display = "flex";
        if (cameraQBadgeEl) {
            cameraQBadgeEl.textContent = `CÂU ${currentQuestionIndex + 1}/${QUESTIONS.length}`;
        }
        cameraQTitleEl.textContent = current.question;
    }

    answerAEl.textContent = `A. ${current.A}`;
    answerBEl.textContent = `B. ${current.B}`;
    answerAEl.disabled = false;
    answerBEl.disabled = false;
    answerAEl.classList.remove("correct", "wrong");
    answerBEl.classList.remove("correct", "wrong");

    feedbackEl.textContent = "";
    headStatusEl.textContent = "Đang nhìn thẳng";

    isLocked = false;
    hasChosenByHead = false;
    currentDirection = "center";
    directionStreak = 0;
    waitingForCenter = false;
    centerStreak = 0;
    isWaitingForNextChapter = false;

    nextChapterBtn.classList.remove("show");
    updateChapterProgressUI();
    resetTimer();

    // Luôn đảm bảo màn hình cuộn mượt đến đúng vị trí câu hỏi và camera
    window.requestAnimationFrame(() => {
        scrollToQuestionArea();
    });
}

function openChapterBreak() {
    clearInterval(timer);
    isLocked = true;
    gameStarted = false;
    document.body.classList.remove("game-active");
    if (cameraQuestionBarEl) {
        cameraQuestionBarEl.style.display = "none";
    }
    isWaitingForNextChapter = true;
    waitingForCenter = false;

    const completedChapter = getCurrentChapterIndex();
    questionEl.textContent = `Hoàn thành Chương ${completedChapter}!`;
    if (questionSubtitleEl) {
        questionSubtitleEl.textContent = "Bạn đã vượt qua 5 câu hỏi của chương này. Nhấn “Chương tiếp theo” để chơi tiếp.";
    }

    feedbackEl.textContent = `Điểm hiện tại: ${score}`;
    answerAEl.style.display = "none";
    answerBEl.style.display = "none";
    nextChapterBtn.classList.add("show");

    updateChapterProgressUI();
}

async function endGame() {
    clearInterval(timer);
    isLocked = true;
    gameStarted = false;
    document.body.classList.remove("game-active");
    if (cameraQuestionBarEl) {
        cameraQuestionBarEl.style.display = "none";
    }
    isWaitingForNextChapter = false;
    waitingForCenter = false;

    questionEl.textContent = "Hoàn thành toàn bộ 5 chương!";
    if (questionSubtitleEl) {
        questionSubtitleEl.textContent = "Bạn đã trả lời xong 25 câu hỏi.";
    }

    const synced = await submitQuizSession();
    const unsyncedMessage = getStoredAuth().token
        ? "Không thể đồng bộ điểm với máy chủ. Hãy kiểm tra kết nối rồi thử lại."
        : "Điểm chưa được đồng bộ. Hãy đăng nhập để lưu điểm, lịch sử và thứ hạng.";
    feedbackEl.textContent = synced
        ? `Tổng điểm của bạn: ${score}. Kết quả đã được lưu vào lịch sử chơi.`
        : `Tổng điểm của bạn: ${score}. ${unsyncedMessage}`;
    headStatusEl.textContent = "Đã kết thúc";

    answerAEl.style.display = "none";
    answerBEl.style.display = "none";
    nextChapterBtn.classList.remove("show");

    startBtn.disabled = false;
    startBtn.textContent = "▶ Bắt đầu chơi";
    sessionStartedAt = null;

    updateChapterProgressUI();
    await renderQuizLeaderboard();
}

function nextQuestion() {
    currentQuestionIndex += 1;

    if (currentQuestionIndex >= QUESTIONS.length) {
        endGame();
        return;
    }

    if (currentQuestionIndex % QUESTIONS_PER_CHAPTER === 0) {
        openChapterBreak();
        return;
    }

    loadQuestion();
}

function startWaitForCenter() {
    waitingForCenter = true;
    centerStreak = 0;
    feedbackEl.textContent = "Hãy đưa đầu về chính giữa để sang câu tiếp theo";
}

function checkAnswer(selected, inputSource = "manual") {
    if (isLocked) return;

    isLocked = true;
    clearInterval(timer);

    answerAEl.disabled = true;
    answerBEl.disabled = true;

    const current = QUESTIONS[currentQuestionIndex];
    const isCorrect = selected === current.correct;

    registerAnswer(isCorrect);

    if (isCorrect) {
        if (selected === "A") {
            answerAEl.classList.add("correct");
        } else {
            answerBEl.classList.add("correct");
        }
    } else {
        if (selected === "A") {
            answerAEl.classList.add("wrong");
        } else {
            answerBEl.classList.add("wrong");
        }
        showCorrectAnswer();
    }

    if (inputSource === "head") {
        setTimeout(startWaitForCenter, 1000);
    } else {
        setTimeout(nextQuestion, 1400);
    }
}

function stopCamera() {
    if (streamRef) {
        streamRef.getTracks().forEach((track) => track.stop());
    }

    streamRef = null;
    webcamEl.srcObject = null;
    cameraStarted = false;
    setCameraIndicator(false);
}

async function setupCamera() {
    if (cameraStarted && streamRef && webcamEl.readyState >= 2) return true;

    try {
        if (!streamRef) {
            streamRef = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: "user",
                },
                audio: false,
            });
            webcamEl.srcObject = streamRef;
        }

        if (webcamEl.readyState < 2) {
            await new Promise((resolve) => {
                webcamEl.addEventListener("loadeddata", resolve, { once: true });
            });
        }

        await webcamEl.play();
        cameraStarted = true;
        setCameraIndicator(true);
        return true;
    } catch (error) {
        headStatusEl.textContent = "Không mở được camera";
        setCameraIndicator(false);
        console.error("Camera error:", error);
        return false;
    }
}

async function createFaceLandmarker() {
    if (faceLandmarker) return true;

    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        const modelCandidates = [
            "../../models/face_landmarker.task",
            "/models/face_landmarker.task",
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        ];

        for (const modelAssetPath of modelCandidates) {
            try {
                faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: { modelAssetPath },
                    runningMode: "VIDEO",
                    numFaces: 1,
                    outputFaceBlendshapes: false,
                    outputFacialTransformationMatrixes: false,
                });
                return true;
            } catch (innerError) {
                console.warn("Model path failed:", modelAssetPath, innerError);
            }
        }

        headStatusEl.textContent = "Không tải được model nhận diện";
        return false;
    } catch (error) {
        headStatusEl.textContent = "Không khởi tạo được MediaPipe";
        console.error("MediaPipe error:", error);
        return false;
    }
}

function handleHeadDirection(direction) {
    if (!gameStarted || isLocked || hasChosenByHead) return;

    if (direction === "left") {
        hasChosenByHead = true;
        headStatusEl.textContent = "Nghiêng trái";
        checkAnswer("A", "head");
    } else if (direction === "right") {
        hasChosenByHead = true;
        headStatusEl.textContent = "Nghiêng phải";
        checkAnswer("B", "head");
    } else {
        headStatusEl.textContent = "Đang nhìn thẳng";
    }
}

function handleWaitForCenter(direction) {
    if (!waitingForCenter) return;

    if (direction === "center") {
        centerStreak += 1;
        if (centerStreak >= 5) {
            waitingForCenter = false;
            centerStreak = 0;
            feedbackEl.textContent = "";
            nextQuestion();
        }
        return;
    }

    centerStreak = 0;
    feedbackEl.textContent = "Hãy đưa đầu về chính giữa để sang câu tiếp theo";
}

function detectDirection(newDirection) {
    if (!gameStarted) return;

    if (waitingForCenter) {
        handleWaitForCenter(newDirection);
        return;
    }

    if (isLocked) return;

    if (newDirection === "center") {
        currentDirection = "center";
        directionStreak = 0;
        headStatusEl.textContent = "Đang nhìn thẳng";
        return;
    }

    if (newDirection === currentDirection) {
        directionStreak += 1;
    } else {
        currentDirection = newDirection;
        directionStreak = 1;
    }

    if ((newDirection === "left" || newDirection === "right") && directionStreak >= 3) {
        handleHeadDirection(newDirection);
        directionStreak = 0;
    }
}

function getHeadDirection(landmarks) {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const eyeDx = rightEye.x - leftEye.x;
    const eyeDy = rightEye.y - leftEye.y;

    const rawRollDeg = (Math.atan2(eyeDy, eyeDx) * 180) / Math.PI;
    smoothRollDeg = smoothRollDeg * 0.8 + rawRollDeg * 0.2;

    const tiltThresholdDeg = 20;
    if (smoothRollDeg > tiltThresholdDeg) return "left";
    if (smoothRollDeg < -tiltThresholdDeg) return "right";
    return "center";
}

function detectFrame() {
    if (!faceLandmarker || webcamEl.readyState < 2 || !cameraStarted) {
        requestAnimationFrame(detectFrame);
        return;
    }

    const nowMs = performance.now();
    if (webcamEl.currentTime !== lastVideoTime) {
        lastVideoTime = webcamEl.currentTime;
        const results = faceLandmarker.detectForVideo(webcamEl, nowMs);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const direction = getHeadDirection(results.faceLandmarks[0]);
            detectDirection(direction);
        } else if (gameStarted && !isLocked) {
            headStatusEl.textContent = "Không thấy khuôn mặt";
            currentDirection = "center";
            directionStreak = 0;
        }
    }

    requestAnimationFrame(detectFrame);
}

async function initSystem() {
    const cameraOk = await setupCamera();
    if (!cameraOk) return false;

    const modelOk = await createFaceLandmarker();
    if (!modelOk) return false;

    if (!detectLoopStarted) {
        detectLoopStarted = true;
        detectFrame();
    }

    return true;
}

async function startGame() {
    if (isInitializing || gameStarted) return;

    // Cuộn màn hình ngay khi nhấn nút bắt đầu để người dùng nhìn thấy câu hỏi
    scrollToQuestionArea();

    isInitializing = true;
    startBtn.disabled = true;
    startBtn.textContent = "Đang khởi tạo...";
    headStatusEl.textContent = "Đang khởi tạo...";

    try {
        const ok = await initSystem();
        if (!ok || !faceLandmarker) {
            startBtn.textContent = "▶ Bắt đầu chơi";
            startBtn.disabled = false;
            return;
        }

        currentQuestionIndex = 0;
        score = 0;
        currentStreak = 0;
        bestStreak = 0;
        correctCount = 0;
        answeredCount = 0;
        sessionStartedAt = Date.now();
        sessionSaved = false;

        scoreEl.textContent = "0";
        currentQuestionEl.textContent = "1";

        gameStarted = true;
        document.body.classList.add("game-active");
        isLocked = false;
        isWaitingForNextChapter = false;
        hasChosenByHead = false;
        directionStreak = 0;
        currentDirection = "center";
        waitingForCenter = false;
        centerStreak = 0;

        startBtn.textContent = "Đang chơi...";
        startBtn.disabled = true;
        cameraToggleBtn.textContent = "📷 Tắt camera";
        nextChapterBtn.classList.remove("show");

        updateAchievementUI();
        loadQuestion();

        // Tự động đẩy màn hình lên vùng câu hỏi và camera một lần nữa sau khi luồng video ổn định
        window.requestAnimationFrame(() => {
            scrollToQuestionArea();
            setTimeout(scrollToQuestionArea, 120);
        });
    } finally {
        isInitializing = false;
    }
}

async function restartGame() {
    clearInterval(timer);
    gameStarted = false;
    document.body.classList.remove("game-active");
    isLocked = false;
    waitingForCenter = false;
    centerStreak = 0;
    isWaitingForNextChapter = false;
    nextChapterBtn.classList.remove("show");
    sessionStartedAt = null;
    sessionSaved = false;

    setIdleUI();
    scrollToQuestionArea();
    await startGame();
}

function startNextChapter() {
    if (!isWaitingForNextChapter) return;

    isWaitingForNextChapter = false;
    gameStarted = true;
    document.body.classList.add("game-active");
    headStatusEl.textContent = cameraStarted ? "Đang nhìn thẳng" : "Camera đang tắt";
    loadQuestion();
    window.requestAnimationFrame(() => {
        scrollToQuestionArea();
    });
}

async function toggleCamera() {
    if (cameraStarted) {
        stopCamera();
        cameraToggleBtn.textContent = "📷 Bật camera";
        headStatusEl.textContent = "Camera đang tắt";
        return;
    }

    const ok = await setupCamera();
    if (ok) {
        cameraToggleBtn.textContent = "📷 Tắt camera";
        headStatusEl.textContent = gameStarted ? "Đang nhìn thẳng" : "Camera đã bật";
    }
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);
cameraToggleBtn.addEventListener("click", toggleCamera);
nextChapterBtn.addEventListener("click", startNextChapter);

answerAEl.addEventListener("click", () => {
    if (!gameStarted || isWaitingForNextChapter) return;
    checkAnswer("A");
});

answerBEl.addEventListener("click", () => {
    if (!gameStarted || isWaitingForNextChapter) return;
    checkAnswer("B");
});

document.addEventListener("keydown", (e) => {
    if (!gameStarted || isLocked || isWaitingForNextChapter) return;
    if (e.key === "a" || e.key === "A") checkAnswer("A");
    if (e.key === "d" || e.key === "D") checkAnswer("B");
});

document.addEventListener("keydown", (e) => {
    if (!gameStarted || isLocked || isWaitingForNextChapter) return;
    if (e.key === "ArrowLeft") detectDirection("left");
    if (e.key === "ArrowRight") detectDirection("right");
    if (e.key === "ArrowUp" || e.key === "ArrowDown") detectDirection("center");
});

renderQuizLeaderboard();
