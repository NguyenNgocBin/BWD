// ===USER===

// Lưu tên ng chs
function setUsername(name) {
    localStorage.setItem("username", name);
}
// Lấy tên người chơi
function getUsername() {
    return localStorage.getItem("username") || "Guest";
}

// ===Game Score===
// lưu điểm từng game
function saveGameScore(gameName, score) {
    let data = JSON.parse(localStorage.getItem("gameScores")) || {};

    // Nếu chưa có hoặc điểm mới cao hơn → cập nhật
    if (!data[gameName] || score > data[gameName]) {
        data[gameName] = score;
    }

    localStorage.setItem("gameScores", JSON.stringify(data));
}
// Lấy toàn bộ điểm
function getGameScores() {
    return JSON.parse(localStorage.getItem("gameScores")) || {};
}

// Tính tổng điểm
function getTotalScore() {
    let scores = getGameScores();

    return Object.values(scores).reduce((sum, s) => sum + s, 0);
}
// ================= HISTORY =================

// Lưu lịch sử chơi
function saveHistory(gameName, score) {
    let history = JSON.parse(localStorage.getItem("history")) || [];

    history.push({
        game: gameName,
        score: score,
        time: new Date().toLocaleString()
    });

    localStorage.setItem("history", JSON.stringify(history));
}

// Lấy lịch sử
function getHistory() {
    return JSON.parse(localStorage.getItem("history")) || [];
}



// ================= RESET =================

// Xóa toàn bộ dữ liệu (debug)
function resetData() {
    localStorage.removeItem("gameScores");
    localStorage.removeItem("history");
    localStorage.removeItem("username");
}

