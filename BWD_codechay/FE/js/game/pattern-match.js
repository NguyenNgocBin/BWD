const TOTAL_QUESTIONS = 10;
const POINT_PER_CORRECT = 15;
const TIME_PER_QUESTION = 12;

// Bộ câu hỏi dựa trên các họa tiết trống đồng Đông Sơn
// Mỗi câu hỏi hiển thị 1 hình ảnh họa tiết, người chơi chọn đúng tên
const QUESTIONS_BANK = [
    {
        id: "q1",
        image: "../../images/hoatiet/chim-lac-ngoclu.png",
        question: "Đây là họa tiết gì trên trống đồng?",
        correctAnswer: "Chim Lạc (chim bay)",
        options: ["Chim Lạc (chim bay)", "Cò thìa", "Bồ nông", "Chim công"],
        knowledge: "Chim Lạc là biểu tượng đặc trưng nhất trên trống đồng Đông Sơn, thường được khắc bay theo vòng tròn quanh ngôi sao trung tâm. Hình dáng mỏ dài, cánh dang rộng, đuôi xòe.",
    },
    {
        id: "q2",
        image: "../../images/hoatiet/cong-ngoclu.png",
        question: "Đây là loài chim nào trên trống Ngọc Lũ?",
        correctAnswer: "Chim công (peacock)",
        options: ["Chim công (peacock)", "Chim Lạc", "Gà lôi", "Cò"],
        knowledge: "Chim công trên trống Ngọc Lũ Miếu Môn có dáng đứng, đầu có mào, đuôi dài trang trí hoa văn. Khác với chim Lạc bay, công thường được khắc ở tư thế đứng.",
    },
    {
        id: "q3",
        image: "../../images/hoatiet/co-thia.png",
        question: "Loài chim này có đặc điểm gì nổi bật?",
        correctAnswer: "Cò thìa (spoonbill) — mỏ dẹt hình thìa",
        options: ["Cò thìa (spoonbill) — mỏ dẹt hình thìa", "Bồ nông — túi cổ họng lớn", "Chim Lạc — cánh dang rộng", "Cò trắng — chân cao mỏ nhọn"],
        knowledge: "Cò thìa (spoonbill) có mỏ dẹt đặc trưng hình chiếc thìa, dùng để lọc thức ăn trong nước. Trên trống đồng, cò thìa được khắc với thân hình có sọc ngang.",
    },
    {
        id: "q4",
        image: "../../images/hoatiet/bo-nong.png",
        question: "Đây là họa tiết chim gì?",
        correctAnswer: "Bồ nông (pelican)",
        options: ["Bồ nông (pelican)", "Chim Lạc", "Cò thìa", "Chim trích nước"],
        knowledge: "Bồ nông (bồ nông) trên trống đồng có dáng đứng, thân to, mỏ dài và túi cổ họng đặc trưng. Hình vẽ thường có các vòng tròn trang trí trên thân.",
    },
    {
        id: "q5",
        image: "../../images/hoatiet/co-stork.png",
        question: "Loài chim nào đang ngậm mồi trong hình?",
        correctAnswer: "Cò (stork) ngậm cá/mồi",
        options: ["Cò (stork) ngậm cá/mồi", "Chim Lạc đang bay", "Bồ nông đang ăn", "Diệc xám"],
        knowledge: "Cò (stork) trên trống đồng thường được khắc với mỏ dài nhọn, đôi khi ngậm cá hoặc con mồi, phản ánh đời sống sông nước của cư dân Đông Sơn.",
    },
    {
        id: "q6",
        image: "../../images/hoatiet/ga-loi-nha-san.png",
        question: "Họa tiết này mô tả cảnh gì?",
        correctAnswer: "Chim (gà lôi) đậu trên mái nhà sàn",
        options: ["Chim (gà lôi) đậu trên mái nhà sàn", "Chim Lạc bay trên thuyền", "Công đứng trên cây", "Cò đậu trên cột"],
        knowledge: "Trên trống đồng Đông Sơn, hình chim đậu trên mái nhà sàn rất phổ biến, thể hiện mối quan hệ giữa con người và thiên nhiên trong đời sống hàng ngày.",
    },
    {
        id: "q7",
        image: "../../images/hoatiet/chim-nha-san-hoanhha.png",
        question: "Đây là cảnh trên trống đồng nào?",
        correctAnswer: "Chim trên mái nhà sàn — trống Hoành Hạ",
        options: ["Chim trên mái nhà sàn — trống Hoành Hạ", "Lễ hội trên trống Ngọc Lũ", "Thuyền chiến trống Sông Đà", "Cảnh săn bắn trống Đào Thịnh"],
        knowledge: "Trống Hoành Hạ nổi tiếng với hình ảnh nhà sàn có chim đậu trên mái, bên trong có người đang sinh hoạt, thể hiện kiến trúc và đời sống cộng đồng.",
    },
    {
        id: "q8",
        image: "../../images/hoatiet/chim-trich-nuoc.png",
        question: "Đây là loài chim gì?",
        correctAnswer: "Chim trích nước (purple swamphen)",
        options: ["Chim trích nước (purple swamphen)", "Chim cút", "Gà rừng", "Vịt trời"],
        knowledge: "Chim trích nước (purple swamphen) có thân tròn, chân to, sống ở vùng đầm lầy. Trên trống đồng, chúng được khắc với thân có chấm tròn đặc trưng.",
    },
    {
        id: "q9",
        image: "../../images/hoatiet/chim-lac-songda.png",
        question: "Chim Lạc trên trống Sông Đà có đặc điểm gì?",
        correctAnswer: "Mỏ dài, cánh có sọc, bay ngang",
        options: ["Mỏ dài, cánh có sọc, bay ngang", "Đuôi xòe, đứng yên", "Mỏ ngắn, cánh cụp", "Thân tròn, chân cao"],
        knowledge: "Chim Lạc trên trống Sông Đà có dáng bay ngang đặc trưng với mỏ dài thẳng, cánh có các đường sọc song song, thân thon dài — khác biệt với chim Lạc trên các trống khác.",
    },
    {
        id: "q10",
        image: "../../images/hoatiet/chim-lac-hoangha.png",
        question: "Chim Lạc trên trống Hoàng Hạ khác gì so với trống Ngọc Lũ?",
        correctAnswer: "Thân ngắn hơn, cánh vuông góc hơn",
        options: ["Thân ngắn hơn, cánh vuông góc hơn", "Mỏ cong, đuôi dài hơn", "Giống hệt nhau", "Có thêm chân dài"],
        knowledge: "Mỗi trống đồng có phong cách khắc chim Lạc riêng. Trống Hoàng Hạ có chim Lạc thân ngắn, cánh vuông góc hơn so với dáng bay mềm mại trên trống Ngọc Lũ.",
    },
    {
        id: "q11",
        image: "../../images/hoatiet/cong-mieu-mon.png",
        question: "Đây là chim gì trên trống Miếu Môn?",
        correctAnswer: "Chim công (peacock)",
        options: ["Chim công (peacock)", "Đại bàng", "Chim Lạc", "Vẹt"],
        knowledge: "Chim công trên trống Miếu Môn có dáng đứng đặc trưng với mào trên đầu, thân trang trí hoa văn hình mắt, chân to khỏe.",
    },
    {
        id: "q12",
        image: "../../images/hoatiet/chim-lac-phalong.png",
        question: "Chim Lạc trên trống Pha Long thuộc vùng nào?",
        correctAnswer: "Vùng núi phía Bắc (Lào Cai)",
        options: ["Vùng núi phía Bắc (Lào Cai)", "Đồng bằng sông Hồng", "Miền Trung", "Nam Bộ"],
        knowledge: "Trống Pha Long được tìm thấy ở Lào Cai, vùng núi phía Bắc. Chim Lạc trên trống này có nét khắc đơn giản hơn, phản ánh phong cách nghệ thuật địa phương.",
    },
    {
        id: "q13",
        image: "../../images/hoatiet/chim-lac-daothinh.png",
        question: "Trống Đào Thịnh nổi tiếng vì điều gì?",
        correctAnswer: "Là trống đồng lớn nhất Đông Nam Á được tìm thấy",
        options: ["Là trống đồng lớn nhất Đông Nam Á được tìm thấy", "Có nhiều chim Lạc nhất", "Được làm bằng vàng", "Có hình rồng"],
        knowledge: "Trống Đào Thịnh (Yên Bái) là một trong những trống đồng lớn và đẹp nhất, với hoa văn phong phú bao gồm chim Lạc, thuyền, người và các hình hình học.",
    },
    {
        id: "q14",
        image: "../../images/hoatiet/chim-lac-vien.png",
        question: "Có bao nhiêu dạng chim Lạc khác nhau đã được tìm thấy trên các trống đồng?",
        correctAnswer: "Hơn 15 dạng từ các trống khác nhau",
        options: ["Hơn 15 dạng từ các trống khác nhau", "Chỉ có 1 dạng duy nhất", "3 dạng", "Không xác định được"],
        knowledge: "Các nhà khảo cổ đã ghi nhận hơn 15 biến thể chim Lạc từ các trống: Hàng Bún, Hoàng Hạ, Viên, Sông Đà, Ngọc Lũ I, Quảng Xương, Đào Thịnh, Pha Long, Cửu Cao, Phú Duy, Duy Tiên, Việt Khê, Thôn Mống, Miếu Môn...",
    },
    {
        id: "q15",
        image: "../../images/hoatiet/chim-lac-quangxuong.png",
        question: "Chim Lạc trên trống Quảng Xương có đặc điểm gì?",
        correctAnswer: "Mỏ rất dài, thân có vòng tròn trang trí",
        options: ["Mỏ rất dài, thân có vòng tròn trang trí", "Không có cánh", "Đang đứng yên", "Mỏ ngắn cong"],
        knowledge: "Chim Lạc trên trống Quảng Xương (Thanh Hóa) nổi bật với mỏ rất dài, thân có các vòng tròn đồng tâm trang trí, cánh có đường sọc rõ ràng.",
    },
];

const POSITIVE_FEEDBACK = [
    "Chính xác! Em nhận diện rất tốt.",
    "Tuyệt vời! Đây là đáp án đúng.",
    "Rất giỏi! Em hiểu rõ về họa tiết Đông Sơn.",
    "Xuất sắc! Mắt em rất tinh.",
];

const NEGATIVE_FEEDBACK = [
    "Chưa đúng rồi, cùng xem lại nhé.",
    "Gần đúng rồi, đáp án nằm ở ô khác.",
    "Không sao, mình ghi nhớ để làm tốt câu sau.",
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
const optionGrid = document.getElementById("optionGrid");
const feedbackMain = document.getElementById("feedbackMain");
const feedbackKnowledge = document.getElementById("feedbackKnowledge");
const motifImage = document.getElementById("motifImage");

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
let currentQ = null;
let isLocked = false;
let questionQueue = [];

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
    const shuffled = shuffle(QUESTIONS_BANK);
    return shuffled.slice(0, TOTAL_QUESTIONS);
}

function renderOptions(options) {
    optionGrid.innerHTML = "";

    options.forEach((optionText, index) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.type = "button";
        btn.dataset.answer = optionText;

        btn.innerHTML = `
            <div class="option-head">
                <span class="option-index">${String.fromCharCode(65 + index)}</span>
                <span class="option-text">${optionText}</span>
            </div>
        `;

        btn.addEventListener("click", () => handleAnswer(optionText, btn));
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
        if (btn.dataset.answer === currentQ.correctAnswer) {
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

function handleAnswer(selectedAnswer, selectedBtn) {
    if (isLocked) return;

    lockOptions();
    clearInterval(timer);

    const isCorrect = selectedAnswer === currentQ.correctAnswer;

    if (isCorrect) {
        score += POINT_PER_CORRECT;
        correctCount += 1;
        selectedBtn.classList.add("correct");
        showFeedback(
            sampleOne(POSITIVE_FEEDBACK) + ` +${POINT_PER_CORRECT} điểm.`,
            currentQ.knowledge
        );
    } else {
        selectedBtn.classList.add("wrong");
        highlightCorrectAnswer();
        showFeedback(
            `${sampleOne(NEGATIVE_FEEDBACK)} Đáp án đúng: ${currentQ.correctAnswer}.`,
            currentQ.knowledge
        );
    }

    scoreValue.textContent = String(score);
    setTimeout(nextQuestion, 2500);
}

function handleTimeout() {
    if (isLocked) return;

    lockOptions();
    highlightCorrectAnswer();
    showFeedback(
        `Hết thời gian! Đáp án đúng: ${currentQ.correctAnswer}.`,
        currentQ.knowledge
    );
    setTimeout(nextQuestion, 2500);
}

function renderQuestion() {
    isLocked = false;
    currentQ = questionQueue[questionIndex];

    currentQuestion.textContent = String(questionIndex + 1);
    questionText.textContent = currentQ.question;

    // Hiển thị hình ảnh họa tiết
    motifImage.src = currentQ.image;
    motifImage.alt = "Họa tiết trống đồng Đông Sơn - câu " + (questionIndex + 1);

    // Xáo trộn đáp án
    renderOptions(shuffle(currentQ.options));
    showFeedback("Quan sát hình ảnh và chọn đáp án đúng.", "");
    startQuestionTimer();
}

function getComment(finalPoint) {
    if (finalPoint <= 45) return "Em hãy tìm hiểu thêm về các họa tiết trên trống đồng nhé.";
    if (finalPoint <= 105) return "Em đang làm rất tốt! Tiếp tục khám phá văn hóa Đông Sơn.";
    return "Tuyệt vời! Em là chuyên gia nhận diện họa tiết Đông Sơn.";
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
    questionQueue = buildQuestionQueue();

    introCard.classList.add("hidden");
    resultCard.classList.add("hidden");
    playCard.classList.remove("hidden");

    renderQuestion();
}

startBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
