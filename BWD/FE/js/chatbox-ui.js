(() => {
  const BACKEND_ORIGIN =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:5001"
      : "https://bwd-backend.vercel.app";
  const CHAT_API_ENDPOINT = `${BACKEND_ORIGIN}/api/v1/chat/ask`;
  const CHAT_FEEDBACK_ENDPOINT = `${BACKEND_ORIGIN}/api/v1/chat/feedback`;
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
              <p>
                Xin chào! Ta là <strong>AI Đông Sơn</strong> — người bạn đồng hành giúp người khám phá
                bí mật của trống đồng và văn hóa Việt cổ.
              </p>
            </article>

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
    const suggestionLabel = root.querySelector("#ds-chat-suggest-label");
    const suggestionList = root.querySelector("#ds-chat-suggest-list");

    let isSending = false;
    let sourcePanelSequence = 0;
    const conversationHistory = [];

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

    renderSuggestions(INITIAL_SUGGESTIONS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureChatbox, { once: true });
  } else {
    ensureChatbox();
  }
})();
