let places = [];

const regionColors = {
            "Bắc Bộ": "#30b85a",
            "Bắc Trung Bộ": "#f1c232",
            "Trung Bộ": "#f28c28",
            "Tây Nguyên": "#d93b32",
            "Nam Bộ": "#2f80ed"
        };

        const regionClasses = {
            "Bắc Bộ": "region-bac-bo",
            "Bắc Trung Bộ": "region-bac-trung-bo",
            "Trung Bộ": "region-trung-bo",
            "Tây Nguyên": "region-tay-nguyen",
            "Nam Bộ": "region-nam-bo"
        };

        const drumPlaces = [
            {
                id: "trong-ngoc-lu",
                name: "Trống đồng Ngọc Lũ",
                province: "Bình Lục, Hà Nam",
                coords: [20.5333, 105.9167],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "1893",
                region: "Bắc Bộ",
                image: "../images/ngocLu.gif",
                detail: "Trống đồng Ngọc Lũ là một trong những trống đồng Đông Sơn tiêu biểu nhất, được phát hiện tại Bình Lục, Hà Nam. Hiện vật nổi bật với hoa văn mặt trời, chim Lạc, người hóa trang, thuyền và cảnh sinh hoạt lễ hội."
            },
            {
                id: "trong-song-da",
                name: "Trống đồng Sông Đà",
                province: "Hòa Bình",
                coords: [20.84, 105.27],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Khoảng 1889-1890",
                region: "Bắc Bộ",
                image: "../images/TrongDongbg.png",
                detail: "Trống đồng Sông Đà được phát hiện ở khu vực Hòa Bình, thuộc tuyến Tây Bắc. Sự xuất hiện của trống ở vùng sông Đà cho thấy không gian phân bố Đông Sơn không chỉ nằm ở đồng bằng."
            },
            {
                id: "trong-hoang-ha",
                name: "Trống đồng Hoàng Hạ",
                province: "Phú Xuyên, Hà Nội",
                coords: [20.7409, 105.9139],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "1937",
                region: "Bắc Bộ",
                image: "../images/TrongDong.png",
                detail: "Trống đồng Hoàng Hạ được phát hiện tại Phú Xuyên, Hà Nội. Đây là một hiện vật tiêu biểu của đồng bằng Bắc Bộ, thường được nhắc cùng nhóm trống Đông Sơn lớn và có giá trị mỹ thuật cao."
            },
            {
                id: "trong-co-loa",
                name: "Trống đồng Cổ Loa",
                province: "Đông Anh, Hà Nội",
                coords: [21.1167, 105.8728],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "1982",
                region: "Bắc Bộ",
                image: "../images/coloa.png",
                detail: "Trống đồng Cổ Loa được phát hiện tại Đông Anh, Hà Nội. Vị trí này gắn với không gian văn hóa Âu Lạc, thành Cổ Loa và lớp tiếp nối quan trọng sau văn hóa Đông Sơn."
            },
            {
                id: "trong-khai-hoa",
                name: "Trống đồng Khai Hóa",
                province: "Lào Cai",
                coords: [22.4856, 103.9707],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Đầu thế kỷ XX",
                region: "Bắc Bộ",
                image: "../images/TrongDongbg.png",
                detail: "Trống đồng Khai Hóa được ghi nhận ở Lào Cai, thuộc vùng Tây Bắc. Marker này giúp thể hiện tuyến lan tỏa của trống đồng lên khu vực thượng nguồn và miền núi phía Bắc."
            },
            {
                id: "trong-cam-giang",
                name: "Trống đồng Cẩm Giang",
                province: "Hải Dương",
                coords: [20.9507, 106.2447],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Bắc Bộ",
                image: "../images/TrongDong.png",
                detail: "Trống đồng Cẩm Giang được phát hiện tại Hải Dương, thuộc đồng bằng Bắc Bộ. Đây là một điểm bổ sung quan trọng để thấy mạng lưới phân bố trống đồng quanh châu thổ sông Hồng."
            },
            {
                id: "trong-huu-chung",
                name: "Trống đồng Hữu Chung",
                province: "Thanh Hóa",
                coords: [19.8066, 105.7850],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Bắc Trung Bộ",
                image: "../images/TrongDongHV.jpg",
                detail: "Trống đồng Hữu Chung thuộc nhóm phát hiện ở Thanh Hóa, vùng lõi của văn hóa Đông Sơn. Thanh Hóa là địa phương có số lượng trống đồng Đông Sơn được tìm thấy rất lớn."
            },
            {
                id: "trong-sao-vang",
                name: "Trống đồng Sao Vàng",
                province: "Thọ Xuân, Thanh Hóa",
                coords: [19.9026, 105.4680],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Khoảng 1930-1940",
                region: "Bắc Trung Bộ",
                image: "../images/TrongDong.png",
                detail: "Trống đồng Sao Vàng được phát hiện tại Thọ Xuân, Thanh Hóa. Điểm này cho thấy mật độ trống đồng cao ở vùng Bắc Trung Bộ, đặc biệt quanh lưu vực sông Mã."
            },
            {
                id: "trong-song-ma",
                name: "Trống đồng Sông Mã",
                province: "Thanh Hóa",
                coords: [19.8076, 105.7766],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Bắc Trung Bộ",
                image: "../images/TrongDongHV.jpg",
                detail: "Trống đồng Sông Mã gắn với khu vực Thanh Hóa và lưu vực sông Mã, cái nôi của văn hóa Đông Sơn. Khu vực này phát hiện nhiều trống đồng, mộ táng, công cụ sản xuất và vũ khí đồng."
            },
            {
                id: "trong-quy-chu",
                name: "Trống đồng Quỳ Chữ",
                province: "Nghệ An",
                coords: [19.1131, 105.2507],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Bắc Trung Bộ",
                image: "../images/TrongDongbg.png",
                detail: "Trống đồng Quỳ Chữ được phát hiện ở Nghệ An, mở rộng không gian Đông Sơn xuống Bắc Trung Bộ. Marker này nối tuyến Thanh Hóa - Nghệ An trên bản đồ phân bố trống đồng."
            },
            {
                id: "trong-duy-xuyen",
                name: "Trống đồng Duy Xuyên",
                province: "Quảng Nam",
                coords: [15.7916, 108.2025],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Trung Bộ",
                image: "../images/TrongDong.png",
                detail: "Trống đồng Duy Xuyên thuộc nhóm phát hiện ở Quảng Nam, vùng Trung Trung Bộ. Sự xuất hiện tại đây cho thấy trống đồng Đông Sơn lan tỏa dọc miền Trung."
            },
            {
                id: "trong-hoa-vang",
                name: "Trống đồng Hòa Vang",
                province: "Đà Nẵng",
                coords: [15.9877, 108.1048],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Trung Bộ",
                image: "../images/TrongDongbg.png",
                detail: "Trống đồng Hòa Vang được ghi nhận tại Đà Nẵng. Marker này thể hiện tuyến phân bố ở Trung Trung Bộ, nơi giao lưu giữa nhiều lớp văn hóa cổ."
            },
            {
                id: "trong-go-que",
                name: "Trống đồng Gò Quê",
                province: "Bình Định",
                coords: [13.7829, 109.2197],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Trung Bộ",
                image: "../images/TrongDong.png",
                detail: "Trống đồng Gò Quê thuộc Bình Định, Nam Trung Bộ. Vị trí này giúp bản đồ thể hiện sự mở rộng của trống đồng Đông Sơn xuống vùng duyên hải miền Trung."
            },
            {
                id: "trong-nha-trang",
                name: "Trống đồng Nha Trang",
                province: "Khánh Hòa",
                coords: [12.2388, 109.1967],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Trung Bộ",
                image: "../images/TrongDongbg.png",
                detail: "Trống đồng Nha Trang được ghi nhận tại Khánh Hòa. Đây là điểm Nam Trung Bộ quan trọng, cho thấy trống đồng hiện diện sâu hơn về phía Nam so với vùng lõi Đông Sơn."
            },
            {
                id: "trong-an-khe",
                name: "Trống đồng An Khê",
                province: "Gia Lai",
                coords: [13.9550, 108.6578],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Tây Nguyên",
                image: "../images/TrongDong.png",
                detail: "Trống đồng An Khê được ghi nhận tại Gia Lai, thuộc Tây Nguyên. Marker này nhấn mạnh rằng trống đồng Đông Sơn không chỉ phân bố ở đồng bằng và ven biển."
            },
            {
                id: "trong-kon-tum",
                name: "Trống đồng Kon Tum",
                province: "Kon Tum",
                coords: [14.3545, 108.0076],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Tây Nguyên",
                image: "../images/TrongDongbg.png",
                detail: "Trống đồng Kon Tum được đánh dấu như một điểm Tây Nguyên tiêu biểu, giúp người xem thấy sự phân bố của trống đồng ở không gian cao nguyên."
            },
            {
                id: "trong-phu-chanh",
                name: "Trống đồng Phú Chánh",
                province: "Bình Dương",
                coords: [11.0407, 106.7090],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "1998",
                region: "Nam Bộ",
                image: "../images/TrongDong.png",
                detail: "Trống đồng Phú Chánh được phát hiện tại Bình Dương năm 1998. Đây là một điểm nổi bật ở Đông Nam Bộ, cho thấy phạm vi lan tỏa rộng của trống đồng Đông Sơn."
            },
            {
                id: "trong-long-giao",
                name: "Trống đồng Long Giao",
                province: "Đồng Nai",
                coords: [10.8979, 107.1724],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Nam Bộ",
                image: "../images/TrongDongbg.png",
                detail: "Trống đồng Long Giao được ghi nhận tại Đồng Nai, thuộc Đông Nam Bộ. Marker này bổ sung tuyến phân bố trống đồng trong không gian Nam Bộ."
            },
            {
                id: "trong-vung-tau",
                name: "Trống đồng Vũng Tàu",
                province: "Bà Rịa - Vũng Tàu",
                coords: [10.4114, 107.1362],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Nam Bộ",
                image: "../images/TrongDong.png",
                detail: "Trống đồng Vũng Tàu nằm trong nhóm phát hiện ở Đông Nam Bộ, phản ánh khả năng giao lưu văn hóa cổ theo tuyến ven biển."
            },
            {
                id: "trong-oc-eo",
                name: "Trống đồng Óc Eo",
                province: "Kiên Giang",
                coords: [10.2573, 105.1515],
                icon: "🥁",
                type: "Trống đồng Đông Sơn",
                discovered: "Thế kỷ XX",
                region: "Nam Bộ",
                image: "../images/TrongDongbg.png",
                detail: "Trống đồng Óc Eo được đánh dấu tại Kiên Giang, Tây Nam Bộ. Đây là điểm phía Nam trong bản đồ, giúp thấy rõ độ rộng của mạng lưới phân bố trống đồng."
            }
        ].map((place) => ({
            ...place,
            color: regionColors[place.region],
            link: "./tailieu.html"
        }));

        const islandPlaces = [
            {
                id: "truong-sa",
                name: "Quần đảo Trường Sa",
                province: "Khánh Hòa, Việt Nam",
                coords: [10.0, 114.0],
                icon: "🏝",
                type: "Biển đảo",
                image: "../images/TrongDongbg.png",
                detail: "Quần đảo Trường Sa của Việt Nam được đánh dấu để bản đồ thể hiện đầy đủ không gian biển đảo trong phần khám phá lãnh thổ Việt Nam.",
                link: "#dongSonMap",
                island: true
            },
            {
                id: "hoang-sa",
                name: "Quần đảo Hoàng Sa",
                province: "Đà Nẵng, Việt Nam",
                coords: [16.5, 112.0],
                icon: "🏝",
                type: "Biển đảo",
                image: "../images/TrongDongbg.png",
                detail: "Quần đảo Hoàng Sa của Việt Nam được đánh dấu bằng marker riêng trên Biển Đông, không dùng vòng tròn phủ vùng để bản đồ gọn và rõ hơn.",
                link: "#dongSonMap",
                island: true
            }
        ];

        const museumPlaces = [
            {
                id: "museum-lich-su-quoc-gia",
                name: "Bảo tàng Lịch sử Quốc gia",
                province: "Hà Nội",
                coords: [21.0243, 105.8597],
                icon: "🏛",
                type: "Bảo tàng Đông Sơn",
                displayTime: "Không gian trưng bày, nghiên cứu văn hóa Đông Sơn",
                region: "Bảo tàng",
                image: "../images/ngocLu.gif",
                detail: "Đây là nơi quan trọng nhất để nghiên cứu văn hóa Đông Sơn tại Việt Nam. Bảo tàng lưu giữ và trưng bày Trống đồng Ngọc Lũ, Trống đồng Hoàng Hạ, cùng nhiều hiện vật Đông Sơn khác như thạp Đào Thịnh, mộ thuyền Việt Khê và các sưu tập khảo cổ tiêu biểu.",
                link: "./trienlam.html",
                museum: true,
                color: "#a36a2a"
            },
            {
                id: "museum-thanh-hoa",
                name: "Bảo tàng tỉnh Thanh Hóa",
                province: "Thanh Hóa",
                coords: [19.8065, 105.7769],
                icon: "🏛",
                type: "Bảo tàng Đông Sơn",
                displayTime: "Không gian nguồn gốc văn hóa Đông Sơn",
                region: "Bảo tàng",
                image: "../images/dongsonz1.jpg",
                detail: "Thanh Hóa là cái nôi của văn hóa Đông Sơn nên bảo tàng tỉnh lưu giữ nhiều trống đồng Đông Sơn, vũ khí đồng, công cụ sản xuất và hiện vật khai quật từ làng Đông Sơn. Đây là điểm phù hợp để giới thiệu nguồn gốc của nền văn hóa Đông Sơn.",
                link: "./trienlam.html",
                museum: true,
                color: "#a36a2a"
            },
            {
                id: "museum-hung-vuong",
                name: "Bảo tàng Hùng Vương",
                province: "Phú Thọ",
                coords: [21.3224, 105.4018],
                icon: "🏛",
                type: "Bảo tàng lịch sử - văn hóa",
                displayTime: "Không gian thời đại Hùng Vương và Đông Sơn",
                region: "Bảo tàng",
                image: "../images/chim-lac-pattern.png",
                detail: "Bảo tàng Hùng Vương trưng bày trống đồng, hiện vật thời đại Hùng Vương và hiện vật thuộc văn hóa Đông Sơn vùng trung du Bắc Bộ. Điểm này phù hợp để liên hệ văn hóa Đông Sơn với thời đại các Vua Hùng.",
                link: "./trienlam.html",
                museum: true,
                color: "#a36a2a"
            },
            {
                id: "museum-binh-duong",
                name: "Bảo tàng Tổng hợp Bình Dương",
                province: "Bình Dương",
                coords: [10.9804, 106.6519],
                icon: "🏛",
                type: "Bảo tàng địa phương",
                displayTime: "Không gian hiện vật Đông Sơn ở Nam Bộ",
                region: "Bảo tàng",
                image: "../images/TrongDong.png",
                detail: "Bảo tàng Tổng hợp Bình Dương gắn với Trống đồng Phú Chánh và các hiện vật Đông Sơn phát hiện ở Nam Bộ. Đây là minh chứng rõ cho sự lan tỏa của văn hóa Đông Sơn xuống miền Nam.",
                link: "./trienlam.html",
                museum: true,
                color: "#a36a2a"
            },
            {
                id: "museum-da-nang",
                name: "Bảo tàng Đà Nẵng",
                province: "Đà Nẵng",
                coords: [16.0678, 108.2208],
                icon: "🏛",
                type: "Bảo tàng khảo cổ - lịch sử",
                displayTime: "Không gian tiền sử, sơ sử miền Trung",
                region: "Bảo tàng",
                image: "../images/TrongDongbg.png",
                detail: "Bảo tàng Đà Nẵng có khu trưng bày khảo cổ học với nhiều hiện vật tiền sử và sơ sử, trong đó có hiện vật liên quan đến văn hóa Đông Sơn và các nền văn hóa cùng thời ở miền Trung.",
                link: "./trienlam.html",
                museum: true,
                color: "#a36a2a"
            },
            {
                id: "museum-dan-toc-hoc",
                name: "Bảo tàng Dân tộc học Việt Nam",
                province: "Hà Nội",
                coords: [21.0403, 105.7984],
                icon: "🏛",
                type: "Bảo tàng văn hóa dân tộc",
                displayTime: "Tòa Trống Đồng",
                region: "Bảo tàng",
                image: "../images/TrongDongHV.jpg",
                detail: "Tòa nhà chính của Bảo tàng Dân tộc học Việt Nam được thiết kế theo hình tượng trống đồng Đông Sơn, gọi là Tòa Trống Đồng. Nơi đây chủ yếu giới thiệu văn hóa các dân tộc Việt Nam hơn là bộ sưu tập trống đồng chuyên sâu.",
                link: "./trienlam.html",
                museum: true,
                color: "#a36a2a"
            },
            {
                id: "museum-co-loa",
                name: "Bảo tàng Trưng bày Cổ vật Thành Cổ Loa",
                province: "Đông Anh, Hà Nội",
                coords: [21.1178, 105.8738],
                icon: "🏛",
                type: "Bảo tàng di tích",
                displayTime: "Không gian khảo cổ Âu Lạc - Đông Sơn",
                region: "Bảo tàng",
                image: "../images/coloa.png",
                detail: "Bảo tàng nằm trong khu di tích Cổ Loa, trưng bày hiện vật khảo cổ thời Âu Lạc và các tư liệu liên quan đến trống đồng Cổ Loa, văn hóa Đông Sơn tại khu vực Đông Anh, Hà Nội.",
                link: "./trienlam.html",
                museum: true,
                color: "#a36a2a"
            }
        ];

        places = [...drumPlaces, ...museumPlaces, ...islandPlaces];

        const markers = {};

        const map = L.map("dongSonMap", {
            zoomControl: false,
            scrollWheelZoom: true
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);

        const vietnamBounds = L.latLngBounds([6.0, 102.0], [23.8, 117.5]);
        map.fitBounds(vietnamBounds, { padding: [24, 24] });

        window.addEventListener("load", () => {
            setTimeout(() => {
                map.invalidateSize();
                map.fitBounds(vietnamBounds, { padding: [24, 24] });
            }, 120);
        });

        function createIcon(place) {
            const className = place.island
                ? "island-marker"
                : place.museum
                    ? "museum-marker"
                    : `regional-marker ${regionClasses[place.region] || ""}`;

            return L.divIcon({
                html: `<span aria-hidden="true">${place.icon}</span>`,
                className,
                iconSize: place.island ? [46, 46] : place.museum ? [44, 44] : [42, 42],
                iconAnchor: place.island ? [23, 23] : place.museum ? [22, 22] : [21, 21],
                popupAnchor: [0, -22]
            });
        }

        function getPlaceTitle(place) {
            return place.name;
        }

        function getPlaceAddress(place) {
            if (place.island) {
                return "Biển Đông";
            }

            return place.province;
        }

        function showPlaceDetail(place) {
            const panel = document.getElementById("mapDetailPanel");
            const content = document.getElementById("mapDetailContent");
            const title = getPlaceTitle(place);
            const period = place.island
                ? "Không gian biển đảo Việt Nam"
                : place.museum
                    ? place.displayTime
                    : `Năm phát hiện: ${place.discovered}`;
            const region = place.island ? "Biển đảo Việt Nam" : place.region;

            content.innerHTML = `
                <img class="detail-hero-img" src="${place.image}" alt="${title}">
                <div class="detail-body">
                    <h2 class="detail-title">${title}</h2>
                    <p class="detail-province">${place.province}</p>

                    <ul class="detail-facts">
                        <li><span aria-hidden="true">🏺</span><span>${place.type}</span></li>
                        <li><span aria-hidden="true">📅</span><span>${period}</span></li>
                        <li><span aria-hidden="true">📍</span><span>${getPlaceAddress(place)}</span></li>
                        <li><span aria-hidden="true">🗺</span><span>Khu vực: ${region}</span></li>
                    </ul>

                    <div class="detail-divider"></div>

                    <section class="detail-section">
                        <h3>Giới thiệu</h3>
                        <p>${place.detail}</p>
                    </section>
                </div>
            `;

            panel.classList.add("active");
        }

        places.forEach((place) => {
            const marker = L.marker(place.coords, {
                icon: createIcon(place),
                title: place.name,
                zIndexOffset: place.id === "noi-phat-hien-dong-son" ? 1000 : 0
            }).addTo(map);

            marker.on("click", () => {
                showPlaceDetail(place);
                map.setView(place.coords, place.island ? 6 : 10, { animate: true });
            });
            markers[place.id] = marker;
        });

        document.getElementById("mapDetailClose").addEventListener("click", () => {
            document.getElementById("mapDetailPanel").classList.remove("active");
        });

        document.getElementById("mapOverviewBtn").addEventListener("click", () => {
            const stage = document.querySelector(".map-stage");
            const button = document.getElementById("mapOverviewBtn");
            const isFullscreen = stage.classList.toggle("fullscreen-map");

            document.body.style.overflow = isFullscreen ? "hidden" : "";
            button.textContent = isFullscreen ? "Thu gọn" : "Toàn cảnh";

            setTimeout(() => {
                map.invalidateSize();
                map.fitBounds(vietnamBounds, { padding: [24, 24] });
            }, 120);
        });

        function renderPlaceList() {
            const placeList = document.getElementById("placeList");
            placeList.innerHTML = places.map((place) => `
                <li>
                    <button class="place-button" type="button" data-place-id="${place.id}">
                        <span aria-hidden="true" style="${place.color ? `background:${place.color}; color:${place.region === "Nam Bộ" ? "#f7f0e3" : "#1e1915"};` : ""}">${place.icon}</span>
                        <span>
                            <strong>${place.name}</strong>
                            <small>${place.province}</small>
                        </span>
                    </button>
                </li>
            `).join("");

            placeList.querySelectorAll("[data-place-id]").forEach((button) => {
                button.addEventListener("click", () => {
                    const place = places.find((item) => item.id === button.dataset.placeId);
                    map.setView(place.coords, place.island ? 6 : 10, { animate: true });
                    showPlaceDetail(place);
                });
            });
        }

        renderPlaceList();
