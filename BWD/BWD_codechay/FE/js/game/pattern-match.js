const TOTAL_QUESTIONS = 10;
const POINT_PER_CORRECT = 15;
const TIME_PER_QUESTION = 10;

const MOTIFS = [
    {
        id: "chim-lac",
        name: "Chim Lạc",
        symbol: "🕊",
        short: "Dáng chim mỏ dài, cánh dang rộng.",
        clue: "chim Lạc",
        knowledge: "Chim Lạc là biểu tượng quen thuộc thường xuất hiện trên trống đồng Đông Sơn.",
    },
    {
        id: "ngoi-sao",
        name: "Ngôi sao",
        symbol: "✷",
        short: "Nhiều tia tỏa ra, thường nằm ở trung tâm.",
        clue: "ngôi sao",
        knowledge: "Ngôi sao ở trung tâm mặt trống thường tượng trưng cho mặt trời.",
    },
    {
        id: "thuyen",
        name: "Thuyền",
        symbol: "⛵",
        short: "Hình dài nằm ngang, gắn với sông nước.",
        clue: "thuyền",
        knowledge: "Hình ảnh thuyền cho thấy cuộc sống người xưa gắn bó với sông nước.",
    },
    {
        id: "con-nguoi",
        name: "Con người",
        symbol: "🧍",
        short: "Hình người trong cảnh sinh hoạt, lễ hội.",
        clue: "con người",
        knowledge: "Hình người trên trống đồng thể hiện sinh hoạt cộng đồng, lễ hội và nghi lễ.",
    },
];

const POSITIVE_FEEDBACK = [
    "Chính xác! Em chọn đúng rồi.",
    "Rất tốt! Em nhận diện rất nhanh.",
    "Tuyệt vời! Đây là đáp án đúng.",
];

const NEGATIVE_FEEDBACK = [
    "Chưa đúng rồi, cùng xem lại nhé.",
    "Gần đúng rồi, đáp án nằm ở ô khác.",
    "Không sao, mình ghi nhớ để làm tốt câu sau.",
];

const introCard = document.getElementById("introCard");
const playCard = document.getElementById("playCard");
const resultCard = document.getElementById("resultCard");

const startBtn = document.getElementById("startBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

const scoreValue = document.getElementById("scoreValue");
const currentQuestion = document.getElementById("currentQuestion");
const timeValue = document.getElementById("timeValue");
const questionText = document.getElementById("questionText");
const optionGrid = document.getElementById("optionGrid");
const feedbackMain = document.getElementById("feedbackMain");
const feedbackKnowledge = document.getElementById("feedbackKnowledge");

const finalScore = document.getElementById("finalScore");
const correctCountEl = document.getElementById("correctCount");
const wrongCountEl = document.getElementById("wrongCount");
const accuracyValue = document.getElementById("accuracyValue");
const resultComment = document.getElementById("resultComment");

let score = 0;
let questionIndex = 0;
let correctCount = 0;
let timer = null;
let timeLeft = TIME_PER_QUESTION;
let currentRound = null;
let isLocked = false;

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

function buildRound() {
    const target = sampleOne(MOTIFS);
    const options = shuffle(MOTIFS).slice(0, 4);

    if (!options.some((item) => item.id === target.id)) {
        options[Math.floor(Math.random() * options.length)] = target;
    }

    return {
        target,
        options: shuffle(options),
    };
}

function renderOptions(options) {
    optionGrid.innerHTML = "";

    options.forEach((option) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.type = "button";
        btn.dataset.id = option.id;

        btn.innerHTML = `
            <div class="option-head">
                <span class="option-symbol">${option.symbol}</span>
                <span class="option-name">${option.name}</span>
            </div>
            <p class="option-note">${option.short}</p>
        `;

        btn.addEventListener("click", () => handleAnswer(option.id, btn));
        optionGrid.appendChild(btn);
    });
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

function lockOptions() {
    isLocked = true;
    optionGrid.querySelectorAll(".option-btn").forEach((btn) => {
        btn.disabled = true;
    });
}

function highlightCorrectAnswer() {
    optionGrid.querySelectorAll(".option-btn").forEach((btn) => {
        if (btn.dataset.id === currentRound.target.id) {
            btn.classList.add("correct");
        }
    });
}

function nextQuestion() {
    questionIndex += 1;

    if (questionIndex >= TOTAL_QUESTIONS) {
        finishGame();
        return;
    }

    renderQuestion();
}

function handleAnswer(selectedId, selectedBtn) {
    if (isLocked) return;

    lockOptions();
    clearInterval(timer);

    const isCorrect = selectedId === currentRound.target.id;

    if (isCorrect) {
        score += POINT_PER_CORRECT;
        correctCount += 1;
        selectedBtn.classList.add("correct");
        showFeedback(
            sampleOne(POSITIVE_FEEDBACK) + ` +${POINT_PER_CORRECT} điểm.`,
            currentRound.target.knowledge
        );
    } else {
        selectedBtn.classList.add("wrong");
        highlightCorrectAnswer();
        showFeedback(
            `${sampleOne(NEGATIVE_FEEDBACK)} Đáp án đúng là ${currentRound.target.name}.`,
            currentRound.target.knowledge
        );
    }

    scoreValue.textContent = String(score);
    setTimeout(nextQuestion, 1200);
}

function handleTimeout() {
    if (isLocked) return;

    lockOptions();
    highlightCorrectAnswer();
    showFeedback(
        `Hết thời gian. Đáp án đúng là ${currentRound.target.name}.`,
        currentRound.target.knowledge
    );
    setTimeout(nextQuestion, 1200);
}

function renderQuestion() {
    isLocked = false;
    currentRound = buildRound();

    currentQuestion.textContent = String(questionIndex + 1);
    questionText.textContent = `Hãy chọn họa tiết ${currentRound.target.clue}`;

    renderOptions(currentRound.options);
    showFeedback("Em hãy quan sát thật kỹ trước khi chọn.", "");
    startQuestionTimer();
}

function getComment(finalPoint) {
    if (finalPoint <= 45) return "Em hãy quan sát kỹ hơn nhé.";
    if (finalPoint <= 105) return "Em đang làm rất tốt rồi.";
    return "Tuyệt vời, em là người rất tinh mắt.";
}

function finishGame() {
    clearInterval(timer);

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

    introCard.classList.add("hidden");
    resultCard.classList.add("hidden");
    playCard.classList.remove("hidden");

    renderQuestion();
}

startBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
