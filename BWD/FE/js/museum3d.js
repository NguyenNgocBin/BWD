import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const models = {
    trongdong1: {
        title: "Trống đồng Đông Sơn",
        kicker: "Hiện vật 01",
        desc: "Phiên bản trống đồng có hoa văn rõ ở phần thân, thích hợp để quan sát các mảng trang trí quanh tang trống.",
        fileLabel: "GLB tối ưu · 1.38 MB",
        group: "Trống đồng",
        focus: "Hoa văn thân trống",
        insights: [
            "Tập trung vào các dải hoa văn chạy quanh thân và tang trống.",
            "Quan sát cách các mảng trang trí lặp lại để tạo nhịp thị giác.",
            "Phù hợp khi muốn đọc kỹ cấu trúc bề mặt của hiện vật."
        ],
        src: "../models/TrongDong1.glb",
        render: {
            exposure: 1.5,
            previewExposure: 20,
            lights: {
                ambient: 1,
                hemi: 1.8,
                key: 5.2,
                rim: 2.8,
                fill: 1.5
            }
        }
    },
    trongdong2: {
        title: "Trống đồng Đông Sơn ",
        kicker: "Hiện vật 02",
        desc: "Phiên bản thứ hai nhấn mạnh mặt trống và dáng khối, phù hợp để xem tổng thể tỷ lệ hiện vật.",
        fileLabel: "GLB tối ưu · 5.21 MB",
        group: "Trống đồng",
        focus: "Mặt trống và dáng khối",
        insights: [
            "Ưu tiên quan sát bố cục mặt trống và tương quan tỷ lệ tổng thể.",
            "Dễ nhận ra cách hiện vật mở rộng từ mặt trống xuống thân và chân.",
            "Phù hợp cho góc nhìn toàn cảnh trước khi đi sâu vào chi tiết."
        ],
        src: "../models/TrongDong2.glb",
        render: {
            exposure: 1.5,
            previewExposure: 5,
            lights: {
                ambient: 0.34,
                hemi: 1.8,
                key: 5.2,
                rim: 2.8,
                fill: 1.5
            }
        }
    },
    dongsonbronze: {
        title: "Trống đồng Đông Sơn 3",
        kicker: "Hiện vật 03",
        desc: "Phiên bản trống đồng thứ ba dùng model GLB nội bộ, phù hợp để xoay, zoom và quan sát tổng thể hiện vật.",
        fileLabel: "GLB tối ưu · 1.68 MB",
        group: "Trống đồng",
        focus: "Quan sát tổng thể hiện vật",
        insights: [
            "Quan sát dáng khối tổng thể và tỷ lệ của hiện vật.",
            "So sánh cách xử lý bề mặt giữa các phiên bản mô hình.",
            "Chú ý nhịp chuyển giữa mặt trống, thân trống và chân trống."
        ],
        src: "../models/trong_dong 4.glb",
        render: {
            exposure: 1.5,  // Độ phơi sáng tổng thể của cảnh (camera/render exposure)
            previewExposure: 3.5, // Độ sáng khi xem preview trước khi render thật
            lights: {  // Ánh sáng môi trường chung.
                ambient: 0.34,
                hemi: 1.8,
                key: 5.2,
                rim: 2.8,
                fill: 1.5
            }
        }
    },
};

const container = document.getElementById("canvas-container");
const overlay = document.getElementById("model-loading-overlay");
const pctEl = document.getElementById("model-load-pct");
const hintEl = document.getElementById("museum3d-hint");
const galleryView = document.getElementById("model-gallery-view");
const detailView = document.getElementById("model-detail-view");
const museumSection = document.getElementById("model3d-section");
const activeTitleEl = document.getElementById("model-active-title");
const activeKickerEl = document.getElementById("model-active-kicker");
const activeDescEl = document.getElementById("model-active-desc");
const activeFileEl = document.getElementById("model-active-file");
const activeGroupEl = document.getElementById("model-active-group");
const activeFocusEl = document.getElementById("model-active-focus");
const activeInsightsEl = document.getElementById("model-active-insights");
const backBtn = document.getElementById("btn-back-gallery");
const progressBarEl = document.getElementById("model-load-bar");
const fallbackEl = document.getElementById("model3d-fallback");

if (!container) {
    throw new Error("[museum3d] Missing #canvas-container");
}

function supportsWebGL() {
    try {
        const canvas = document.createElement("canvas");
        return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch (error) {
        return false;
    }
}

const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const isWeakDevice = Boolean(
    connection?.saveData
    || (navigator.deviceMemory && navigator.deviceMemory <= 2)
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
);
const canRender3D = supportsWebGL() && !isWeakDevice;

if (!canRender3D) {
    museumSection?.classList.add("is-fallback");
    fallbackEl?.removeAttribute("hidden");
    if (fallbackEl) {
        const reason = fallbackEl.querySelector("[data-fallback-reason]");
        if (reason) {
            reason.textContent = isWeakDevice
                ? "Thiết bị đang bật chế độ tiết kiệm dữ liệu hoặc có tài nguyên hạn chế."
                : "Trình duyệt hoặc thiết bị không hỗ trợ WebGL ổn định.";
        }
    }
} else {
applyViewerBackdrop(container);

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(0, 1.5, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
let renderingAvailable = true;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);
renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    renderingAvailable = false;
    museumSection?.classList.add("is-fallback");
    fallbackEl?.removeAttribute("hidden");
    const reason = fallbackEl?.querySelector("[data-fallback-reason]");
    if (reason) reason.textContent = "WebGL đã dừng hoạt động. Trang chuyển sang ảnh tĩnh để tiếp tục sử dụng.";
}, { once: true });

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const environmentMap = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.environment = environmentMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.2;
controls.zoomSpeed = 1.8;
controls.minDistance = 0.001;
controls.maxDistance = 500;
controls.maxPolarAngle = Math.PI * 0.92;

const ambientLight = new THREE.AmbientLight(0xffead2, 0.28);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xfff2d1, 0x1b2530, 1.4);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xfff1ce, 4.2);
keyLight.position.set(4, 7, 5);
keyLight.castShadow = true;
scene.add(keyLight);

const rimLight = new THREE.PointLight(0xd4a843, 2.5, 30);
rimLight.position.set(-4, 2.4, -4);
scene.add(rimLight);

const fillLight = new THREE.PointLight(0x79b9b0, 1.1, 24);
fillLight.position.set(3, -1, -5);
scene.add(fillLight);

const defaultRender = {
    exposure: renderer.toneMappingExposure,
    lights: {
        ambient: ambientLight.intensity,
        hemi: hemiLight.intensity,
        key: keyLight.intensity,
        rim: rimLight.intensity,
        fill: fillLight.intensity
    }
};

const loader = new GLTFLoader();
const previewModelCache = new Map();
const thumbnailViews = [];
let defaultCameraPosition = camera.position.clone();
let defaultTarget = controls.target.clone();
let loadedModel = null;
let activeModelId = null;
let loadVersion = 0;
let currentModelDim = null;

function setProgress(value) {
    const normalized = Math.max(0, Math.min(100, Math.round(value)));
    if (pctEl) pctEl.textContent = `${normalized}%`;
    if (progressBarEl) progressBarEl.style.width = `${normalized}%`;
}

function showOverlay() {
    if (!overlay) return;
    overlay.style.display = "flex";
    overlay.style.opacity = "1";
    setProgress(0);
}

function hideOverlay() {
    if (!overlay) return;
    overlay.style.opacity = "0";
    window.setTimeout(() => {
        overlay.style.display = "none";
    }, 400);
}

function showError(message) {
    if (overlay) overlay.style.display = "none";
    container.querySelector(".model-error")?.remove();

    const el = document.createElement("div");
    el.className = "model-error";
    el.innerHTML = `
        <strong>Không tải được mô hình 3D</strong>
        <span>${message}</span>
    `;
    container.appendChild(el);
}

function showThreeViewer() {
    container.classList.remove("is-hidden");
    hintEl?.classList.remove("is-hidden");
}

function applyViewerRenderSettings(modelConfig = {}) {
    const render = modelConfig.render || {};
    const lights = render.lights || {};

    renderer.toneMappingExposure = render.exposure ?? defaultRender.exposure;
    ambientLight.intensity = lights.ambient ?? defaultRender.lights.ambient;
    hemiLight.intensity = lights.hemi ?? defaultRender.lights.hemi;
    keyLight.intensity = lights.key ?? defaultRender.lights.key;
    rimLight.intensity = lights.rim ?? defaultRender.lights.rim;
    fillLight.intensity = lights.fill ?? defaultRender.lights.fill;
}

function applyViewerBackdrop(target) {
    target.style.background = `
        radial-gradient(circle at 50% 46%, rgba(255, 255, 255, 0.62), rgba(172, 172, 172, 0.42) 34%, rgba(84, 84, 84, 0.46) 78%),
        repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, rgba(0,0,0,0.035) 1px 3px),
        linear-gradient(180deg, #8f8f8f 0%, #707070 52%, #5f5f5f 100%)
    `;
}

function resizeRenderer() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
}

function disposeObject(object) {
    object.traverse((child) => {
        if (!child.isMesh) return;
        child.geometry?.dispose();

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.filter(Boolean).forEach((material) => {
            Object.keys(material).forEach((key) => {
                const value = material[key];
                if (value && typeof value.dispose === "function") value.dispose();
            });
            material.dispose();
        });
    });
}

function clearModel() {
    if (!loadedModel) return;
    scene.remove(loadedModel);
    disposeObject(loadedModel);
    loadedModel = null;
}

function fitModelToView(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    if (!Number.isFinite(size.length()) || size.length() === 0) {
        throw new Error("Invalid model bounds");
    }

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.4 / maxDim;
    model.scale.setScalar(scale);
    model.position.copy(center).multiplyScalar(-scale);

    const fittedHeight = size.y * scale;
    const fittedDepth = size.z * scale;
    const fittedRadius = (Math.max(size.x, size.z) * scale) / 2;
    const distance = Math.max(4.2, fittedDepth * 2.7, fittedHeight * 1.9);

    controls.target.set(0, fittedHeight * 0.12, 0);
    controls.minDistance = 0.001;
    controls.maxDistance = 500;
    camera.position.set(0, fittedHeight * 0.35, distance);
    camera.near = 0.001;
    camera.far = 2000;
    camera.updateProjectionMatrix();
    controls.update();

    defaultCameraPosition = camera.position.clone();
    defaultTarget = controls.target.clone();
    currentModelDim = { height: fittedHeight, depth: fittedDepth, radius: fittedRadius, distance };
}

function prepareModel(model, modelConfig = {}) {
    model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.filter(Boolean).forEach((material) => {
                material.side = THREE.DoubleSide;
                material.needsUpdate = true;
            });
        }
    });
}

function getPreviewModel(modelId) {
    if (previewModelCache.has(modelId)) return previewModelCache.get(modelId);

    const model = models[modelId];
    const promise = new Promise((resolve, reject) => {
        loader.load(
            model.src,
            (gltf) => {
                prepareModel(gltf.scene, model);
                resolve(gltf.scene);
            },
            undefined,
            reject
        );
    });

    previewModelCache.set(modelId, promise);
    return promise;
}

function fitPreviewModel(model, previewCamera) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.35 / maxDim;

    model.scale.setScalar(scale);
    model.position.copy(center).multiplyScalar(-scale);

    const fittedHeight = size.y * scale;
    const fittedDepth = size.z * scale;
    const distance = Math.max(4.1, fittedDepth * 2.45, fittedHeight * 1.85);

    previewCamera.position.set(0, fittedHeight * 0.28, distance);
    previewCamera.near = Math.max(0.01, distance / 100);
    previewCamera.far = distance * 100;
    previewCamera.updateProjectionMatrix();
}

function resizePreview(view) {
    const width = Math.max(1, view.el.clientWidth);
    const height = Math.max(1, view.el.clientHeight);
    if (view.width === width && view.height === height) return false;

    view.width = width;
    view.height = height;
    view.camera.aspect = width / height;
    view.camera.updateProjectionMatrix();
    if (view.renderer) view.renderer.setSize(width, height, false);
    return true;
}

function renderPreview(view) {
    if (!view.renderer) return;
    resizePreview(view);
    view.renderer.render(view.scene, view.camera);
}

function capturePreview(view) {
    if (view.captured || !view.model || !view.renderer) return;
    resizePreview(view);
    if (view.width < 8 || view.height < 8) return;

    view.renderer.render(view.scene, view.camera);

    try {
        const img = new Image();
        img.className = "model-preview-image";
        img.alt = "";
        img.src = view.renderer.domElement.toDataURL("image/png");
        view.el.appendChild(img);
        view.renderer.domElement.remove();
        view.renderer.dispose();
        view.renderer = null;
        view.captured = true;
    } catch (error) {
        console.warn("[museum3d] Cannot capture model preview, keeping canvas fallback", error);
    }

    view.el.classList.add("is-ready");
}

async function initModelPreviews() {
    const previewElements = Array.from(document.querySelectorAll("[data-preview-model]"));

    for (const el of previewElements) {
        const modelId = el.dataset.previewModel;
        if (!models[modelId]) continue;

        const previewScene = new THREE.Scene();
        previewScene.background = null;
        previewScene.environment = environmentMap;
        const previewCamera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000);
        const previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        previewRenderer.toneMappingExposure = models[modelId].render?.previewExposure ?? 1.2;
        el.appendChild(previewRenderer.domElement);

        previewScene.add(new THREE.AmbientLight(0xffead2, models[modelId].render?.lights?.ambient ?? 0.22));
        previewScene.add(new THREE.HemisphereLight(0xfff2d1, 0x1b2530, models[modelId].render?.lights?.hemi ?? 1.25));

        const previewKey = new THREE.DirectionalLight(0xffefca, models[modelId].render?.lights?.key ?? 3.6);
        previewKey.position.set(4, 6, 5);
        previewScene.add(previewKey);

        const previewRim = new THREE.PointLight(0xd4a843, models[modelId].render?.lights?.rim ?? 2.2, 20);
        previewRim.position.set(-3, 1.8, -4);
        previewScene.add(previewRim);

        const view = {
            el,
            renderer: previewRenderer,
            scene: previewScene,
            camera: previewCamera,
            model: null,
            captured: false,
            width: 0,
            height: 0
        };
        thumbnailViews.push(view);
        resizePreview(view);
        applyViewerBackdrop(el);

        try {
            const sourceModel = await getPreviewModel(modelId);
            const previewModel = sourceModel.clone(true);
            previewModel.rotation.y = modelId === "trongdong2" ? -0.45 : modelId === "dongsonbronze" ? 0.35 : -0.25;
            fitPreviewModel(previewModel, previewCamera);
            previewScene.add(previewModel);
            view.model = previewModel;
            capturePreview(view);
        } catch (error) {
            previewRenderer.dispose();
            previewRenderer.domElement.remove();
            console.error(`[museum3d] Failed to render preview ${modelId}`, error);
            el.classList.add("is-error");
        }

        // Nhường một frame giữa các preview để giao diện không bị khựng.
        await new Promise((resolve) => window.requestAnimationFrame(resolve));
    }
}

function setActiveUi(modelId) {
    const model = models[modelId];
    if (!model) return;

    if (activeTitleEl) activeTitleEl.textContent = model.title;
    if (activeKickerEl) activeKickerEl.textContent = model.kicker;
    if (activeDescEl) activeDescEl.textContent = model.desc;
    if (activeFileEl) activeFileEl.textContent = model.fileLabel || "GLB";
    if (activeGroupEl) activeGroupEl.textContent = model.group || "Trống đồng";
    if (activeFocusEl) activeFocusEl.textContent = model.focus || "";
    if (activeInsightsEl) {
        activeInsightsEl.innerHTML = "";
        (model.insights || []).forEach((item) => {
            const li = document.createElement("li");
            li.textContent = item;
            activeInsightsEl.appendChild(li);
        });
    }

    document.querySelectorAll("[data-model-id]").forEach((button) => {
        button.classList.toggle("active", button.dataset.modelId === modelId);
    });
}

function openDetail() {
    museumSection?.classList.add("detail-open");
    galleryView.classList.add("is-hidden");
    detailView.classList.add("is-open");
    window.requestAnimationFrame(() => {
        resizeRenderer();
        thumbnailViews.forEach(capturePreview);
        detailView.scrollIntoView({ behavior: "smooth", block: "start" });
    });
}

function loadModel(modelId) {
    const model = models[modelId];
    if (!model) return;

    activeModelId = modelId;
    loadVersion += 1;
    const currentLoad = loadVersion;

    openDetail();
    setActiveUi(modelId);

    showThreeViewer();
    applyViewerRenderSettings(model);
    showOverlay();
    container.querySelector(".model-error")?.remove();

    loader.load(
        model.src,
        (gltf) => {
            if (currentLoad !== loadVersion) return;

            clearModel();
            loadedModel = gltf.scene;
            prepareModel(loadedModel, model);
            scene.add(loadedModel);
            fitModelToView(loadedModel);
            resizeRenderer();
            setProgress(100);
            hideOverlay();

            document.querySelectorAll(".detail-chip").forEach((c) => c.classList.remove("active"));
            const card = document.getElementById("drum-detail-card");
            if (card) card.setAttribute("hidden", "");

            if (typeof window.__museum3dReady === "function") {
                window.__museum3dReady(controls, camera, defaultCameraPosition.clone());
            }
        },
        (event) => {
            if (currentLoad !== loadVersion) return;
            if (event.lengthComputable && event.total > 0) {
                setProgress((event.loaded / event.total) * 100);
            } else if (event.loaded > 0) {
                setProgress(65);
            }
        },
        (error) => {
            if (currentLoad !== loadVersion) return;
            console.error(`[museum3d] Failed to load ${model.src}`, error);
            showError(`Kiểm tra lại file ${model.src.replace("../", "")} hoặc chạy trang qua local server.`);
        }
    );
}

function backToGallery() {
    museumSection?.classList.remove("detail-open");
    detailView.classList.remove("is-open");
    galleryView.classList.remove("is-hidden");
    document.getElementById("model3d-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll("[data-model-id]").forEach((button) => {
    button.addEventListener("click", () => loadModel(button.dataset.modelId));
});

backBtn?.addEventListener("click", backToGallery);
resizeRenderer();
initModelPreviews();
window.addEventListener("resize", () => {
    resizeRenderer();
    thumbnailViews.forEach((view) => {
        if (!view.model || view.captured) return;
        if (resizePreview(view)) capturePreview(view);
    });
});

/* ── CHI TIẾT HOA VĂN ĐƯỢC ĐÁNH SỐ & SMOOTH CAMERA ANIMATION ─────── */
const drumDetailsData = [
    {
        num: 1,
        name: "Mặt trời trung tâm",
        title: "Ngôi sao mặt trời 14 tia (Tâm mặt trống)",
        location: "Chính giữa mặt trống",
        significance: "Nguồn cội của ánh sáng, sự sống và chu kỳ thời gian",
        desc: "Trung tâm mặt trống đúc nổi hình tượng ngôi sao nhiều cánh (12 hoặc 14 tia) tượng trưng cho thần Mặt Trời. Trong nền văn minh lúa nước sông Hồng, đây là biểu tượng tối thượng ban phát sự sống, mùa màng tươi tốt và thể hiện tri thức thiên văn sớm của người Việt cổ.",
        getCoords: (h, r) => ({
            target: new THREE.Vector3(0, h * 0.46, 0),
            cam: new THREE.Vector3(0, h * 0.46 + 1.25, 0.4)
        })
    },
    {
        num: 2,
        name: "Vành chim Lạc bay",
        title: "Đoàn chim Lạc sải cánh (Mặt trống)",
        location: "Vành hoa văn chủ đạo trên mặt trống",
        significance: "Tín ngưỡng vật tổ, khát vọng tự do và dòng chảy thời gian",
        desc: "Bao quanh ngôi sao là dải chim Lạc sải cánh rộng bay ngược chiều kim đồng hồ. Chim Lạc là biểu tượng linh vật thiêng liêng gắn bó với cư dân vùng châu thổ sông Hồng, gợi nhắc sự hòa hợp giữa con người và bầu trời cao rộng.",
        getCoords: (h, r) => ({
            target: new THREE.Vector3(0, h * 0.46, r * 0.46),
            cam: new THREE.Vector3(0, h * 0.46 + 0.85, r * 0.46 + 0.85)
        })
    },
    {
        num: 3,
        name: "Cảnh sinh hoạt & giã gạo",
        title: "Lễ hội mùa, giã gạo và nhà sàn (Mặt trống)",
        location: "Vành ngoài mặt trống",
        significance: "Bức tranh sinh hoạt đời thường và nghi lễ cộng đồng",
        desc: "Khắc họa hình ảnh các đôi nam nữ cầm chày giã gạo đôi, đoàn người hóa trang đội mũ cắm lông chim múa nhạc khí, cùng những ngôi nhà sàn mái cong hình thuyền. Chi tiết tái hiện không khí lễ hội tạ ơn thần linh và cầu mong ấm no sau mùa gặt hái.",
        customCoords: {
            target: [0.441, 1.415, -0.474],
            cam: [0.442, 2.317, -0.473]
        },
        getCoords: (h, r) => ({
            target: new THREE.Vector3(r * 0.48, h * 0.46, 0.08),
            cam: new THREE.Vector3(r * 0.48 + 0.78, h * 0.46 + 0.78, 0.45)
        })
    },
    {
        num: 4,
        name: "Thuyền chiến tang trống",
        title: "Đoàn thuyền chiến trên tang trống",
        location: "Tang trống (phần phình rộng phía trên thân)",
        significance: "Sức mạnh thủy binh và bản lĩnh làm chủ sông nước",
        desc: "Tang trống phình rộng khắc họa những chiếc thuyền chiến mũi cong chở các chiến binh trang bị rìu đồng, cung tên, giáo mác, cùng người chỉ huy và người cầm lái. Bố cục phản ánh văn hóa gắn liền với sông nước và tinh thần bảo vệ cương thổ của người Việt thời Hùng Vương.",
        customCoords: {
            target: [-0.353, -0.49, 1.699],
            cam: [-0.595, -0.743, 2.885]
        },
        getCoords: (h, r) => ({
            target: new THREE.Vector3(0, h * 0.22, r * 0.86),
            cam: new THREE.Vector3(0, h * 0.22 + 0.12, r * 0.86 + 1.15)
        })
    },
    {
        num: 5,
        name: "Quai trống chữ U",
        title: "Quai đúc kép hoa văn bện thừng",
        location: "Nối liền tang trống và thân trống",
        significance: "Kỹ thuật đúc đồng tinh xảo và tính ứng dụng thực tế",
        desc: "Hệ thống quai kép hình chữ U có bề mặt đúc nổi hoa văn dây thừng xoắn chắc chắn. Quai vừa là kết cấu chịu lực để khiêng hoặc treo trống trong các nghi lễ lớn, vừa chứng minh trình độ luyện kim đúc đồng bậc thầy của các nghệ nhân Đông Sơn.",
        customCoords: {
            target: [1.573, 0.086, 0.292],
            cam: [1.947, 0.472, 1.334]
        },
        getCoords: (h, r) => ({
            target: new THREE.Vector3(r * 0.88, h * 0.2, 0),
            cam: new THREE.Vector3(r * 0.88 + 1.08, h * 0.2 + 0.1, 0.45)
        })
    },
    {
        num: 6,
        name: "Chân đế vững chãi",
        title: "Dáng chân đế choãi rộng",
        location: "Phần dưới cùng của trống",
        significance: "Thế đứng tôn nghiêm và các vành hoa văn hình học",
        desc: "Chân trống hình nón cụt choãi rộng tạo bệ đỡ uy nghiêm cho toàn bộ khối trống đồng. Bề mặt trang trí các dải hoa văn răng cưa, vòng tròn đồng tâm tiếp tuyến – chuẩn mực tạo hình kinh điển khẳng định sự cân đối hoàn mỹ của đồ đồng Đông Sơn.",
        getCoords: (h, r) => ({
            target: new THREE.Vector3(0, -h * 0.34, r * 0.78),
            cam: new THREE.Vector3(0, -h * 0.34 + 0.22, r * 0.78 + 1.25)
        })
    }
];

let cameraAnimationId = null;

function animateCameraTo(targetCamPos, targetLookAt, duration = 1300, onComplete = null) {
    if (cameraAnimationId) {
        cancelAnimationFrame(cameraAnimationId);
        cameraAnimationId = null;
    }

    controls.autoRotate = false;
    const autoBtn = document.getElementById("btn-autorotate");
    if (autoBtn) autoBtn.classList.remove("active");

    const startCamPos = camera.position.clone();
    const startLookAt = controls.target.clone();
    const startTime = performance.now();

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = easeInOutCubic(progress);

        camera.position.lerpVectors(startCamPos, targetCamPos, ease);
        controls.target.lerpVectors(startLookAt, targetLookAt, ease);
        controls.update();

        if (progress < 1) {
            cameraAnimationId = requestAnimationFrame(step);
        } else {
            cameraAnimationId = null;
            if (typeof onComplete === "function") onComplete();
        }
    }

    cameraAnimationId = requestAnimationFrame(step);
}

renderer.domElement.addEventListener("pointerdown", () => {
    if (cameraAnimationId) {
        cancelAnimationFrame(cameraAnimationId);
        cameraAnimationId = null;
    }
});

function zoomCamera(factor) {
    if (cameraAnimationId) {
        cancelAnimationFrame(cameraAnimationId);
        cameraAnimationId = null;
    }
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    const curDist = offset.length();
    const newDist = Math.max(controls.minDistance, Math.min(controls.maxDistance, curDist * factor));
    offset.setLength(newDist);
    const targetCam = new THREE.Vector3().addVectors(controls.target, offset);
    animateCameraTo(targetCam, controls.target, 220);
}

function focusDetail(num) {
    const detail = drumDetailsData.find((d) => d.num === num);
    if (!detail) return;

    let target, cam;
    if (detail.customCoords) {
        target = new THREE.Vector3(...detail.customCoords.target);
        cam = new THREE.Vector3(...detail.customCoords.cam);
    } else {
        const h = currentModelDim ? currentModelDim.height : 2.2;
        const r = currentModelDim ? currentModelDim.radius : 1.7;
        const coords = detail.getCoords(h, r);
        target = coords.target;
        cam = coords.cam;
    }

    document.querySelectorAll(".detail-chip").forEach((chip) => {
        const isSelected = Number(chip.dataset.detailNum) === num;
        chip.classList.toggle("active", isSelected);
        chip.setAttribute("aria-selected", isSelected ? "true" : "false");
    });
    document.querySelectorAll(".frame-detail-btn").forEach((btn) => {
        const isSelected = Number(btn.dataset.detailNum) === num;
        btn.classList.toggle("active", isSelected);
    });

    const card = document.getElementById("drum-detail-card");
    const badgeEl = document.getElementById("detail-card-badge");
    const titleEl = document.getElementById("detail-card-title");
    const descEl = document.getElementById("detail-card-desc");
    const locEl = document.getElementById("detail-card-loc");
    const signEl = document.getElementById("detail-card-sign");

    if (badgeEl) badgeEl.textContent = `Chi tiết 0${num}`;
    if (titleEl) titleEl.textContent = detail.title;
    if (descEl) descEl.textContent = detail.desc;
    if (locEl) locEl.textContent = `📍 Vị trí: ${detail.location}`;
    if (signEl) signEl.textContent = `✨ Ý nghĩa: ${detail.significance}`;

    if (card) {
        card.removeAttribute("hidden");
        card.classList.remove("is-closing");
    }

    animateCameraTo(cam, target, 1350);
}

function resetToOverview() {
    document.querySelectorAll(".detail-chip").forEach((chip) => {
        chip.classList.remove("active");
        chip.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".frame-detail-btn").forEach((btn) => {
        btn.classList.remove("active");
    });

    const card = document.getElementById("drum-detail-card");
    if (card) {
        card.classList.add("is-closing");
        setTimeout(() => {
            card.setAttribute("hidden", "");
            card.classList.remove("is-closing");
        }, 220);
    }

    animateCameraTo(defaultCameraPosition, defaultTarget, 1100);
}

/* ── CÔNG CỤ LẤY TỌA ĐỘ GÓC NHÌN DÀNH CHO NHÀ PHÁT TRIỂN / QUẢN TRỊ ── */
function getCurrentCoords() {
    const cam = camera.position;
    const tgt = controls.target;
    const round = (val) => Math.round(val * 1000) / 1000;

    const coordsObj = {
        target: [round(tgt.x), round(tgt.y), round(tgt.z)],
        cam: [round(cam.x), round(cam.y), round(cam.z)]
    };

    const snippet = `customCoords: {\n    target: [${coordsObj.target.join(", ")}],\n    cam: [${coordsObj.cam.join(", ")}]\n}`;

    console.log("%c📐 TỌA ĐỘ GÓC NHÌN HIỆN TẠI (Copy mã bên dưới):", "color: #ffd978; font-size: 14px; font-weight: bold;");
    console.log(snippet);
    console.log(`camera.position: x=${coordsObj.cam[0]}, y=${coordsObj.cam[1]}, z=${coordsObj.cam[2]}`);
    console.log(`controls.target:  x=${coordsObj.target[0]}, y=${coordsObj.target[1]}, z=${coordsObj.target[2]}`);

    const modal = document.getElementById("coords-modal");
    const output = document.getElementById("coords-output");
    if (output) output.textContent = snippet;
    if (modal) modal.removeAttribute("hidden");

    return coordsObj;
}

// Bind Zoom & Control Buttons
document.getElementById("btn-zoom-in")?.addEventListener("click", () => zoomCamera(0.6));
document.getElementById("btn-zoom-out")?.addEventListener("click", () => zoomCamera(1.65));
document.getElementById("float-zoom-in")?.addEventListener("click", () => zoomCamera(0.6));
document.getElementById("float-zoom-out")?.addEventListener("click", () => zoomCamera(1.65));
document.getElementById("float-reset")?.addEventListener("click", resetToOverview);
document.getElementById("btn-chip-reset")?.addEventListener("click", resetToOverview);
document.getElementById("btn-frame-reset")?.addEventListener("click", resetToOverview);
document.getElementById("btn-detail-back-overview")?.addEventListener("click", resetToOverview);
document.getElementById("btn-close-detail-card")?.addEventListener("click", () => {
    const card = document.getElementById("drum-detail-card");
    if (card) {
        card.classList.add("is-closing");
        setTimeout(() => {
            card.setAttribute("hidden", "");
            card.classList.remove("is-closing");
        }, 220);
    }
    document.querySelectorAll(".detail-chip").forEach((c) => c.classList.remove("active"));
    document.querySelectorAll(".frame-detail-btn").forEach((c) => c.classList.remove("active"));
});

// Bind Chips and Corner Frame Buttons
document.querySelectorAll(".detail-chip[data-detail-num]").forEach((chip) => {
    chip.addEventListener("click", () => {
        const num = Number(chip.dataset.detailNum);
        focusDetail(num);
    });
});
document.querySelectorAll(".frame-detail-btn[data-detail-num]").forEach((btn) => {
    btn.addEventListener("click", () => {
        const num = Number(btn.dataset.detailNum);
        focusDetail(num);
    });
});

// Bind Get Coords Modal & Clipboard
document.getElementById("btn-get-coords")?.addEventListener("click", () => {
    getCurrentCoords();
});
document.getElementById("btn-close-coords-modal")?.addEventListener("click", () => {
    document.getElementById("coords-modal")?.setAttribute("hidden", "");
});
document.getElementById("btn-copy-coords")?.addEventListener("click", () => {
    const output = document.getElementById("coords-output")?.textContent || "";
    if (navigator.clipboard) {
        navigator.clipboard.writeText(output).then(() => {
            const toast = document.getElementById("coords-copy-toast");
            if (toast) {
                toast.classList.add("is-shown");
                setTimeout(() => toast.classList.remove("is-shown"), 2500);
            }
        });
    }
});

function animate() {
    if (!renderingAvailable) return;
    requestAnimationFrame(animate);
    if (loadedModel) controls.update();
    renderer.render(scene, camera);
}
animate();

window.getToaDo = getCurrentCoords;
window.getCamCoords = getCurrentCoords;
window._m3dGetCurrentCoords = getCurrentCoords;
window._m3dControls = controls;
window._m3dCamera = camera;
window._m3dLoadModel = loadModel;
window._m3dReset = resetToOverview;
window._m3dZoomIn = () => zoomCamera(0.6);
window._m3dZoomOut = () => zoomCamera(1.65);
window._m3dFocusDetail = focusDetail;
}
