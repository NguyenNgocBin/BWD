(function () {
    if (window.DongSonI18n) return;

    const STORAGE_KEY = "dongsonLanguage";
    const DEFAULT_LANGUAGE = "vi";
    const SUPPORTED_LANGUAGES = ["vi", "en"];
    const english = {
        "Trang chủ": "Home", "Học vui": "Learn", "Trò chơi": "Games", "Tài liệu": "Resources",
        "Bản đồ": "Map", "Đăng nhập": "Sign in", "Đăng ký": "Sign up", "Đăng ký ngay": "Sign up now",
        "Đăng xuất": "Sign out", "Cá nhân": "Profile", "Bảng xếp hạng": "Leaderboard",
        "Bảng xếp hạng Đông Sơn": "Dong Son Leaderboard", "Thông tin cá nhân": "Personal statistics",
        "Tổng": "Overall", "Lật thẻ": "Memory cards", "Ghép hình": "Puzzle", "Đúng / Sai": "True / False",
        "Đúng/Sai": "True/False", "Tổng mọi thời gian": "All time", "Tuần này": "This week", "Hôm nay": "Today",
        "Thời gian": "Time", "Lớp / nhóm": "Class / group", "Tất cả lớp / nhóm": "All classes / groups",
        "Áp dụng": "Apply", "Hạng": "Rank", "Người chơi": "Player", "Tổng điểm": "Total score",
        "Số lượt chơi": "Games played", "Độ chính xác": "Accuracy", "Chuỗi tốt nhất": "Best streak",
        "Điểm theo từng game": "Score by game", "Tiến bộ 7 ngày gần nhất": "Progress over the last 7 days",
        "Bộ sưu tập Huy hiệu": "Badge collection", "Thử thách hằng ngày": "Daily challenges",
        "Lịch sử hoạt động": "Activity history", "Đang tải...": "Loading...", "Đang tải nhiệm vụ...": "Loading missions...",
        "Đang tải lịch sử chơi...": "Loading game history...", "Đang tải dữ liệu tiến bộ...": "Loading progress data...",
        "Đang tải huy hiệu...": "Loading badges...", "Đổi ảnh đại diện": "Change avatar", "Đổi tên": "Change name",
        "Lớp / Nhóm": "Class / Group", "Đổi mật khẩu": "Change password", "Hủy": "Cancel", "Lưu": "Save",
        "Mật khẩu hiện tại": "Current password", "Mật khẩu mới": "New password", "Nhập lại mật khẩu mới": "Confirm new password",
        "Trống đồng là gì?": "What is a bronze drum?", "Hoa văn và biểu tượng": "Patterns and symbols",
        "Kỹ thuật đúc đồng": "Bronze casting techniques", "Hiện vật tiêu biểu": "Notable artifacts",
        "Kiểm tra bằng game": "Test your knowledge with games", "Lộ trình học Đông Sơn": "Dong Son learning path",
        "Học từng bước,": "Learn step by step,", "kiểm tra bằng game": "test with games",
        "Mô tả": "Description", "Hoa văn nổi bật": "Notable patterns", "Bản đồ nơi phát hiện": "Discovery location map",
        "Câu hỏi liên quan": "Related questions", "Khám phá hiện vật khác": "Explore other artifacts",
        "Xem trên bản đồ →": "View on map →", "Đang tải hiện vật...": "Loading artifact...",
        "Tìm hiểu trống đồng Đông Sơn": "Explore Dong Son bronze drums", "Có những loại trống đồng nào?": "What types of bronze drums are there?",
        "Đọc một chiếc trống từ trên xuống dưới": "Reading a drum from top to bottom",
        "Giải mã các mô-típ thường gặp": "Decoding common motifs", "Đọc tiếp từ tư liệu bảo tàng": "Continue with museum resources",
        "Trò chơi Đông Sơn": "Dong Son Games", "Khám phá trò chơi": "Explore games", "Chơi như thế nào?": "How to play",
        "Chọn trò chơi em thích": "Choose a game", "Thử thách hôm nay": "Today's challenge",
        "Sẵn sàng bắt đầu hành trình của em?": "Ready to begin your journey?", "Khách tham quan": "Visitor",
        "Game lật thẻ họa tiết": "Pattern memory card game", "Ghép Hình Trống Đồng": "Bronze Drum Puzzle",
        "Khay mảnh ghép": "Puzzle pieces", "Cơ chế tính điểm": "Scoring system", "Nhấn Bắt đầu để chơi": "Press Start to play",
        "Xếp hạng tuần này": "This week's ranking", "Bắt đầu": "Start", "Chơi lại": "Play again", "Tiếp tục": "Continue",
        "Triển lãm Đông Sơn - Bảo tàng số": "Dong Son Exhibition - Digital Museum",
        "Bước vào không gian trống đồng Đông Sơn": "Step into the world of Dong Son bronze drums",
        "Thư viện hiện vật 3D": "3D artifact collection", "Mỗi hoa văn là một lớp ký ức": "Every pattern holds a layer of memory",
        "Bản đồ Đông Sơn": "Dong Son Map", "Bản đồ bảo tàng số": "Digital museum map",
        "Khám phá dấu ấn Đông Sơn trên bản đồ Việt Nam": "Explore Dong Son heritage across the map of Vietnam",
        "Chú giải biểu tượng": "Map legend", "Chọn nhanh địa điểm": "Quick location selection",
        "Tên đăng nhập": "Username", "Email": "Email", "Mật khẩu": "Password", "Nhớ đăng nhập": "Remember me",
        "Bạn chưa có tài khoản?": "Don't have an account?", "Bạn đã có tài khoản?": "Already have an account?",
        "Đã sẵn sàng": "Ready", "Cần đăng nhập để lưu điểm": "Sign in to save your score", "Đang phát triển": "In development",
        "Mở mô hình": "Open model", "Mô hình 3D": "3D model", "Quay lại": "Back", "Điểm": "Score",
        "Hoàn thành": "Completed", "Chưa đạt": "Locked", "Đã mở khóa": "Unlocked", "Chưa có": "Not available"
        ,"🏆 Tổng": "🏆 Overall", "🃏 Lật thẻ": "🃏 Memory cards", "🧩 Ghép hình": "🧩 Puzzle",
        "⚡ Đúng / Sai": "⚡ True / False", "🏆 Bảng xếp hạng": "🏆 Leaderboard",
        "Người giải mã trống đồng": "Bronze Drum Decoder", "Bậc thầy ghép hình": "Puzzle Master",
        "Chuỗi đúng 10 câu": "10-answer Streak", "Hoàn thành 3 game": "Complete All 3 Games",
        "Sứ giả mỗi ngày": "Daily Ambassador", "Chơi 1 ván Lật thẻ": "Play one Memory Card game",
        "Hoàn thành 1 level Ghép hình": "Complete one Puzzle level", "Trả lời đúng 5 câu quiz": "Answer 5 quiz questions correctly",
        "Chưa có dữ liệu bảng xếp hạng cho mục này.": "No leaderboard data is available for this category.",
        "Chưa có lượt chơi nào được đồng bộ.": "No synchronized game sessions yet.",
        "Chưa có dữ liệu huy hiệu.": "No badge data yet.", "Hoàn thành": "Completed",
        "Điểm cao nhất": "High score", "Số lần chơi": "Games played", "Combo tốt nhất": "Best combo",
        "Số giây": "Seconds", "Điểm lật thẻ": "Memory card score", "Điểm ghép hình": "Puzzle score",
        "Điểm đúng / sai": "True / false score", "Chuỗi đúng": "Correct streak", "Mốc hoàn thành": "Completion level"
    };

    const catalogs = { vi: {}, en: english };
    const originalText = new WeakMap();
    const originalAttributes = new WeakMap();
    let language = normalizeLanguage(localStorage.getItem(STORAGE_KEY) || document.documentElement.lang);
    let observer;

    function normalizeLanguage(value) {
        const short = String(value || "").toLowerCase().split("-")[0];
        return SUPPORTED_LANGUAGES.includes(short) ? short : DEFAULT_LANGUAGE;
    }

    function translateText(source, lang = language) {
        if (lang === DEFAULT_LANGUAGE) return source;
        return catalogs[lang]?.[source] || source;
    }

    function t(key, variables = {}) {
        let result = catalogs[language]?.[key] || catalogs.vi[key] || key;
        Object.entries(variables).forEach(([name, value]) => {
            result = result.replaceAll(`{${name}}`, value);
        });
        return result;
    }

    function translateTextNode(node) {
        if (!node.parentElement || node.parentElement.closest("script, style, [data-i18n-ignore]")) return;
        if (!originalText.has(node)) originalText.set(node, node.nodeValue);
        const source = originalText.get(node);
        const trimmed = source.trim();
        if (!trimmed) return;
        const translated = translateText(trimmed);
        node.nodeValue = translated === trimmed
            ? source
            : `${source.match(/^\s*/)[0]}${translated}${source.match(/\s*$/)[0]}`;
    }

    function translateElement(element) {
        if (!(element instanceof Element) || element.closest("[data-i18n-ignore]")) return;
        const key = element.dataset.i18n;
        if (key) element.textContent = t(key);

        const attributes = ["placeholder", "title", "aria-label", "alt"];
        if (!originalAttributes.has(element)) originalAttributes.set(element, {});
        const originals = originalAttributes.get(element);
        attributes.forEach((attribute) => {
            if (!element.hasAttribute(attribute)) return;
            if (!(attribute in originals)) originals[attribute] = element.getAttribute(attribute);
            element.setAttribute(attribute, translateText(originals[attribute]));
        });
        Array.from(element.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).forEach(translateTextNode);
    }

    function translateTree(root = document.documentElement) {
        if (root.nodeType === Node.TEXT_NODE) return translateTextNode(root);
        if (!(root instanceof Element)) return;
        translateElement(root);
        root.querySelectorAll("*").forEach(translateElement);
    }

    function renderSwitcher() {
        let switcher = document.getElementById("dongsonLanguageSwitcher");
        if (!switcher) {
            switcher = document.createElement("div");
            switcher.id = "dongsonLanguageSwitcher";
            switcher.className = "dongson-language-switcher";
            switcher.dataset.i18nIgnore = "true";
            switcher.innerHTML = '<button type="button" data-language="vi">VI</button><span>/</span><button type="button" data-language="en">EN</button>';
            switcher.addEventListener("click", (event) => {
                const nextLanguage = event.target.closest("button")?.dataset.language;
                if (nextLanguage) setLanguage(nextLanguage);
            });
            document.body.appendChild(switcher);
        }
        switcher.querySelectorAll("button").forEach((button) => {
            const active = button.dataset.language === language;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }

    function setLanguage(nextLanguage) {
        language = normalizeLanguage(nextLanguage);
        localStorage.setItem(STORAGE_KEY, language);
        document.documentElement.lang = language;
        translateTree();
        renderSwitcher();
        window.dispatchEvent(new CustomEvent("dongson:language-changed", { detail: { language } }));
    }

    function start() {
        document.documentElement.lang = language;
        translateTree();
        renderSwitcher();
        observer = new MutationObserver((mutations) => {
            observer.disconnect();
            mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => translateTree(node)));
            observer.observe(document.documentElement, { childList: true, subtree: true });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    const style = document.createElement("style");
    style.textContent = ".dongson-language-switcher{position:fixed;right:16px;bottom:16px;z-index:10050;display:flex;align-items:center;gap:5px;padding:6px 9px;border:1px solid rgba(214,158,39,.65);border-radius:999px;background:rgba(25,20,16,.94);color:#f5dfaa;box-shadow:0 8px 24px rgba(0,0,0,.3);font:700 12px/1 Arial,sans-serif}.dongson-language-switcher button{border:0;background:transparent;color:#b9aa8b;cursor:pointer;padding:5px}.dongson-language-switcher button.is-active{color:#ffd15c}.dongson-language-switcher button:focus-visible{outline:2px solid #ffd15c;border-radius:4px}";
    document.head.appendChild(style);

    window.DongSonI18n = { t, setLanguage, getLanguage: () => language, translateTree, catalogs };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();
