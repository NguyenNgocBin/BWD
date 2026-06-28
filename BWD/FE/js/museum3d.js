import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const models = {
    trongdong1: {
        title: "Trống đồng Đông Sơn",
        kicker: "Hiện vật 01",
        desc: "Phiên bản trống đồng có hoa văn rõ ở phần thân, thích hợp để quan sát các mảng trang trí quanh tang trống.",
        fileLabel: "GLB · 5.3 MB",
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
        fileLabel: "GLB · 8.2 MB",
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
        fileLabel: "GLB nội bộ · 4.2 MB",
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

if (!container) {
    throw new Error("[museum3d] Missing #canvas-container");
}
applyViewerBackdrop(container);

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(0, 1.5, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const environmentMap = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.environment = environmentMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.2;
controls.zoomSpeed = 0.32;
controls.minDistance = 2.4;
controls.maxDistance = 18;
controls.maxPolarAngle = Math.PI * 0.88;

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

function setProgress(value) {
    if (pctEl) pctEl.textContent = `${Math.max(0, Math.min(100, Math.round(value)))}%`;
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
    const distance = Math.max(4.2, fittedDepth * 2.7, fittedHeight * 1.9);

    controls.target.set(0, fittedHeight * 0.12, 0);
    controls.minDistance = Math.max(2.6, distance * 0.62);
    controls.maxDistance = Math.max(9, distance * 2.4);
    camera.position.set(0, fittedHeight * 0.35, distance);
    camera.near = Math.max(0.01, distance / 100);
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
    controls.update();

    defaultCameraPosition = camera.position.clone();
    defaultTarget = controls.target.clone();
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

function initModelPreviews() {
    document.querySelectorAll("[data-preview-model]").forEach((el) => {
        const modelId = el.dataset.previewModel;
        if (!models[modelId]) return;

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

        getPreviewModel(modelId)
            .then((sourceModel) => {
                const previewModel = sourceModel.clone(true);
                previewModel.rotation.y = modelId === "trongdong2" ? -0.45 : modelId === "dongsonbronze" ? 0.35 : -0.25;
                fitPreviewModel(previewModel, previewCamera);
                previewScene.add(previewModel);
                view.model = previewModel;
                capturePreview(view);
            })
            .catch((error) => {
                console.error(`[museum3d] Failed to render preview ${modelId}`, error);
                el.classList.add("is-error");
            });
    });
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

function animate() {
    requestAnimationFrame(animate);
    if (loadedModel) controls.update();
    renderer.render(scene, camera);
}
animate();

window._m3dControls = controls;
window._m3dCamera = camera;
window._m3dLoadModel = loadModel;
window._m3dReset = function resetMuseumCamera() {
    camera.position.copy(defaultCameraPosition);
    controls.target.copy(defaultTarget);
    controls.update();
};
