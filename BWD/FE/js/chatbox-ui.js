(() => {
  const CHAT_API_ENDPOINT = "http://localhost:5000/api/v1/chat/ask";
  const FALLBACK_MESSAGE =
    "Hiện tại AI Đông Sơn chưa kết nối được máy chủ. Bạn vui lòng thử lại sau.";

  function ensureChatbox() {
    if (document.getElementById("ds-chat-root")) return;

    const root = document.createElement("div");
    root.id = "ds-chat-root";
    root.innerHTML = `
      <div class="ds-chat-shell">
        <section class="ds-chat-panel" id="ds-chat-panel" aria-label="AI Đông Sơn">
          <header class="ds-chat-header">
            <div class="ds-chat-brand">
              <div class="ds-chat-brand-copy">
                <strong>AI ĐÔNG SƠN</strong>
                <small>Trợ lý khám phá di sản • RAG ready</small>
              </div>
            </div>

            <div class="ds-chat-header-actions">
              <button class="ds-chat-iconbtn" id="ds-chat-min" aria-label="Thu nhỏ">•••</button>
              <button class="ds-chat-iconbtn" id="ds-chat-close" aria-label="Đóng">✕</button>
            </div>
          </header>

          <div class="ds-chat-body" id="ds-chat-body">
            <article class="ds-chat-intro">
              <div class="ds-chat-intro-avatar">🪙</div>
              <p>
                Xin chào! Ta là <strong>AI Đông Sơn</strong> — người bạn đồng hành giúp người khám phá
                bí mật của trống đồng và văn hóa Việt cổ.
              </p>
            </article>

            <div class="ds-chat-messages" id="ds-chat-messages" aria-live="polite"></div>

            <div class="ds-chat-suggest-label">GỢI Ý CÂU HỎI</div>
            <div class="ds-chat-suggest-list">
              <button class="ds-chat-chip" type="button">✦ Trống đồng Đông Sơn là gì?</button>
              <button class="ds-chat-chip" type="button">✦ Hoa văn chim Lạc có ý nghĩa gì?</button>
              <button class="ds-chat-chip" type="button">✦ Vì sao trống đồng Đông Sơn được coi là bảo vật?</button>
            </div>
          </div>

          <footer class="ds-chat-footer">
            <div class="ds-chat-input-wrap">
              <input class="ds-chat-input" id="ds-chat-input" placeholder="Hỏi AI Đông Sơn..." maxlength="500" />
              <button class="ds-chat-send" id="ds-chat-send" aria-label="Gửi">➤</button>
            </div>
            <div class="ds-chat-note">AI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.</div>
          </footer>
        </section>

        <div class="ds-chat-fab-wrap">
          <button class="ds-chat-fab" id="ds-chat-fab" aria-label="Mở chat">
            <span class="ds-chat-fab__icon" role="img" aria-label="Biểu tượng của chatbox" title="Biểu tượng của chatbox"></span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    const panel = document.getElementById("ds-chat-panel");
    const body = document.getElementById("ds-chat-body");
    const messages = document.getElementById("ds-chat-messages");
    const input = document.getElementById("ds-chat-input");
    const sendBtn = document.getElementById("ds-chat-send");
    const fab = document.getElementById("ds-chat-fab");
    const closeBtn = document.getElementById("ds-chat-close");
    const minBtn = document.getElementById("ds-chat-min");
    const suggestionButtons = root.querySelectorAll(".ds-chat-chip");

    let isSending = false;

    const openPanel = () => {
      panel.classList.add("is-open");
      root.classList.add("is-open");
      setTimeout(() => input.focus(), 120);
    };

    const closePanel = () => {
      panel.classList.remove("is-open");
      root.classList.remove("is-open");
    };

    const scrollToBottom = () => {
      body.scrollTop = body.scrollHeight;
    };

    const createMessage = (role, text, options = {}) => {
      const message = document.createElement("article");
      message.className = `ds-chat-message ds-chat-message--${role}`;

      if (options.loading) {
        message.classList.add("is-loading");
      }

      if (options.error) {
        message.classList.add("is-error");
      }

      const avatar = document.createElement("div");
      avatar.className = "ds-chat-message-avatar";
      avatar.textContent = role === "user" ? "Bạn" : "AI";

      const bubble = document.createElement("div");
      bubble.className = "ds-chat-bubble";

      if (options.loading) {
        bubble.innerHTML = `
          <span>AI Đông Sơn đang tra cứu tư liệu</span>
          <span class="ds-chat-typing" aria-hidden="true"><i></i><i></i><i></i></span>
        `;
      } else {
        bubble.textContent = text;
      }

      message.appendChild(avatar);
      message.appendChild(bubble);
      messages.appendChild(message);
      scrollToBottom();

      return message;
    };

    const normalizeAnswer = (data) => {
      if (!data) return FALLBACK_MESSAGE;
      if (typeof data === "string") return data;
      return data.answer || data.message || data.response || FALLBACK_MESSAGE;
    };

    const askBackend = async (question) => {
      const response = await fetch(CHAT_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(normalizeAnswer(data));
      }

      return normalizeAnswer(data);
    };

    const setSendingState = (nextState) => {
      isSending = nextState;
      input.disabled = nextState;
      sendBtn.disabled = nextState;
      sendBtn.classList.toggle("is-disabled", nextState);
    };

    const submitQuestion = async (rawQuestion) => {
      const question = rawQuestion.trim();

      if (!question || isSending) return;

      createMessage("user", question);
      input.value = "";
      setSendingState(true);

      const loadingMessage = createMessage("ai", "", { loading: true });

      try {
        const answer = await askBackend(question);
        loadingMessage.remove();
        createMessage("ai", answer);
      } catch (error) {
        loadingMessage.remove();
        createMessage("ai", error.message || FALLBACK_MESSAGE, { error: true });
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

    suggestionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const question = button.textContent.replace("✦", "").trim();
        submitQuestion(question);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureChatbox);
  } else {
    ensureChatbox();
  }
})();
