(function () {
    const nameEl = document.getElementById("profileName");
    const renameBtn = document.getElementById("renameBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    renameBtn?.addEventListener("click", () => {
        const current = nameEl?.textContent?.trim() || "";
        const next = window.prompt("Nhập tên hiển thị mới:", current);

        if (!next) return;
        const trimmed = next.trim();
        if (!trimmed) return;

        nameEl.textContent = trimmed;
    });

    logoutBtn?.addEventListener("click", () => {
        const ok = window.confirm("Bạn chắc chắn muốn đăng xuất?");
        if (!ok) return;

        window.alert("Đã đăng xuất thành công.");
    });
})();
