import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const generateBtn = document.getElementById("generateBtn");
const promptInput = document.getElementById("promptInput");
const finalPrompt = document.getElementById("finalPrompt");
const viewer = document.getElementById("viewer");
const downloadBtn = document.getElementById("downloadBtn");
const styleSelect = document.getElementById("styleSelect");

let scene, camera, renderer, controls;
let progressWrapper, progressBar, progressText;

function initViewer() {
  viewer.innerHTML = "";
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  camera = new THREE.PerspectiveCamera(75, viewer.clientWidth / viewer.clientHeight, 0.1, 1000);
  camera.position.z = 3;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
  viewer.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(2, 2, 2);
  scene.add(ambientLight, directionalLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function loadGLBModel(url) {
  const loader = new GLTFLoader();
  loader.load(url, (gltf) => {
    scene.add(gltf.scene);
    animate();
  });
}

function showProgressBar() {
  hideProgressBar();
  progressWrapper = document.createElement("div");
  progressWrapper.id = "progressBarWrapper";

  progressBar = document.createElement("progress");
  progressBar.id = "progressBar";
  progressBar.max = 100;
  progressBar.value = 0;

  progressText = document.createElement("div");
  progressText.id = "progressText";
  progressText.innerText = "Bezig met genereren...";

  progressWrapper.append(progressText, progressBar);
  finalPrompt.appendChild(progressWrapper);
}

function updateProgress(percent, status) {
  if (progressBar && progressText) {
    progressBar.value = percent;
    progressText.innerText = `${status} (${percent}%)`;
  }
}

function hideProgressBar() {
  if (progressWrapper) {
    progressWrapper.remove();
    progressWrapper = null;
    progressBar = null;
    progressText = null;
  }
}

async function requestTripoTask(prompt, modelType) {
  const res = await fetch("/api/tripo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model_type: modelType })
  });

  const data = await res.json();
  if (!data.taskId) throw new Error("Geen taskId ontvangen van Tripo API");
  return data.taskId;
}

async function pollForModel(taskId) {
  showProgressBar();

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tripo/status/${taskId}`);
        const data = await res.json();

        const percent = Math.min(Math.max(data.progress ?? 0, 0), 100);
        updateProgress(percent, "Bezig met genereren...");

        if (data.status === "success" && data.modelUrl) {
          updateProgress(100, "Klaar!");
          clearInterval(interval);
          setTimeout(hideProgressBar, 1000);
          resolve(data.modelUrl);
        } else if (data.status === "failed") {
          clearInterval(interval);
          reject("❌ Model generatie mislukt.");
        }
      } catch (err) {
        clearInterval(interval);
        reject("❌ Fout bij polling: " + err.message);
      }
    }, 3000);
  });
}

generateBtn.addEventListener("click", async () => {
  const rawPrompt = promptInput.value.trim();
  const selectedStyle = styleSelect.value;

  if (!rawPrompt) return alert("⚠️ Vul een prompt in.");

  finalPrompt.innerHTML = `🧠 Tripo genereert 3D model voor: <strong>"${rawPrompt}"</strong>`;
  initViewer();

  try {
    const taskId = await requestTripoTask(rawPrompt, selectedStyle);
    finalPrompt.innerHTML += "<br>🕒 Wachten op modelgeneratie...";

    const modelUrl = await pollForModel(taskId);
    finalPrompt.innerHTML = `✅ Model gegenereerd!`;

    loadGLBModel(modelUrl);

    downloadBtn.style.display = "inline-block";
    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = modelUrl;
      a.download = "generated_model.glb";
      a.click();
    };
  } catch (err) {
    finalPrompt.innerHTML = `❌ Fout: ${err}`;
    console.error(err);
    hideProgressBar();
  }
});
