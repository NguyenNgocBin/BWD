let places = [];

const DRUM_ICON_SRC = "../images/map-drum-icon.png";

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
        icon: "⛏️",
        type: "Trống đồng Đông Sơn",
        discovered: "1893",
        region: "Bắc Bộ",
        image: "../images/ngocLu.gif",
        detail: `Trống đồng Ngọc Lũ được phát hiện tình cờ năm 1893 tại Hà Nam trong lúc làm đê, không phải trong một cuộc khai quật khảo cổ có kế hoạch. Tư liệu về trống Ngọc Lũ ghi nhận nhóm người làm đê ở khu vực Ngọc Lũ/Như Trác, trong đó có Nguyễn Văn Y, Nguyễn Văn Túc và một số người khác, là những người phát hiện ra trống.
        <br><br>
        Câu chuyện thường được nhắc lại là khi đào đất, nhóm thợ thấy một vật đồng lớn nằm dưới lớp đất sâu. Trống sau đó được đưa về đình làng Ngọc Lũ, rồi được người Pháp biết đến và mua lại cho Trường Viễn Đông Bác Cổ trong thời kỳ đầu thế kỷ XX. Ngày nay trống được lưu giữ tại Bảo tàng Lịch sử Quốc gia.
        <br><br>
        Mặt trống Ngọc Lũ nổi tiếng vì còn khá nguyên vẹn và có nhiều vòng hoa văn: người đội mũ lông chim, cảnh đánh trống, nhạc cụ, nhà sàn, thuyền, chim, hươu và hoạt động nông nghiệp. Vì vậy Ngọc Lũ không chỉ là một chiếc trống đồng đẹp, mà còn là một bản ghi hình ảnh rất sinh động về đời sống Đông Sơn.
        `
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
        image: "../images/TrongDongHV.jpg",
        detail: `Trống đồng Sông Đà có xuất xứ từ vùng sông Đà, thuộc tỉnh Hòa Bình. Câu chuyện được ghi lại là Phó sứ Moulié tỉnh Hòa Bình đã lấy chiếc trống này từ nhà người vợ góa của một viên quan lang người Mường ở vùng sông Đà.
        <br><br>
        Năm 1889, trống được mang sang Pháp để trưng bày tại cuộc đấu xảo quốc tế ở Paris và sau đó không trở về Việt Nam. Hiện trống đồng Sông Đà được trưng bày tại Bảo tàng Guimet ở Paris, Pháp.
        <br><br>
        Trên mặt trống có các nhóm người đội mũ lông chim; dáng điệu thường được diễn giải như cảnh múa hơn là cảnh chiến trận. Trống cũng có các mô-típ quen thuộc của Đông Sơn như thuyền, chim và cảnh sinh hoạt.
        `
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
        image: "../images/hoangha.png",
        detail: `Trống đồng Hoàng Hạ được phát hiện năm 1937 tại làng Hoàng Hạ. Hiện vật này hiện được lưu giữ tại Bảo tàng Lịch sử Quốc gia và thuộc nhóm bảo vật quốc gia đầu tiên của Việt Nam.
        <br><br>
        Trên mặt trống có đoàn người đội mũ lông chim, nhạc công, nhà sàn, cảnh đánh trống và vòng chim nước. Trên thân trống có hình thuyền. Những chi tiết này khiến Hoàng Hạ thường được đặt cạnh Ngọc Lũ khi nghiên cứu đời sống lễ hội, âm nhạc, nông nghiệp và giao thông đường nước của cư dân Đông Sơn.
        `
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
        detail: `Trống đồng Cổ Loa được phát hiện tình cờ tại khu vực Cổ Loa, Đông Anh, Hà Nội. Tư liệu khảo cổ ghi nhận Nguyễn Giang Hải và Nguyễn Văn Hùng là những người phát hiện chiếc trống. Đây là một trường hợp đặc biệt vì trống không nằm một mình mà đi cùng cả một kho hiện vật đồng.
        <br><br>
        Bên trong và xung quanh trống có khoảng 200 hiện vật đồng, gồm lưỡi cày, rìu, giáo, dao găm và mũi tên. Riêng lưỡi cày chiếm số lượng rất lớn. Vì vậy câu chuyện của Cổ Loa không chỉ là một chiếc trống đồng, mà còn là câu chuyện về nông nghiệp, vũ khí, luyện kim và quyền lực ở trung tâm Cổ Loa thời cổ.
        <br><br>
        Trống cao khoảng 57 cm, đường kính mặt khoảng 73,6 cm, nặng khoảng 72 kg. Bộ trống đồng Cổ Loa và sưu tập lưỡi cày đồng đã được công nhận là bảo vật quốc gia, hiện thuộc Bảo tàng Hà Nội.
        `
    },
    {
        id: "trong-cam-giang",
        name: "Trống đồng Cẩm Giang",
        province: "Phú Lai, Cẩm Giang, Cẩm Thủy, Thanh Hóa",
        coords: [20.2073, 105.4754],
        icon: "🥁",
        type: "Trống đồng Đông Sơn",
        discovered: "Thế kỷ XX",
        region: "Bắc Trung Bộ",
        image: "../images/TD_Cam_Giang.jpg",
        detail: `
        Trống đồng Cẩm Giang được phát hiện ngày 30.9.1992 tại thôn Phú Lai, xã Cẩm Giang, huyện Cẩm Thủy, tỉnh Thanh Hóa. Người phát hiện là ông Bùi Đức Tậu trong một lần làm vườn.
        <br><br>
        Câu chuyện quanh chiếc trống khá đặc biệt: sau khi phát hiện, có người trả số tiền rất lớn để mua, nhưng ông Tậu không bán cho giới buôn đồ cổ. Khi cán bộ Bảo tàng Thanh Hóa lên vận động, ban đầu ông còn lưỡng lự vì khoản thưởng quá nhỏ so với giá trị chiếc trống. Sau đó ông vẫn giao nộp trống cho nhà nước vì hiểu đây là tài sản quốc gia.
        <br><br>
        Trống Cẩm Giang nổi bật vì trên mặt trống có 4 khối tượng vịt, trong khi nhiều trống đồng khác thường gắn tượng cóc. Trống có đường kính mặt khoảng 73 cm, cao 41,9 cm, nặng khoảng 60 kg, được công nhận là bảo vật quốc gia và hiện được bảo quản, trưng bày tại Bảo tàng tỉnh Thanh Hóa.
    `},
    {
        id: "trong-huu-chung",
        name: "Trống đồng Hữu Chung",
        province: "Xã Hữu Chung, Tứ Kỳ, Hải Dương",
        coords: [20.8137, 106.4123],
        icon: "🥁",
        type: "Trống đồng Đông Sơn",
        discovered: "",
        region: "Bắc Bộ",
        image: "../images/TD_Huu_Chung.png",
        detail: `Trống đồng Hữu Chung là hiện vật thuộc văn hóa Đông Sơn, được phát hiện tại xã Hữu Chung, huyện Tứ Kỳ, tỉnh Hải Dương. Trống đã được công nhận là bảo vật quốc gia.
        <br><br>
        Hiện vật hiện thuộc hệ thống lưu giữ của Bảo tàng tỉnh Hải Dương. Hữu Chung là một mẫu trống Đông Sơn quan trọng, bổ sung thêm bằng chứng về sự phong phú của hệ thống trống đồng ở đồng bằng Bắc Bộ.
        `
    },
    {
        id: "trong-sao-vang",
        name: "Trống đồng Sao Vàng",
        province: "Thọ Xuân, Thanh Hóa",
        coords: [19.9026, 105.4680],
        icon: "🥁",
        type: "Trống đồng Đông Sơn",
        discovered: "",
        region: "Bắc Trung Bộ",
        image: "../images/TD_SaoVang.jpg",
        detail: `Trống đồng Sao Vàng gắn với khu vực Thọ Xuân, Thanh Hóa, trong không gian lưu vực sông Mã - một vùng quan trọng của văn hóa Đông Sơn.
        <br><br>
        Thanh Hóa là vùng có mật độ hiện vật Đông Sơn lớn, gắn với nhiều trống đồng, công cụ sản xuất, vũ khí đồng và các di tích khảo cổ quanh hệ thống sông Mã - sông Chu. Vì vậy Sao Vàng được đặt trong mạch giới thiệu về vùng lõi Đông Sơn ở xứ Thanh.`
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
        name: "Trống đồng Quỳ Chử",
        province: "Thọ Diên, Thọ Xuân, Thanh Hóa",
        coords: [19.9315, 105.5201],
        icon: "🥁",
        type: "Trống đồng Đông Sơn",
        discovered: "1980",
        region: "Bắc Trung Bộ",
        image: "../images/TrongDongbg.png",
        detail: "Trống đồng Quỳ Chử được phát hiện năm 1980 tại Quỳ Chử, xã Thọ Diên, huyện Thọ Xuân, tỉnh Thanh Hóa. Địa điểm này thuộc không gian xứ Thanh, vùng lõi quan trọng của văn hóa Đông Sơn gắn với lưu vực sông Mã - sông Chu."
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
        detail: "Trống đồng Hòa Vang được ghi nhận tại Đà Nẵng. Hiện vật này gợi nhắc tuyến phân bố ở Trung Trung Bộ, nơi có sự giao lưu giữa nhiều lớp văn hóa cổ."
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
        detail: "Trống đồng An Khê được ghi nhận tại Gia Lai, thuộc Tây Nguyên. Sự hiện diện của trống ở khu vực này cho thấy trống đồng Đông Sơn không chỉ gắn với đồng bằng và ven biển mà còn được ghi nhận trong không gian cao nguyên."
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
        detail: "Trống đồng Kon Tum là một điểm Tây Nguyên tiêu biểu trong hệ thống trống đồng. Hiện vật này là bằng chứng về sự hiện diện của trống đồng trong không gian cao nguyên."
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
        detail: "Trống đồng Long Giao được ghi nhận tại Đồng Nai, thuộc Đông Nam Bộ. Hiện vật này bổ sung thêm dữ liệu về sự phân bố của trống đồng trong không gian Nam Bộ."
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
        detail: "Trống đồng Óc Eo được ghi nhận tại Kiên Giang, Tây Nam Bộ. Đây là một điểm phía Nam trong hệ thống phân bố, cho thấy mạng lưới trống đồng trải rộng hơn nhiều so với vùng lõi Đông Sơn ở phía Bắc."
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
    const isDrumPlace = !place.island && !place.museum;
    const className = place.island
        ? "island-marker"
        : place.museum
            ? "museum-marker"
            : `regional-marker drum-photo-marker ${regionClasses[place.region] || ""}`;
    const html = isDrumPlace
        ? `<img class="map-drum-icon" src="${DRUM_ICON_SRC}" alt="" aria-hidden="true">`
        : `<span aria-hidden="true">${place.icon}</span>`;

    return L.divIcon({
        html,
        className,
        iconSize: place.island ? [46, 46] : place.museum ? [44, 44] : [42, 42],
        iconAnchor: place.island ? [23, 23] : place.museum ? [22, 22] : [21, 21],
        popupAnchor: [0, -22]
    });
}

function getPlaceListIcon(place) {
    if (place.island || place.museum) {
        return `<span aria-hidden="true" style="${place.color ? `background:${place.color}; color:${place.region === "Nam Bộ" ? "#f7f0e3" : "#1e1915"};` : ""}">${place.icon}</span>`;
    }

    return `
        <span class="place-drum-frame" aria-hidden="true" style="--place-color:${place.color || "#d99b28"};">
            <img class="place-drum-icon" src="${DRUM_ICON_SRC}" alt="">
        </span>
    `;
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
            : place.discovered
                ? `Năm phát hiện: ${place.discovered}`
                : "";
    const region = place.island ? "Biển đảo Việt Nam" : place.region;
    const periodFact = period
        ? `<li><span aria-hidden="true">📅</span><span>${period}</span></li>`
        : "";

    content.innerHTML = `
                <img class="detail-hero-img" src="${place.image}" alt="${title}">
                <div class="detail-body">
                    <h2 class="detail-title">${title}</h2>
                    <p class="detail-province">${place.province}</p>

                    <ul class="detail-facts">
                        <li><span aria-hidden="true">🏺</span><span>${place.type}</span></li>
                        ${periodFact}
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
                        ${getPlaceListIcon(place)}
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
