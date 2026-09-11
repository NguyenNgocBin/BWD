(function () {
    const artifacts = {
        "ngoc-lu": {
            title: "Trống Ngọc Lũ",
            type: "Heger I · Bảo vật quốc gia",
            image: "../images/ngocLu.gif",
            era: "Khoảng thế kỷ III–II TCN",
            found: "Hà Nam, năm 1893",
            museum: "Bảo tàng Lịch sử Quốc gia",
            summary: "Một trong những trống Đông Sơn đẹp, cân đối và giàu hoa văn nhất.",
            description: "Trống Ngọc Lũ nổi bật bởi hình dáng hài hòa và hệ thống hoa văn dày đặc, phản ánh đời sống, nghi lễ và trình độ luyện kim của cư dân Đông Sơn.",
            motifs: [
                "Ngôi sao 14 cánh ở trung tâm",
                "Người hóa trang lông chim, múa và giã gạo",
                "Nhà sàn, thuyền và các vòng chim bay"
            ],
            questions: [
                ["Vì sao Ngọc Lũ là bảo vật quốc gia?", "Vì hiện vật có giá trị đặc biệt về lịch sử, nghệ thuật và kỹ thuật đúc đồng."],
                ["Hoa văn trung tâm là gì?", "Ngôi sao 14 cánh, bao quanh bởi nhiều vành hoa văn."]
            ]
        },
        "hoang-ha": {
            title: "Trống Hoàng Hạ",
            type: "Heger I · Bảo vật quốc gia",
            image: "../images/hoangha.png",
            era: "Thời đại Đông Sơn",
            found: "Phú Xuyên, Hà Nội, năm 1937",
            museum: "Bảo tàng Lịch sử Quốc gia",
            summary: "Trống lớn có bố cục gần Ngọc Lũ và nhiều cảnh sinh hoạt tả thực.",
            description: "Hoàng Hạ được phát hiện khi đào mương. Hoa văn người, nhà sàn, thuyền, chim và vũ khí giúp nghiên cứu đời sống xã hội Đông Sơn.",
            motifs: [
                "Ngôi sao 16 cánh",
                "14 chim bay ngược chiều kim đồng hồ",
                "Người, nhà sàn, thuyền, mộc và cung tên"
            ],
            questions: [
                ["Hoàng Hạ được tìm thấy khi nào?", "Năm 1937 tại làng Hoàng Hạ."],
                ["Hoàng Hạ giống Ngọc Lũ ở đâu?", "Hai trống có bố cục hoa văn và nhiều cảnh tả thực tương đồng."]
            ]
        },
        "co-loa": {
            title: "Trống Cổ Loa",
            type: "Heger I · Không gian Âu Lạc",
            image: "../images/coloa.png",
            era: "Giai đoạn Đông Sơn – Âu Lạc",
            found: "Khu vực thành Cổ Loa, Hà Nội",
            museum: "Gắn với sưu tập khảo cổ Cổ Loa",
            summary: "Hiện vật quan trọng để tìm hiểu văn hóa Đông Sơn trong trung tâm Âu Lạc.",
            description: "Bối cảnh phát hiện tại Cổ Loa tạo giá trị đặc biệt khi nghiên cứu sự hình thành nhà nước sớm và vai trò của trống trong đời sống chính trị, nghi lễ.",
            motifs: [
                "Ngôi sao và vành hình học",
                "Mô-típ đặc trưng nhóm trống Đông Sơn sớm",
                "Bố cục mặt, tang và thân cân đối"
            ],
            questions: [
                ["Cổ Loa có ý nghĩa gì?", "Đây là trung tâm chính trị của Âu Lạc thời An Dương Vương."],
                ["Có chắc trống được đúc tại Cổ Loa không?", "Không nên khẳng định khi chưa có chứng cứ trực tiếp về địa điểm sản xuất."]
            ]
        },
        "tan-long": {
            title: "Trống Tân Long",
            type: "Heger II",
            image: "../images/dongsonz2.png",
            era: "Giai đoạn sau Đông Sơn",
            found: "Khu vực miền núi phía Bắc",
            museum: "Hiện vật nghiên cứu loại hình Heger II",
            summary: "Đại diện giúp so sánh sự biến đổi loại hình trống đồng.",
            description: "Trống Tân Long được dùng trong nội dung học để đối chiếu hình dáng và hoa văn giữa nhóm Heger I và Heger II.",
            motifs: [
                "Mặt trống mở rộng",
                "Hoa văn hình học chiếm tỷ lệ lớn",
                "Dáng thân khác nhóm Ngọc Lũ"
            ],
            questions: [
                ["Tân Long thuộc nhóm nào?", "Thuộc loại hình Heger II."],
                ["Vì sao nên so sánh với Ngọc Lũ?", "So sánh giúp nhận ra sự khác biệt về hình dáng và phong cách trang trí."]
            ]
        }
    };

    const coordinates = {
        "ngoc-lu": [20.5835, 105.9229],
        "hoang-ha": [20.7295, 105.9026],
        "co-loa": [21.1146, 105.8722],
        "tan-long": [22.3500, 104.0000]
    };

    // Preload all artifact images immediately in background so switching is instant
    Object.values(artifacts).forEach((item) => {
        if (item.image) {
            const img = new Image();
            img.src = item.image;
        }
    });

    const set = (key, value) => {
        const el = document.getElementById(key);
        if (el) el.textContent = value;
    };

    let currentRenderedId = null;

    function renderArtifact(id, updateHistory = true) {
        const item = artifacts[id] || artifacts["ngoc-lu"];
        const actualId = artifacts[id] ? id : "ngoc-lu";

        if (currentRenderedId === actualId) return;
        currentRenderedId = actualId;

        document.title = `${item.title} · Đông Sơn`;

        set("artifactTitle", item.title);
        set("artifactType", item.type);
        set("artifactSummary", item.summary);
        set("artifactEra", item.era);
        set("artifactFound", item.found);
        set("artifactMuseum", item.museum);
        set("artifactDescription", item.description);

        const image = document.getElementById("artifactImage");
        if (image) {
            image.src = item.image;
            image.alt = item.title;
        }

        const motifsEl = document.getElementById("artifactMotifs");
        if (motifsEl) {
            motifsEl.innerHTML = item.motifs.map((x) => `<li>${x}</li>`).join("");
        }

        const questionsEl = document.getElementById("artifactQuestions");
        if (questionsEl) {
            questionsEl.innerHTML = item.questions
                .map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`)
                .join("");
        }

        const [lat, lon] = coordinates[actualId] || coordinates["ngoc-lu"];
        const mapEl = document.getElementById("artifactMap");
        if (mapEl) {
            const targetMapSrc = `https://maps.google.com/maps?q=${lat},${lon}&hl=vi&z=14&output=embed`;
            if (mapEl.src !== targetMapSrc) {
                mapEl.src = targetMapSrc;
            }
        }

        const mapLink = document.getElementById("artifactMapLink");
        if (mapLink) {
            mapLink.href = `./Map.html?lat=${lat}&lon=${lon}&artifact=${encodeURIComponent(item.title)}`;
        }

        const navEl = document.getElementById("artifactNavigation");
        if (navEl) {
            navEl.innerHTML = Object.entries(artifacts)
                .map(([key, value]) => {
                    const isCurrent = key === actualId;
                    return `<a href="?id=${key}" data-artifact-id="${key}" ${isCurrent ? 'aria-current="page" class="active"' : ""}>${value.title}</a>`;
                })
                .join("");
        }

        if (updateHistory && window.history && window.history.pushState) {
            const newUrl = `${location.pathname}?id=${actualId}`;
            if (location.search !== `?id=${actualId}`) {
                history.pushState({ id: actualId }, "", newUrl);
            }
        }
    }

    // Intercept clicks on navigation to switch instantly without page reload
    const navContainer = document.getElementById("artifactNavigation");
    if (navContainer) {
        navContainer.addEventListener("click", (e) => {
            const link = e.target.closest("a[data-artifact-id]");
            if (!link) return;
            e.preventDefault();
            const targetId = link.getAttribute("data-artifact-id");
            renderArtifact(targetId, true);
        });
    }

    // Handle browser back/forward buttons
    window.addEventListener("popstate", () => {
        const id = new URLSearchParams(location.search).get("id") || "ngoc-lu";
        renderArtifact(id, false);
    });

    // Initial render
    const initialId = new URLSearchParams(location.search).get("id") || "ngoc-lu";
    renderArtifact(initialId, false);
})();
