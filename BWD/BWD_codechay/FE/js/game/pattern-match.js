const TOTAL_QUESTIONS = 10;
const POINT_PER_CORRECT = 15;
const TIME_PER_QUESTION = 15;

// Mỗi họa tiết có vùng (hotzone) trên ảnh trống đồng (tọa độ % so với ảnh)
// Mỗi zone là {x, y, width, height} tính theo phần trăm
const MOTIFS = [
    {
        id: "chim-lac",
        name: "Chim Lạc",
        clue: "chim Lạc",
        knowledge: "Chim Lạc là biểu tượng quen thuộc, thường bay theo vòng tròn trên mặt trống đồng Đông Sơn.",
        zones: [
            { x: 28, y: 35, width: 14, height: 10 },
            { x: 58, y: 35, width: 14, height: 10 },
        ],
    },
    {
        id: "ngoi-sao",
        name: "Ngôi sao",
        clue: "ngôi sao (mặt trời)",
        knowledge: "Ngôi sao nhiều cánh ở trung tâm mặt trống tượng trưng cho mặt trời — nguồn sống của cư dân Lạc Việt.",
        zones: [
            { x: 40, y: 40, width: 20, height: 20 },
        ],
    },
    {
        id: "thuyen",
        name: "Thuyền",
        clue: "thuyền",
        knowledge: "Hình thuyền trên trống đồng cho thấy đời sống sông nước và nghi lễ cầu mưa của người Đông Sơn.",
        zones: [
            { x: 15, y: 60, width: 18, height: 8 },
            { x: 67, y: 60, width: 18, height: 8 },
        ],
    },
    {
        id: "nguoi-mua",
        name: "Người múa",
        clue: "người múa (lễ hội)",
        knowledge: "Hình người múa trong lễ hội thể hiện sinh hoạt cộng đồng và nghi lễ tín ngưỡng của người Đông Sơn.",
        zones: [
            { x: 20, y: 48, width: 12, height: 10 },
            { x: 68, y: 48, width: 12, height: 10 },
        ],
    },
    {
        id: "hoa-van-dong-tam",
        name: "Hoa văn đồng tâm",
        clue: "vòng hoa văn đồng tâm",
        knowledge: "Các vòng tròn đồng tâm tạo nhịp điệu cho mặt trống, phân chia các lớp nội dung biểu tượng.",
        zones: [
            { x: 10, y: 18, width: 80, height: 8 },
            { x: 10, y: 74, width: 80, height: 8 },
        ],
    },
    {
        id: "huou",
        name: "Hươu",
        clue: "hươu (động vật)",
        knowledge: "Hình hươu trên trống đồng phản ánh hệ sinh thái rừng nhiệt đới nơi cư dân Đông Sơn sinh sống.",
        zones: [
            { x: 35, y: 62, width: 12, height: 10 },
            { x: 53, y: 62, width: 12, height: 10 },
        ],
    },
];

const POSITIVE_FEEDBACK = [
    "Chính xác! Em đã tìm đúng vùng họa tiết.",
    "Rất tốt! Mắt em rất tinh.",
    "Tuyệt vời! Đây đúng là vị trí của họa tiết.",
    "Xuất sắc! Em nhận diện rất nhanh.",
];

const NEGATIVE_FEEDBACK = [
    "Chưa đúng rồi, vùng em chọn không phải họa tiết cần tìm.",
    "Gần đúng rồi, hãy quan sát kỹ hơn nhé.",
    "Không sao, cùng xem đáp án đúng ở đâu nhé.",
];

// DOM elements
const introCard = document.getElementById("introCard");
const playCard = document.getElementById("playCard");
const resultCard = document.getElementById("resultCard");

const startBtn = document.getElementById("startBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

const scoreValue = document.getElementById("scoreValue");
const currentQuestion = document.getElementById("currentQuestion");
const timeValue = document.getElementById("timeValue");
const questionText = document.getElementById("questionText");
const feedbackMain = document.getElementById("feedbackMain");
const feedbackKnowledge = document.getElementById("feedbackKnowledge");

const finalScore = document.getElementById("finalScore");
const correctCountEl = document.getElementById("correctCount");
const wrongCountEl = document.getElementById("wrongCount");
const accuracyValue = document.getElementById("accuracyValue");
const resultComment = document.getElementById("resultComment");

const drumImage = document.getElementById("drumImage");
const imageContainer = document.getElementById("imageContainer");

let score = 0;
let questionIndex = 0;
let correctCount = 0;
let timer = null;
let timeLeft = TIME_PER_QUESTION;
let currentMotif = null;
let isLocked = false;
let clickMarkers = [];

function shuffle(arr) {
    const cloned = [...arr];
    for (let i = cloned.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }
    return cloned;
}

function sampleOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function buildQuestionQueue() {
    // Tạo danh sách câu hỏi: lấy ngẫu nhiên từ MOTIFS, lặp lại nếu cần
    const shuffled = shuffle(MOTIFS);
    const queue = [];
    while (queue.length < TOTAL_QUESTIONS) {
        const remaining = TOTAL_QUESTIONS - queue.length;
        queue.push(...shuffle(MOTIFS).slice(0, remaining));
    }
    return queue;
}

let questionQueue = [];

function clearMarkers() {
    clickMarkers.forEach((el) => el.remove());
    clickMarkers = [];
    // Remove zone highlights
    imageContainer.querySelectorAll(".zone-highlight").forEach((el) => el.remove());
}

function showZoneHighlight(zone, isCorrect) {
    const highlight = document.createElement("div");
    highlight.className = `zone-highlight ${isCorrect ? "correct" : "answer"}`;
    highlight.style.left = `${zone.x}%`;
    highlight.style.top = `${zone.y}%`;
    highlight.style.width = `${zone.width}%`;
    highlight.style.height = `${zone.height}%`;
    imageContainer.appendChild(highlight);
    clickMarkers.push(highlight);
}

function addClickMarker(xPercent, yPercent, isCorrect) {
    const marker = document.createElement("div");
    marker.className = `click-marker ${isCorrect ? "correct" : "wrong"}`;
    marker.style.left = `${xPercent}%`;
    marker.style.top = `${yPercent}%`;
    imageContainer.appendChild(marker);
    clickMarkers.push(marker);
}

function isInsideZone(clickX, clickY, zone) {
    return (
        clickX >= zone.x &&
        clickX <= zone.x + zone.width &&
        clickY >= zone.y &&
        clickY <= zone.y + zone.height
    );
}

function checkClick(clickXPercent, clickYPercent) {
    if (!currentMotif) return false;
    return currentMotif.zones.some((zone) =>
        isInsideZone(clickXPercent, clickYPercent, zone)
    );
}

function handleImageClick(event) {
    if (isLocked) return;

    const rect = drumImage.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const xPercent = (clickX / rect.width) * 100;
    const yPercent = (clickY / rect.height) * 100;

    isLocked = true;
    clearInterval(timer);

    const isCorrect = checkClick(xPercent, yPercent);

    addClickMarker(xPercent, yPercent, isCorrect);

    if (isCorrect) {
        score += POINT_PER_CORRECT;
        correctCount += 1;
        // Highlight the matched zone
        const matchedZone = currentMotif.zones.find((zone) =>
            isInsideZone(xPercent, yPercent, zone)
        );
        if (matchedZone) showZoneHighlight(matchedZone, true);

        showFeedback(
            sampleOne(POSITIVE_FEEDBACK) + ` +${POINT_PER_CORRECT} điểm.`,
            currentMotif.knowledge
        );
    } else {
        // Show where the correct zones are
        currentMotif.zones.forEach((zone) => showZoneHighlight(zone, false));
        showFeedback(
            `${sampleOne(NEGATIVE_FEEDBACK)} Đáp án đúng là vùng được đánh dấu.`,
            currentMotif.knowledge
        );
    }

    scoreValue.textContent = String(score);
    setTimeout(nextQuestion, 2000);
}

function startQuestionTimer() {
    clearInterval(timer);
    timeLeft = TIME_PER_QUESTION;
    timeValue.textContent = String(timeLeft);

    timer = setInterval(() => {
        timeLeft -= 1;
        timeValue.textContent = String(timeLeft);

        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

function showFeedback(mainText, knowledgeText) {
    feedbackMain.textContent = mainText;
    feedbackKnowledge.textContent = knowledgeText;
}

function handleTimeout() {
    if (isLocked) return;
    isLocked = true;

    // Show correct zones
    currentMotif.zones.forEach((zone) => showZoneHighlight(zone, false));
    showFeedback(
        `Hết thời gian! Đáp án đúng là vùng được đánh dấu trên ảnh.`,
        currentMotif.knowledge
    );
    setTimeout(nextQuestion, 2000);
}

function nextQuestion() {
    questionIndex += 1;

    if (questionIndex >= TOTAL_QUESTIONS) {
        finishGame();
        return;
    }

    renderQuestion();
}

function renderQuestion() {
    isLocked = false;
    clearMarkers();

    currentMotif = questionQueue[questionIndex];

    currentQuestion.textContent = String(questionIndex + 1);
    questionText.textContent = `Hãy click vào vùng có họa tiết: ${currentMotif.clue}`;

    showFeedback("Click vào đúng vị trí họa tiết trên ảnh trống đồng.", "");
    startQuestionTimer();
}

function getComment(finalPoint) {
    if (finalPoint <= 45) return "Em hãy quan sát kỹ hơn các chi tiết trên trống đồng nhé.";
    if (finalPoint <= 105) return "Em đang làm rất tốt, tiếp tục phát huy nhé!";
    return "Tuyệt vời! Em là chuyên gia nhận diện họa tiết Đông Sơn.";
}

function finishGame() {
    clearInterval(timer);
    clearMarkers();

    const wrongCount = TOTAL_QUESTIONS - correctCount;
    const accuracy = Math.round((correctCount / TOTAL_QUESTIONS) * 100);

    finalScore.textContent = String(score);
    correctCountEl.textContent = String(correctCount);
    wrongCountEl.textContent = String(wrongCount);
    accuracyValue.textContent = `${accuracy}%`;
    resultComment.textContent = getComment(score);

    playCard.classList.add("hidden");
    resultCard.classList.remove("hidden");
}

function startGame() {
    score = 0;
    questionIndex = 0;
    correctCount = 0;
    isLocked = false;

    scoreValue.textContent = "0";
    questionQueue = buildQuestionQueue();

    introCard.classList.add("hidden");
    resultCard.classList.add("hidden");
    playCard.classList.remove("hidden");

    renderQuestion();
}

// Event listeners
startBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
drumImage.addEventListener("click", handleImageClick);
