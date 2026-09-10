(() => {
  const CHAT_API_ENDPOINT = "http://localhost:5000/api/v1/chat/ask";
  const CHAT_FEEDBACK_ENDPOINT = "http://localhost:5000/api/v1/chat/feedback";
  const FALLBACK_MESSAGE =
    "Hiện tại AI Đông Sơn chưa kết nối được máy chủ. Bạn vui lòng thử lại sau.";
  const INITIAL_SUGGESTIONS = [
    "Trống đồng Đông Sơn là gì?",
    "Hoa văn chim Lạc có ý nghĩa gì?",
    "Vì sao trống đồng Đông Sơn được coi là bảo vật?",
  ];
  const MAX_HISTORY_MESSAGES = 6;
  const MAX_HISTORY_CONTENT = 800;
  const MAX_SOURCES = 3;
  const MAX_SUGGESTIONS = 3;
  const TOUR_STORAGE_KEY = "dongson_ai_tour_v2";
  const TOUR_COMPLETED_KEY = "dongson_ai_tour_completed_v1";
  const chatboxScript = document.currentScript
    || Array.from(document.scripts).find((script) => script.src.includes("chatbox-ui.js"));
  const APP_ROOT_URL = new URL("../", chatboxScript?.src || document.baseURI);

  const TOUR_DEFINITIONS = {
    "ngoc-lu": {
      title: "Khám phá trống Ngọc Lũ",
      duration: "12–15 phút",
      description: "Nhập vai nhà nghiên cứu: mở điểm khám phá, hỏi RAG, làm thử thách và thao tác 3D.",
      maxScore: 6,
      steps: [
        {
          text:
            "Bạn vừa nhận nhiệm vụ của một trợ lý nghiên cứu: lập hồ sơ nhanh về trống Ngọc Lũ bằng quan sát, tư liệu RAG và một bài thực hành 3D. Có 6 điểm kiến thức; cuối tour bạn sẽ nhận cấp huy hiệu theo kết quả.",
          actions: [{ label: "Nhận nhiệm vụ", next: 1, primary: true }],
        },
        {
          page: "pages/hien-vat.html",
          params: { id: "ngoc-lu" },
          target: ".artifact-image",
          travelLabel: "Mở hồ sơ Ngọc Lũ",
          text:
            "Nhiệm vụ 1 · Quan sát trực tiếp. Trên ảnh hiện vật có ba điểm sáng. Hãy mở điểm “Trung tâm mặt trống”; nút xác nhận sẽ tự mở khóa khi website ghi nhận thao tác của bạn.",
          actions: [
            { label: "✓ Đã khám phá trung tâm (+1)", next: 2, score: 1, requires: "artifact:center", primary: true },
            { label: "Thoát tour", exit: true },
          ],
        },
        {
          page: "pages/hien-vat.html",
          params: { id: "ngoc-lu" },
          target: "#artifactMotifs",
          text:
            "Nhiệm vụ 2 · Đọc bố cục. Các mô-típ trên mặt trống được tổ chức chủ yếu theo cách nào?",
          actions: [
            { label: "Thành các vành đồng tâm", next: 3, score: 1, primary: true },
            {
              label: "Rải ngẫu nhiên",
              stay: true,
              feedback: "Chưa đúng. Hãy nhìn lại cách các dải hoa văn bao quanh phần trung tâm.",
            },
            {
              label: "Chỉ ở chân trống",
              stay: true,
              feedback: "Chưa đúng. Hồ sơ đang hướng bạn quan sát bố cục trên mặt trống.",
            },
          ],
        },
        {
          page: "pages/hien-vat.html",
          params: { id: "ngoc-lu" },
          target: ".artifact-content",
          text:
            "Nhiệm vụ 3 · Phân biệt bằng chứng với suy diễn. Mệnh đề nào có thể kiểm tra trực tiếp từ hồ sơ đang mở?",
          actions: [
            { label: "Trung tâm có ngôi sao 14 cánh", next: 4, score: 1, primary: true },
            { label: "Chắc chắn do một vị vua đặt làm", stay: true, feedback: "Đây là suy diễn vì hồ sơ không đưa ra bằng chứng về người đặt làm." },
            { label: "Chắc chắn được đúc ngay tại nơi tìm thấy", stay: true, feedback: "Nơi phát hiện không tự động là nơi sản xuất. Hãy chọn mô tả quan sát được." },
          ],
        },
        {
          page: "pages/hien-vat.html",
          params: { id: "ngoc-lu" },
          target: ".artifact-intro",
          text:
            "Trạm RAG · Hãy để AI tra cứu kho tri thức và trả lời kèm nguồn. Đây là lúc so sánh câu trả lời của AI với thông tin trên hồ sơ, không phải tin AI một cách máy móc.",
          actions: [
            { label: "Hỏi RAG: Vì sao Ngọc Lũ nổi bật?", ask: "Vì sao trống Ngọc Lũ được xem là hiện vật tiêu biểu của văn hóa Đông Sơn? Hãy trả lời ngắn gọn và dẫn nguồn." , primary: true },
            { label: "Tiếp tục sau khi đối chiếu", next: 5 },
          ],
        },
        {
          text:
            "Phòng lab 3D là thử thách tùy chọn 2 điểm. Lưu ý: ba model hiện có chưa được xác minh là trống Ngọc Lũ; chúng chỉ giúp luyện thao tác và nhận biết cấu tạo chung.",
          actions: [
            { label: "Vào phòng lab 3D (+2)", next: 6, primary: true },
            { label: "Bỏ qua thử thách 3D", next: 8 },
          ],
        },
        {
          page: "pages/trienlam.html",
          target: "#model3d-section",
          travelLabel: "Đến phòng lab 3D",
          text:
            "Mở mô hình tham khảo 01, chờ tải xong, sau đó kéo trên mô hình để xoay và cuộn để zoom. Hệ thống chỉ mở khóa khi ghi nhận đủ ba trạng thái: đã tải · đã xoay · đã zoom.",
          actions: [
            { label: "Mở mô hình tham khảo 01", pageAction: "open-reference-model-01", primary: true },
            { label: "✓ Đã tải · xoay · zoom (+2)", next: 7, score: 2, requires: "3d:complete" },
            { label: "Bỏ qua phần còn lại", next: 8 },
          ],
        },
        {
          page: "pages/trienlam.html",
          target: "#model3d-section",
          text: "Kiểm tra nhanh: phần bề mặt lớn ở trên cùng, thường mang các vành trang trí đồng tâm, được gọi là gì?",
          actions: [
            { label: "Mặt trống", next: 8, score: 1, primary: true },
            { label: "Chân trống", stay: true, feedback: "Chân trống nằm ở phần thấp nhất của dáng khối." },
            { label: "Thân trống", stay: true, feedback: "Thân nằm dưới tang; hãy nhìn phần trên cùng của mô hình." },
          ],
        },
        {
          page: "pages/trienlam.html",
          target: "#viewer-stage",
          travelLabel: "Đến không gian bảo tàng ảo",
          text:
            "Nhiệm vụ 4 · Tham quan tự do. Không gian này được nhúng từ website bên ngoài nên AI không theo dõi được vị trí của bạn. Hãy tự chọn một điểm dừng, quan sát cách trưng bày rồi quay lại xác nhận.",
          actions: [
            { label: "Tôi đã chọn một điểm dừng", next: 9, primary: true },
            { label: "Hướng dẫn cách di chuyển", stay: true, feedback: "Bấm hoặc kéo trực tiếp trong khung triển lãm; dùng nút toàn màn hình của khu triển lãm nếu khung quá nhỏ." },
            { label: "Bỏ qua bảo tàng ảo", next: 10 },
          ],
        },
        {
          page: "pages/trienlam.html",
          target: "#viewer-stage",
          text: "Ghi chép hiện trường: điều gì ở điểm dừng vừa rồi khiến bạn chú ý nhất? Câu này không có đúng hoặc sai.",
          actions: [
            { label: "Cách trưng bày hiện vật", next: 10, answer: "display" },
            { label: "Hoa văn trên hiện vật", next: 10, answer: "motif" },
            { label: "Hình ảnh và tư liệu", next: 10, answer: "document" },
            { label: "Không gian triển lãm", next: 10, answer: "space" },
          ],
        },
        {
          text:
            "Trạm đối chiếu cuối · Bạn có thể hỏi RAG thêm về hoa văn Ngọc Lũ. Hãy mở phần nguồn trong câu trả lời và nhớ rằng model 3D chưa định danh không phải bằng chứng về chính hiện vật Ngọc Lũ.",
          actions: [
            { label: "Hỏi RAG về hoa văn Ngọc Lũ", ask: "Hoa văn trên trống Ngọc Lũ mô tả những gì? Hãy nêu các chi tiết chính và dẫn nguồn.", primary: true },
            { label: "Xem kết quả nhiệm vụ", next: 11 },
          ],
        },
        {
          text:
            "Hồ sơ đã hoàn tất. Bạn đã quan sát hiện vật, phân biệt bằng chứng với suy diễn, được hướng dẫn cách kiểm tra nguồn RAG và hiểu đúng giới hạn của mô hình 3D. Nhấn hoàn thành để nhận kết quả và huy hiệu.",
          actions: [{ label: "Nhận kết quả tour", complete: true, primary: true }],
        },
      ],
    },
    "3d-practice": {
      title: "Làm quen với cấu tạo trống đồng 3D",
      duration: "5 phút",
      description: "Thực hành xoay, zoom và nhận biết cấu tạo bằng các model chưa định danh.",
      steps: [
        {
          text:
            "Tour này dùng ba model GLB như mô hình tham khảo. Chúng chưa được xác minh là Ngọc Lũ, Hoàng Hạ, Cổ Loa hay Tân Long, vì vậy nội dung chỉ tập trung vào kỹ năng quan sát cấu tạo chung.",
          actions: [{ label: "Bắt đầu thực hành", next: 1, primary: true }],
        },
        {
          page: "pages/trienlam.html",
          target: "#model3d-section",
          travelLabel: "Mở phòng thực hành 3D",
          text:
            "Hãy mở mô hình tham khảo 01, kéo để xoay và cuộn để phóng to. Tìm phần mặt ở phía trên, phần tang ngay dưới mặt, phần thân và phần chân ở phía dưới.",
          actions: [
            { label: "Mở mô hình tham khảo 01", pageAction: "open-reference-model-01", primary: true },
            { label: "Tôi đã quan sát", next: 2 },
          ],
        },
        {
          page: "pages/trienlam.html",
          target: "#model3d-section",
          text: "Phần nằm trên cùng và thường có các vành trang trí đồng tâm được gọi là gì?",
          actions: [
            { label: "Mặt trống", next: 3, score: 1, primary: true },
            {
              label: "Chân trống",
              stay: true,
              feedback: "Chưa đúng. Chân trống nằm ở phần thấp nhất của dáng khối.",
            },
            {
              label: "Quai trống",
              stay: true,
              feedback: "Chưa đúng. Hãy nhìn phần bề mặt lớn ở phía trên cùng.",
            },
          ],
        },
        {
          page: "pages/trienlam.html",
          target: "#model3d-section",
          text:
            "Bây giờ bạn có thể mở mô hình tham khảo 02 để so sánh dáng khối. Chỉ ghi nhận điểm giống và khác nhìn thấy được; không suy đoán tên hoặc nguồn gốc hiện vật.",
          actions: [
            { label: "Mở mô hình tham khảo 02", pageAction: "open-reference-model-02", primary: true },
            { label: "Tôi đã so sánh", next: 4 },
          ],
        },
        {
          text:
            "Bạn đã hoàn thành bài thực hành 3D và biết giới hạn sử dụng của các model chưa định danh. Những model này hỗ trợ quan sát, không phải bằng chứng để xác định một hiện vật cụ thể.",
          actions: [{ label: "Hoàn thành tour", complete: true, primary: true }],
        },
      ],
    },
    "virtual-museum": {
      title: "Dạo quanh không gian Đông Sơn",
      duration: "5–8 phút",
      description: "Tham quan tự do triển lãm nhúng và ghi lại điều bạn chú ý.",
      steps: [
        {
          text:
            "Tour này dẫn bạn tới không gian triển lãm Đông Sơn được nhúng từ bên ngoài. Bạn tự điều khiển bên trong khung; AI chỉ đưa gợi ý và ghi nhận xác nhận của bạn.",
          actions: [{ label: "Bắt đầu tham quan", next: 1, primary: true }],
        },
        {
          page: "pages/trienlam.html",
          target: "#viewer-stage",
          travelLabel: "Mở không gian bảo tàng ảo",
          text:
            "Trước tiên, hãy quan sát tổng thể cách không gian được chia thành các khu vực. Sau đó tự chọn một hiện vật, hình ảnh hoặc bảng thông tin khiến bạn quan tâm. AI không theo dõi được vị trí bên trong iframe.",
          actions: [
            { label: "Tôi đã chọn một điểm dừng", next: 2, primary: true },
            {
              label: "Tôi chưa biết cách di chuyển",
              stay: true,
              feedback: "Hãy bấm hoặc kéo trực tiếp bên trong khung triển lãm. Nếu khung nhỏ, bạn có thể dùng nút “Toàn màn hình” trên thanh công cụ của khu triển lãm.",
            },
          ],
        },
        {
          page: "pages/trienlam.html",
          target: "#viewer-stage",
          text: "Điểm dừng bạn vừa chọn thuộc loại nào?",
          actions: [
            { label: "Hiện vật", next: 3, answer: "artifact" },
            { label: "Hình ảnh", next: 3, answer: "image" },
            { label: "Bảng thông tin", next: 3, answer: "information" },
            { label: "Không gian trưng bày", next: 3, answer: "space" },
          ],
        },
        {
          page: "pages/trienlam.html",
          target: "#viewer-stage",
          text:
            "Bạn đã hoàn thành một vòng tham quan tự do. Nếu nhớ tên hiện vật hoặc chủ đề vừa xem, bạn có thể kết thúc tour rồi hỏi AI để kiểm tra xem kho tri thức có nguồn liên quan hay không.",
          actions: [{ label: "Hoàn thành tour", complete: true, primary: true }],
        },
      ],
    },
  };

  const cleanText = (value, maxLength = 500) => {
    if (typeof value !== "string") return "";
    return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
  };

  const safeHttpUrl = (value) => {
    if (typeof value !== "string" || !value.trim()) return null;

    try {
      const url = new URL(value.trim(), document.baseURI);
      if (url.username || url.password) return null;
      if (url.protocol === "https:") return url.href;

      const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
      const isSameOrigin = window.location.origin !== "null" && url.origin === window.location.origin;
      if (url.protocol === "http:" && (isSameOrigin || localHosts.has(url.hostname))) {
        return url.href;
      }
    } catch (_error) {
      return null;
    }

    return null;
  };

  const normalizeSources = (sources) => {
    if (!Array.isArray(sources)) return [];

    const normalized = [];

    for (const source of sources) {
      if (!source || typeof source !== "object") continue;

      const href = safeHttpUrl(source.url) || safeHttpUrl(source.external_url);
      if (!href) continue;

      const rawId =
        typeof source.id === "number"
          ? `[${source.id}]`
          : cleanText(source.citation || source.id, 12);
      const id = /^\[\d{1,2}\]$/.test(rawId) ? rawId : `[${normalized.length + 1}]`;
      const title =
        cleanText(source.title || source.document_title, 140) || `Nguồn ${id}`;
      normalized.push({
        id,
        title,
        excerpt: cleanText(source.excerpt, 260),
        href,
      });

      if (normalized.length >= MAX_SOURCES) break;
    }

    return normalized;
  };

  const normalizeSuggestions = (suggestions, currentQuestion = "") => {
    if (!Array.isArray(suggestions)) return [];

    const current = cleanText(currentQuestion, 500).toLocaleLowerCase("vi");
    const unique = new Set();
    const normalized = [];

    for (const item of suggestions) {
      const question = cleanText(item, 160);
      const key = question.toLocaleLowerCase("vi");
      if (!question || key === current || unique.has(key)) continue;
      unique.add(key);
      normalized.push(question);
      if (normalized.length >= MAX_SUGGESTIONS) break;
    }

    return normalized;
  };

  const contextualSuggestions = (result, question) => {
    const supplied = normalizeSuggestions(result.suggestedQuestions, question);
    if (supplied.length) return supplied;

    const primaryTitle = cleanText(result.sources[0]?.title, 90);
    if (primaryTitle && result.intent === "artifact") {
      return [
        `${primaryTitle} có những hoa văn nào đáng chú ý?`,
        `${primaryTitle} được phát hiện ở đâu?`,
        `${primaryTitle} thuộc nhóm phân loại nào?`,
      ];
    }

    if (result.intent === "website") {
      return [
        "Tôi có thể xem hiện vật 3D ở đâu?",
        "Website có những khu vực tham quan nào?",
        "Làm sao để tìm một hiện vật cụ thể?",
      ];
    }

    if (result.intent === "account_game") {
      return [
        "Làm sao để bắt đầu trò chơi?",
        "Điểm trên bảng xếp hạng được tính thế nào?",
        "Tôi xem thành tích của mình ở đâu?",
      ];
    }

    return [
      "Kỹ thuật đúc trống đồng Đông Sơn có gì đặc biệt?",
      "Trống Ngọc Lũ nổi bật ở điểm nào?",
      "Hệ thống phân loại Heger là gì?",
    ];
  };

  const normalizeAnswer = (data) => {
    if (!data) return FALLBACK_MESSAGE;
    if (typeof data === "string") return data;
    return data.answer || data.message || data.response || FALLBACK_MESSAGE;
  };

  const normalizeResponse = (data) => {
    const objectData = data && typeof data === "object" ? data : {};
    return {
      answer: normalizeAnswer(data),
      interactionId: objectData.interaction_id || null,
      requestId: objectData.request_id || null,
      retrievalQuestion: objectData.retrieval_question || null,
      intent: objectData.intent || null,
      sources: normalizeSources(objectData.sources),
      suggestedQuestions: normalizeSuggestions(objectData.suggested_questions),
    };
  };

  function ensureChatbox() {
    if (document.getElementById("ds-chat-root")) return;

    const root = document.createElement("div");
    root.id = "ds-chat-root";
    // This template is local, constant UI markup. Server data is only rendered
    // later with textContent/DOM properties and never interpolated into HTML.
    root.innerHTML = `
      <div class="ds-chat-shell">
        <section class="ds-chat-panel" id="ds-chat-panel" role="dialog"
          aria-labelledby="ds-chat-title" aria-hidden="true">
          <header class="ds-chat-header">
            <div class="ds-chat-brand">
              <div class="ds-chat-brand-copy">
                <strong id="ds-chat-title">AI ĐÔNG SƠN</strong>
                <small>Trợ lý khám phá di sản • Có nguồn tham khảo</small>
              </div>
            </div>

            <div class="ds-chat-header-actions">
              <button class="ds-chat-iconbtn" id="ds-chat-min" type="button"
                aria-label="Thu nhỏ cửa sổ trò chuyện">•••</button>
              <button class="ds-chat-iconbtn" id="ds-chat-close" type="button"
                aria-label="Đóng cửa sổ trò chuyện">✕</button>
            </div>
          </header>

          <div class="ds-chat-body" id="ds-chat-body">
            <article class="ds-chat-intro">
              <div class="ds-chat-intro-avatar" aria-hidden="true">🪙</div>
              <div class="ds-chat-intro-copy">
                <p>
                  Xin chào! Ta là <strong>AI Đông Sơn</strong> — người bạn đồng hành giúp người khám phá
                  bí mật của trống đồng và văn hóa Việt cổ.
                </p>
                <button class="ds-chat-tour-entry" id="ds-chat-tour-entry" type="button">
                  🧭 Khám phá bằng Tour AI
                </button>
              </div>
            </article>

            <section class="ds-chat-tour-status" id="ds-chat-tour-status" hidden
              aria-label="Tiến độ Tour AI">
              <div class="ds-chat-tour-status__main">
                <div class="ds-chat-tour-status__meta">
                  <span id="ds-chat-tour-step">TOUR AI</span>
                  <b id="ds-chat-tour-score">0 điểm</b>
                </div>
                <strong id="ds-chat-tour-name">Hành trình đang diễn ra</strong>
                <div class="ds-chat-tour-progress" role="progressbar" aria-label="Tiến độ tour"
                  aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                  <i id="ds-chat-tour-progress-fill"></i>
                </div>
              </div>
              <button id="ds-chat-tour-exit" type="button">Thoát</button>
            </section>

            <div class="ds-chat-messages" id="ds-chat-messages" aria-live="polite"
              aria-relevant="additions text"></div>

            <div class="ds-chat-suggest-label" id="ds-chat-suggest-label">GỢI Ý CÂU HỎI</div>
            <div class="ds-chat-suggest-list" id="ds-chat-suggest-list"
              aria-labelledby="ds-chat-suggest-label"></div>
          </div>

          <footer class="ds-chat-footer">
            <div class="ds-chat-input-wrap">
              <input class="ds-chat-input" id="ds-chat-input" type="text"
                aria-label="Nhập câu hỏi cho AI Đông Sơn" placeholder="Hỏi AI Đông Sơn..."
                maxlength="500" autocomplete="off" enterkeyhint="send" />
              <button class="ds-chat-send" id="ds-chat-send" type="button"
                aria-label="Gửi câu hỏi">➤</button>
            </div>
            <div class="ds-chat-note">AI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.</div>
          </footer>
        </section>

        <div class="ds-chat-fab-wrap">
          <button class="ds-chat-fab" id="ds-chat-fab" type="button"
            aria-label="Mở cửa sổ trò chuyện" aria-controls="ds-chat-panel" aria-expanded="false">
            <span class="ds-chat-fab__icon" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    const panel = root.querySelector("#ds-chat-panel");
    const body = root.querySelector("#ds-chat-body");
    const messages = root.querySelector("#ds-chat-messages");
    const input = root.querySelector("#ds-chat-input");
    const sendBtn = root.querySelector("#ds-chat-send");
    const fab = root.querySelector("#ds-chat-fab");
    const closeBtn = root.querySelector("#ds-chat-close");
    const minBtn = root.querySelector("#ds-chat-min");
    const tourEntryBtn = root.querySelector("#ds-chat-tour-entry");
    const tourStatus = root.querySelector("#ds-chat-tour-status");
    const tourStep = root.querySelector("#ds-chat-tour-step");
    const tourName = root.querySelector("#ds-chat-tour-name");
    const tourScore = root.querySelector("#ds-chat-tour-score");
    const tourProgress = root.querySelector(".ds-chat-tour-progress");
    const tourProgressFill = root.querySelector("#ds-chat-tour-progress-fill");
    const tourExitBtn = root.querySelector("#ds-chat-tour-exit");
    const suggestionLabel = root.querySelector("#ds-chat-suggest-label");
    const suggestionList = root.querySelector("#ds-chat-suggest-list");

    let isSending = false;
    let sourcePanelSequence = 0;
    const conversationHistory = [];
    let activeTourState = null;

    const scrollToBottom = () => {
      body.scrollTop = body.scrollHeight;
    };

    const openPanel = () => {
      panel.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      root.classList.add("is-open");
      fab.setAttribute("aria-expanded", "true");
      window.setTimeout(() => input.focus(), 120);
    };

    const closePanel = () => {
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      root.classList.remove("is-open");
      fab.setAttribute("aria-expanded", "false");
      fab.focus();
    };

    const shortHistory = () =>
      conversationHistory.slice(-MAX_HISTORY_MESSAGES).map((item) => ({
        role: item.role,
        content: item.content.slice(0, MAX_HISTORY_CONTENT),
      }));

    const rememberExchange = (question, answer) => {
      conversationHistory.push(
        { role: "user", content: question.slice(0, MAX_HISTORY_CONTENT) },
        { role: "assistant", content: answer.slice(0, MAX_HISTORY_CONTENT) },
      );
      if (conversationHistory.length > MAX_HISTORY_MESSAGES) {
        conversationHistory.splice(0, conversationHistory.length - MAX_HISTORY_MESSAGES);
      }
    };

    const renderSuggestions = (suggestions, contextual = false) => {
      const safeSuggestions = normalizeSuggestions(suggestions);
      suggestionList.replaceChildren();
      suggestionLabel.textContent = contextual ? "CÓ THỂ BẠN MUỐN HỎI" : "GỢI Ý CÂU HỎI";

      safeSuggestions.forEach((question) => {
        const button = document.createElement("button");
        button.className = "ds-chat-chip";
        button.type = "button";
        button.disabled = isSending;
        button.textContent = `✦ ${question}`;
        button.addEventListener("click", () => submitQuestion(question));
        suggestionList.appendChild(button);
      });
    };

    const createSources = (sources) => {
      if (!sources.length) return null;

      sourcePanelSequence += 1;
      const sourceListId = `ds-chat-source-list-${sourcePanelSequence}`;
      const wrapper = document.createElement("section");
      wrapper.className = "ds-chat-sources";
      wrapper.setAttribute("aria-label", "Nguồn tham khảo cho câu trả lời");

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "ds-chat-source-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", sourceListId);
      toggle.textContent = `Xem nguồn (${sources.length})`;

      const list = document.createElement("ol");
      list.className = "ds-chat-source-list";
      list.id = sourceListId;
      list.hidden = true;

      sources.forEach((source) => {
        const item = document.createElement("li");
        item.className = "ds-chat-source-item";

        const link = document.createElement("a");
        link.className = "ds-chat-source-link";
        link.href = source.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.referrerPolicy = "no-referrer";
        link.textContent = `${source.id} ${source.title}`;
        link.setAttribute("aria-label", `Mở nguồn ${source.title} trong tab mới`);
        item.appendChild(link);

        if (source.excerpt) {
          const excerpt = document.createElement("p");
          excerpt.className = "ds-chat-source-excerpt";
          excerpt.textContent = source.excerpt;
          item.appendChild(excerpt);
        }

        list.appendChild(item);
      });

      toggle.addEventListener("click", () => {
        const willOpen = list.hidden;
        list.hidden = !willOpen;
        toggle.setAttribute("aria-expanded", String(willOpen));
        toggle.textContent = willOpen ? "Ẩn nguồn" : `Xem nguồn (${sources.length})`;
        if (willOpen) scrollToBottom();
      });

      wrapper.append(toggle, list);
      return wrapper;
    };

    const createFeedback = (interactionId) => {
      if (!interactionId) return null;

      const feedback = document.createElement("div");
      feedback.className = "ds-chat-feedback";
      feedback.setAttribute("role", "group");
      feedback.setAttribute("aria-label", "Đánh giá câu trả lời");

      const label = document.createElement("span");
      label.className = "ds-chat-feedback-label";
      label.textContent = "Câu trả lời này thế nào?";
      feedback.appendChild(label);

      [
        { helpful: true, label: "Hữu ích", icon: "👍" },
        { helpful: false, label: "Chưa đúng", icon: "👎" },
      ].forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ds-chat-feedback-btn";
        button.textContent = `${option.icon} ${option.label}`;
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", async () => {
          const buttons = feedback.querySelectorAll("button");
          buttons.forEach((item) => {
            item.disabled = true;
          });
          feedback.setAttribute("aria-busy", "true");

          try {
            const response = await fetch(CHAT_FEEDBACK_ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                interaction_id: interactionId,
                helpful: option.helpful,
              }),
            });
            if (!response.ok) throw new Error("feedback_failed");

            button.setAttribute("aria-pressed", "true");
            feedback.replaceChildren(document.createTextNode("Cảm ơn phản hồi của bạn!"));
            feedback.classList.add("is-saved");
          } catch (_error) {
            buttons.forEach((item) => {
              item.disabled = false;
            });
            label.textContent = "Chưa gửi được phản hồi. Bạn thử lại nhé.";
          } finally {
            feedback.removeAttribute("aria-busy");
          }
        });
        feedback.appendChild(button);
      });

      return feedback;
    };

    const createMessage = (role, text, options = {}) => {
      const message = document.createElement("article");
      message.className = `ds-chat-message ds-chat-message--${role}`;
      if (options.loading) message.classList.add("is-loading");
      if (options.error) message.classList.add("is-error");
      if (options.tour) message.classList.add("is-tour");

      const avatar = document.createElement("div");
      avatar.className = "ds-chat-message-avatar";
      avatar.textContent = role === "user" ? "Bạn" : "AI";
      avatar.setAttribute("aria-hidden", "true");

      const content = document.createElement("div");
      content.className = "ds-chat-message-content";

      const bubble = document.createElement("div");
      bubble.className = "ds-chat-bubble";

      if (options.loading) {
        message.setAttribute("role", "status");
        const loadingText = document.createElement("span");
        loadingText.textContent = "AI Đông Sơn đang tra cứu tư liệu";
        const typing = document.createElement("span");
        typing.className = "ds-chat-typing";
        typing.setAttribute("aria-hidden", "true");
        typing.append(document.createElement("i"), document.createElement("i"), document.createElement("i"));
        bubble.append(loadingText, typing);
      } else {
        bubble.textContent = text;
      }

      content.appendChild(bubble);

      if (Array.isArray(options.actions) && options.actions.length) {
        const actions = document.createElement("div");
        actions.className = "ds-chat-tour-actions";
        actions.setAttribute("role", "group");
        actions.setAttribute("aria-label", options.actionLabel || "Lựa chọn cho bước Tour AI");

        options.actions.forEach((action) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "ds-chat-tour-action";
          if (action.primary) button.classList.add("is-primary");
          if (action.danger) button.classList.add("is-danger");
          if (action.requires) {
            button.dataset.tourRequirement = action.requires;
            button.title = "Hãy hoàn thành thao tác trên trang để mở khóa lựa chọn này.";
          }
          button.textContent = action.label;
          button.addEventListener("click", () => options.onAction?.(action, button));
          actions.appendChild(button);
        });
        content.appendChild(actions);
      }

      if (role === "ai" && !options.loading && !options.error) {
        const sources = createSources(options.sources || []);
        if (sources) content.appendChild(sources);

        if (options.question) {
          const actions = document.createElement("div");
          actions.className = "ds-chat-response-actions";

          const retry = document.createElement("button");
          retry.type = "button";
          retry.className = "ds-chat-action-btn ds-chat-retry";
          retry.disabled = isSending;
          retry.textContent = "↻ Hỏi lại";
          retry.setAttribute(
            "aria-label",
            `Đưa câu hỏi cũ vào ô nhập để chỉnh sửa: ${cleanText(options.question, 120)}`,
          );
          retry.addEventListener("click", () => {
            input.value = options.question;
            input.focus();
          });
          actions.appendChild(retry);
          content.appendChild(actions);
        }

        const feedback = createFeedback(options.interactionId);
        if (feedback) content.appendChild(feedback);
      }

      message.append(avatar, content);
      messages.appendChild(message);
      scrollToBottom();
      return message;
    };

    const loadTourState = () => {
      try {
        const value = JSON.parse(localStorage.getItem(TOUR_STORAGE_KEY));
        const tour = TOUR_DEFINITIONS[value?.tourId];
        if (!tour || !Number.isInteger(value.stepIndex) || !tour.steps[value.stepIndex]) {
          localStorage.removeItem(TOUR_STORAGE_KEY);
          return null;
        }
        return {
          tourId: value.tourId,
          stepIndex: value.stepIndex,
          score: Number(value.score) || 0,
          answers: value.answers && typeof value.answers === "object" ? value.answers : {},
          attempts: value.attempts && typeof value.attempts === "object" ? value.attempts : {},
          ragChecks: Array.isArray(value.ragChecks) ? value.ragChecks : [],
          startedAt: value.startedAt || new Date().toISOString(),
        };
      } catch (_error) {
        localStorage.removeItem(TOUR_STORAGE_KEY);
        return null;
      }
    };

    const saveTourState = () => {
      try {
        if (!activeTourState) {
          localStorage.removeItem(TOUR_STORAGE_KEY);
          return;
        }
        localStorage.setItem(
          TOUR_STORAGE_KEY,
          JSON.stringify({ ...activeTourState, updatedAt: new Date().toISOString() }),
        );
      } catch (_error) {
        // Tour vẫn hoạt động trong trang hiện tại nếu trình duyệt chặn localStorage.
      }
    };

    const setTourMode = (enabled) => {
      tourStatus.hidden = !enabled;
      suggestionLabel.hidden = enabled;
      suggestionList.hidden = enabled;
      tourEntryBtn.hidden = enabled;
      input.placeholder = enabled
        ? "Bạn vẫn có thể hỏi thêm trong khi tham quan..."
        : "Hỏi AI Đông Sơn...";
    };

    const updateTourStatus = () => {
      if (!activeTourState) return;
      const tour = TOUR_DEFINITIONS[activeTourState.tourId];
      const maxScore = Number(tour.maxScore)
        || tour.steps.reduce(
          (total, step) => total + Math.max(0, ...((step.actions || []).map((action) => Number(action.score) || 0))),
          0,
        );
      const progress = Math.round((activeTourState.stepIndex / Math.max(1, tour.steps.length - 1)) * 100);
      tourStep.textContent = `BƯỚC ${activeTourState.stepIndex + 1}/${tour.steps.length}`;
      tourName.textContent = tour.title;
      tourScore.textContent = `${activeTourState.score}/${maxScore} điểm`;
      tourProgress.setAttribute("aria-valuenow", String(progress));
      tourProgressFill.style.width = `${progress}%`;
    };

    const tourRequirementMet = (requirement) => {
      if (!requirement) return true;
      if (requirement === "artifact:center") {
        const snapshot = typeof window._artifactTourSnapshot === "function"
          ? window._artifactTourSnapshot()
          : null;
        return snapshot?.artifactId === "ngoc-lu" && snapshot.hotspots?.includes("center");
      }
      if (requirement === "3d:complete") {
        const snapshot = typeof window._m3dTourSnapshot === "function"
          ? window._m3dTourSnapshot()
          : null;
        return Boolean(snapshot?.loaded && snapshot.rotated && snapshot.zoomed);
      }
      return false;
    };

    const refreshTourActionAvailability = () => {
      root.querySelectorAll(".ds-chat-tour-action").forEach((button) => {
        const requirement = button.dataset.tourRequirement;
        if (requirement) {
          const unlocked = tourRequirementMet(requirement);
          button.disabled = isSending || !unlocked;
          button.classList.toggle("is-unlocked", unlocked);
        } else if (!isSending) {
          button.disabled = false;
        }
      });
    };

    const currentPageMatches = (step) => {
      if (!step.page) return true;
      const normalizedPath = window.location.pathname.replace(/\\/g, "/");
      if (!normalizedPath.endsWith(`/${step.page}`)) return false;
      const currentParams = new URLSearchParams(window.location.search);
      return Object.entries(step.params || {}).every(
        ([key, value]) => currentParams.get(key) === String(value),
      );
    };

    const buildTourDestination = (step) => {
      const url = new URL(step.page, APP_ROOT_URL);
      Object.entries(step.params || {}).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
      if (activeTourState) {
        url.searchParams.set("tour", activeTourState.tourId);
        url.searchParams.set("step", String(activeTourState.stepIndex));
      }
      if (step.target?.startsWith("#")) url.hash = step.target;
      return url.href;
    };

    const focusTourTarget = (step) => {
      document.querySelectorAll(".is-tour-focus").forEach((element) => {
        element.classList.remove("is-tour-focus");
      });
      if (!step.target) return;
      window.setTimeout(() => {
        const target = document.querySelector(step.target);
        target?.classList.add("is-tour-focus");
        target?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
      }, 180);
    };

    const performPageAction = (actionName) => {
      const modelByAction = {
        "open-reference-model-01": "dongsonbronze",
        "open-reference-model-02": "trongdong2",
      };
      const modelId = modelByAction[actionName];
      if (!modelId) return false;

      if (typeof window._m3dLoadModel === "function") {
        window._m3dLoadModel(modelId);
        return true;
      }

      const viewerState = typeof window._m3dTourSnapshot === "function"
        ? window._m3dTourSnapshot()
        : null;
      if (viewerState?.available === false) return false;

      const fallbackButton = document.querySelector(`[data-model-id="${modelId}"]`);
      if (fallbackButton) {
        fallbackButton.click();
        return true;
      }
      return false;
    };

    const readCompletedTours = () => {
      try {
        const completed = JSON.parse(localStorage.getItem(TOUR_COMPLETED_KEY));
        return completed && typeof completed === "object" ? completed : {};
      } catch (_error) {
        return {};
      }
    };

    const recordCompletedTour = (tourId, result) => {
      try {
        const completed = readCompletedTours();
        const previous = completed[tourId];
        const previousBest = typeof previous === "object" ? Number(previous.bestScore) || 0 : 0;
        completed[tourId] = {
          ...result,
          bestScore: Math.max(previousBest, result.score),
          completedAt: new Date().toISOString(),
        };
        localStorage.setItem(TOUR_COMPLETED_KEY, JSON.stringify(completed));
      } catch (_error) {
        // Kết quả vẫn được hiển thị trong phiên hiện tại nếu localStorage bị chặn.
      }
    };

    const leaveTour = (completed = false) => {
      const finishedState = activeTourState ? { ...activeTourState } : null;
      const finishedTourId = finishedState?.tourId;
      const tour = TOUR_DEFINITIONS[finishedTourId];
      let completionSummary = "";
      if (completed && finishedTourId && tour) {
        const maxScore = Number(tour.maxScore)
          || tour.steps.reduce(
            (total, step) => total + Math.max(0, ...((step.actions || []).map((action) => Number(action.score) || 0))),
            0,
          );
        const score = Math.min(maxScore, Number(finishedState.score) || 0);
        const ratio = maxScore ? score / maxScore : 1;
        const badge = ratio >= 1
          ? "Nhà nghiên cứu Ngọc Lũ"
          : ratio >= 0.65
            ? "Nhà quan sát Đông Sơn"
            : "Người khám phá di sản";
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - new Date(finishedState.startedAt).getTime()) / 1000),
        );
        recordCompletedTour(finishedTourId, {
          score,
          maxScore,
          badge,
          durationSeconds,
          answers: finishedState.answers,
          ragChecks: finishedState.ragChecks,
        });
        const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
        completionSummary = `HOÀN THÀNH NHIỆM VỤ\n\n${tour.title}\nĐiểm: ${score}/${maxScore} · ${durationMinutes} phút\nHuy hiệu: ${badge}\n\nKết quả tốt nhất được lưu trên thiết bị này. Bạn có thể mở Tour AI để thử lại hoặc chọn hành trình khác.`;
      }
      activeTourState = null;
      saveTourState();
      setTourMode(false);
      messages.replaceChildren();
      createMessage(
        "ai",
        completed
          ? completionSummary
          : "Tour đã được dừng. Tiến độ hiện tại đã được xóa khỏi thiết bị.",
        { tour: true },
      );
      renderSuggestions(INITIAL_SUGGESTIONS);
    };

    const renderTourPicker = () => {
      activeTourState = null;
      saveTourState();
      setTourMode(false);
      messages.replaceChildren();
      suggestionLabel.hidden = true;
      suggestionList.hidden = true;
      tourEntryBtn.hidden = false;

      const completedTours = readCompletedTours();
      const actions = Object.entries(TOUR_DEFINITIONS).map(([tourId, tour], index) => {
        const completion = completedTours[tourId];
        const result = typeof completion === "object" && completion
          ? ` · tốt nhất ${completion.bestScore}/${completion.maxScore}`
          : completion
            ? " · đã hoàn thành"
            : "";
        return {
          label: `${index + 1}. ${tour.title} · ${tour.duration}${result}`,
          tourId,
          primary: index === 0,
        };
      });
      createMessage(
        "ai",
        "Chọn một hành trình có hướng dẫn:\n\n• Ngọc Lũ: dùng hồ sơ đúng hiện vật; 3D chỉ là bước minh họa tùy chọn.\n• Thực hành 3D: không gắn tên hiện vật cho ba model.\n• Bảo tàng ảo: bạn tự điều khiển trong không gian nhúng.",
        {
          tour: true,
          actions,
          actionLabel: "Danh sách Tour AI",
          onAction: (action) => {
            activeTourState = {
              tourId: action.tourId,
              stepIndex: 0,
              score: 0,
              answers: {},
              attempts: {},
              ragChecks: [],
              startedAt: new Date().toISOString(),
            };
            saveTourState();
            renderTourStep();
          },
        },
      );
    };

    const handleTourAction = (action, button) => {
      if (!activeTourState) return;
      if (action.requires && !tourRequirementMet(action.requires)) {
        refreshTourActionAvailability();
        return;
      }
      button.disabled = true;

      if (action.navigate) {
        window.location.assign(action.navigate);
        return;
      }
      if (action.exit) {
        leaveTour(false);
        return;
      }
      if (action.complete) {
        createMessage("user", action.label, { tour: true });
        leaveTour(true);
        return;
      }

      if (action.ask) {
        if (!activeTourState.ragChecks.includes(action.ask)) {
          activeTourState.ragChecks.push(action.ask);
          saveTourState();
        }
        submitQuestion(action.ask);
        return;
      }

      createMessage("user", action.label, { tour: true });

      if (action.pageAction) {
        const succeeded = performPageAction(action.pageAction);
        createMessage(
          "ai",
          succeeded
            ? "Mô hình tham khảo đã được mở. Hãy xoay và zoom để quan sát, sau đó chọn nút xác nhận ở bước phía trên."
            : "Viewer 3D chưa sẵn sàng trên trình duyệt này. Bạn có thể thử chọn thẻ mô hình trong thư viện hoặc dùng nút “Bỏ qua phần còn lại” để tiếp tục tour.",
          { tour: true },
        );
        return;
      }

      if (action.answer) {
        activeTourState.answers[String(activeTourState.stepIndex)] = action.answer;
      }
      if (action.score) {
        activeTourState.score += Number(action.score) || 0;
        updateTourStatus();
      }

      if (action.stay) {
        const stepKey = String(activeTourState.stepIndex);
        activeTourState.attempts[stepKey] = (Number(activeTourState.attempts[stepKey]) || 0) + 1;
        button.disabled = false;
        createMessage("ai", action.feedback || "Hãy thử lại một lần nữa.", { tour: true });
        saveTourState();
        return;
      }

      if (Number.isInteger(action.next)) {
        activeTourState.stepIndex = action.next;
        saveTourState();
        window.setTimeout(renderTourStep, 180);
      }
    };

    const renderTourStep = () => {
      if (!activeTourState) return;
      const tour = TOUR_DEFINITIONS[activeTourState.tourId];
      const step = tour?.steps[activeTourState.stepIndex];
      if (!tour || !step) {
        leaveTour(false);
        return;
      }

      setTourMode(true);
      updateTourStatus();
      openPanel();
      messages.replaceChildren();

      if (!currentPageMatches(step)) {
        const destination = buildTourDestination(step);
        createMessage(
          "ai",
          `Bước ${activeTourState.stepIndex + 1} diễn ra tại một khu vực khác của website. Tiến độ đã được lưu và chatbox sẽ tự mở lại khi trang mới tải xong.`,
          {
            tour: true,
            actions: [
              {
                label: step.travelLabel || "Đi đến điểm tiếp theo",
                navigate: destination,
                primary: true,
              },
              { label: "Thoát tour", exit: true, danger: true },
            ],
            onAction: handleTourAction,
          },
        );
        return;
      }

      focusTourTarget(step);
      createMessage("ai", step.text, {
        tour: true,
        actions: step.actions || [],
        onAction: handleTourAction,
      });
      refreshTourActionAvailability();
    };

    const askBackend = async (question) => {
      const response = await fetch(CHAT_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: shortHistory(),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const error = new Error(normalizeAnswer(data));
        error.hasPublicMessage = Boolean(
          data &&
            typeof data === "object" &&
            (data.message || data.answer || data.response),
        );
        error.code = data?.error_code || null;
        error.requestId = data?.request_id || null;
        throw error;
      }

      return normalizeResponse(data);
    };

    const setSendingState = (nextState) => {
      isSending = nextState;
      input.disabled = nextState;
      sendBtn.disabled = nextState;
      sendBtn.classList.toggle("is-disabled", nextState);
      messages.setAttribute("aria-busy", String(nextState));
      root.querySelectorAll(".ds-chat-chip, .ds-chat-retry").forEach((button) => {
        button.disabled = nextState;
      });
      if (nextState) {
        root.querySelectorAll(".ds-chat-tour-action").forEach((button) => {
          button.disabled = true;
        });
      } else {
        refreshTourActionAvailability();
      }
    };

    const submitQuestion = async (rawQuestion) => {
      const question = cleanText(rawQuestion, 500);
      if (!question || isSending) return;

      createMessage("user", question);
      input.value = "";
      setSendingState(true);
      const loadingMessage = createMessage("ai", "", { loading: true });

      try {
        const result = await askBackend(question);
        loadingMessage.remove();
        createMessage("ai", result.answer, {
          interactionId: result.interactionId,
          question,
          sources: result.sources,
        });
        rememberExchange(question, result.answer);
        renderSuggestions(contextualSuggestions(result, question), true);
      } catch (error) {
        loadingMessage.remove();
        const publicMessage = error.hasPublicMessage ? error.message : FALLBACK_MESSAGE;
        createMessage("ai", publicMessage, { error: true });
      } finally {
        setSendingState(false);
        input.focus();
      }
    };

    fab.addEventListener("click", openPanel);
    closeBtn.addEventListener("click", closePanel);
    minBtn.addEventListener("click", closePanel);
    tourEntryBtn.addEventListener("click", () => {
      openPanel();
      activeTourState = loadTourState();
      if (activeTourState) renderTourStep();
      else renderTourPicker();
    });
    tourExitBtn.addEventListener("click", () => leaveTour(false));
    window.addEventListener("artifact:tour-state", refreshTourActionAvailability);
    window.addEventListener("museum3d:tour-state", refreshTourActionAvailability);
    sendBtn.addEventListener("click", () => submitQuestion(input.value));

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitQuestion(input.value);
      }
    });

    panel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePanel();
    });

    activeTourState = loadTourState();
    if (activeTourState) renderTourStep();
    else renderSuggestions(INITIAL_SUGGESTIONS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureChatbox, { once: true });
  } else {
    ensureChatbox();
  }
})();
