(function () {
    const artifacts = {
        "ngoc-lu": { title:"Trống Ngọc Lũ", type:"Heger I · Bảo vật quốc gia", image:"../images/ngocLu.gif", era:"Khoảng thế kỷ III–II TCN", found:"Hà Nam, năm 1893", museum:"Bảo tàng Lịch sử Quốc gia", summary:"Một trong những trống Đông Sơn đẹp, cân đối và giàu hoa văn nhất.", description:"Trống Ngọc Lũ nổi bật bởi hình dáng hài hòa và hệ thống hoa văn dày đặc, phản ánh đời sống, nghi lễ và trình độ luyện kim của cư dân Đông Sơn.", motifs:["Ngôi sao 14 cánh ở trung tâm","Người hóa trang lông chim, múa và giã gạo","Nhà sàn, thuyền và các vòng chim bay"], questions:[["Vì sao Ngọc Lũ là bảo vật quốc gia?","Vì hiện vật có giá trị đặc biệt về lịch sử, nghệ thuật và kỹ thuật đúc đồng."],["Hoa văn trung tâm là gì?","Ngôi sao 14 cánh, bao quanh bởi nhiều vành hoa văn."]]},
        "hoang-ha": { title:"Trống Hoàng Hạ", type:"Heger I · Bảo vật quốc gia", image:"../images/hoangha.png", era:"Thời đại Đông Sơn", found:"Phú Xuyên, Hà Nội, năm 1937", museum:"Bảo tàng Lịch sử Quốc gia", summary:"Trống lớn có bố cục gần Ngọc Lũ và nhiều cảnh sinh hoạt tả thực.", description:"Hoàng Hạ được phát hiện khi đào mương. Hoa văn người, nhà sàn, thuyền, chim và vũ khí giúp nghiên cứu đời sống xã hội Đông Sơn.", motifs:["Ngôi sao 16 cánh","14 chim bay ngược chiều kim đồng hồ","Người, nhà sàn, thuyền, mộc và cung tên"], questions:[["Hoàng Hạ được tìm thấy khi nào?","Năm 1937 tại làng Hoàng Hạ."],["Hoàng Hạ giống Ngọc Lũ ở đâu?","Hai trống có bố cục hoa văn và nhiều cảnh tả thực tương đồng."]]},
        "co-loa": { title:"Trống Cổ Loa", type:"Heger I · Không gian Âu Lạc", image:"../images/coloa.png", era:"Giai đoạn Đông Sơn – Âu Lạc", found:"Khu vực thành Cổ Loa, Hà Nội", museum:"Gắn với sưu tập khảo cổ Cổ Loa", summary:"Hiện vật quan trọng để tìm hiểu văn hóa Đông Sơn trong trung tâm Âu Lạc.", description:"Bối cảnh phát hiện tại Cổ Loa tạo giá trị đặc biệt khi nghiên cứu sự hình thành nhà nước sớm và vai trò của trống trong đời sống chính trị, nghi lễ.", motifs:["Ngôi sao và vành hình học","Mô-típ đặc trưng nhóm trống Đông Sơn sớm","Bố cục mặt, tang và thân cân đối"], questions:[["Cổ Loa có ý nghĩa gì?","Đây là trung tâm chính trị của Âu Lạc thời An Dương Vương."],["Có chắc trống được đúc tại Cổ Loa không?","Không nên khẳng định khi chưa có chứng cứ trực tiếp về địa điểm sản xuất."]]},
        "tan-long": { title:"Trống Tân Long", type:"Heger II", image:"../images/dongsonz2.png", era:"Giai đoạn sau Đông Sơn", found:"Khu vực miền núi phía Bắc", museum:"Hiện vật nghiên cứu loại hình Heger II", summary:"Đại diện giúp so sánh sự biến đổi loại hình trống đồng.", description:"Trống Tân Long được dùng trong nội dung học để đối chiếu hình dáng và hoa văn giữa nhóm Heger I và Heger II.", motifs:["Mặt trống mở rộng","Hoa văn hình học chiếm tỷ lệ lớn","Dáng thân khác nhóm Ngọc Lũ"], questions:[["Tân Long thuộc nhóm nào?","Thuộc loại hình Heger II."],["Vì sao nên so sánh với Ngọc Lũ?","So sánh giúp nhận ra sự khác biệt về hình dáng và phong cách trang trí."]]}
    };
    const coordinates = {
        "ngoc-lu": [20.5835, 105.9229],
        "hoang-ha": [20.7295, 105.9026],
        "co-loa": [21.1146, 105.8722],
        "tan-long": [22.3500, 104.0000]
    };
    const id = new URLSearchParams(location.search).get("id") || "ngoc-lu";
    const item = artifacts[id] || artifacts["ngoc-lu"];
    document.title = `${item.title} · Đông Sơn`;
    const set = (key,value) => { const el=document.getElementById(key); if(el) el.textContent=value; };
    set("artifactTitle",item.title); set("artifactType",item.type); set("artifactSummary",item.summary); set("artifactEra",item.era); set("artifactFound",item.found); set("artifactMuseum",item.museum); set("artifactDescription",item.description);
    const image=document.getElementById("artifactImage"); image.src=item.image; image.alt=item.title;
    const exploredHotspots = new Set();
    const hotspotState = () => ({ artifactId: id, hotspots: Array.from(exploredHotspots) });
    window._artifactTourSnapshot = hotspotState;

    if (id === "ngoc-lu") {
        const imageStage = image.closest(".artifact-image");
        const hotspotLayer = document.createElement("div");
        hotspotLayer.className = "artifact-hotspots";
        hotspotLayer.setAttribute("aria-label", "Các điểm khám phá trên trống Ngọc Lũ");

        const observation = document.createElement("p");
        observation.className = "artifact-observation-note";
        observation.setAttribute("role", "status");
        observation.textContent = "Chọn một điểm sáng để quan sát chi tiết.";

        [
            { id: "center", label: "Trung tâm mặt trống", note: "Trung tâm là ngôi sao 14 cánh — mốc giúp đọc các vành hoa văn từ trong ra ngoài.", x: 50, y: 23 },
            { id: "rings", label: "Các vành hoa văn", note: "Các mô-típ được tổ chức thành nhiều vành đồng tâm, không phân bố ngẫu nhiên.", x: 34, y: 32 },
            { id: "body", label: "Thân trống", note: "Phần thân nằm dưới tang trống; đây là một phần của cấu tạo hình khối chung.", x: 52, y: 66 },
        ].forEach((hotspot, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "artifact-hotspot";
            button.dataset.hotspotId = hotspot.id;
            button.style.setProperty("--hotspot-x", `${hotspot.x}%`);
            button.style.setProperty("--hotspot-y", `${hotspot.y}%`);
            button.setAttribute("aria-label", `Điểm khám phá: ${hotspot.label}`);
            button.innerHTML = `<span>${index + 1}</span><small>${hotspot.label}</small>`;
            button.addEventListener("click", () => {
                exploredHotspots.add(hotspot.id);
                button.classList.add("is-explored");
                button.setAttribute("aria-pressed", "true");
                observation.textContent = hotspot.note;
                window.dispatchEvent(new CustomEvent("artifact:tour-state", { detail: hotspotState() }));
            });
            hotspotLayer.appendChild(button);
        });

        imageStage?.append(hotspotLayer, observation);
    }
    document.getElementById("artifactMotifs").innerHTML=item.motifs.map(x=>`<li>${x}</li>`).join("");
    document.getElementById("artifactQuestions").innerHTML=item.questions.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join("");
    const [lat, lon] = coordinates[id] || coordinates["ngoc-lu"];
    const delta = 0.12;
    document.getElementById("artifactMap").src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-delta}%2C${lat-delta}%2C${lon+delta}%2C${lat+delta}&layer=mapnik&marker=${lat}%2C${lon}`;
    document.getElementById("artifactMapLink").href = `./Map.html?lat=${lat}&lon=${lon}&artifact=${encodeURIComponent(item.title)}`;
    document.getElementById("artifactNavigation").innerHTML=Object.entries(artifacts).map(([key,value])=>`<a href="?id=${key}" ${key===id?'aria-current="page"':''}>${value.title}</a>`).join("");
})();
