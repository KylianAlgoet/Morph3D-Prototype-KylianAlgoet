import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const generateBtn = document.getElementById("generateBtn");
const enhanceBtn = document.getElementById("enhanceBtn");
const promptInput = document.getElementById("promptInput");
const finalPrompt = document.getElementById("finalPrompt");
const viewer = document.getElementById("viewer");
const downloadBtn = document.getElementById("downloadBtn");
const styleSelect = document.getElementById("styleSelect");

let scene1, camera1, renderer1, controls1;

function initViewer(container) {
  container.innerHTML = "";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 3;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(2, 2, 2);
  scene.add(ambientLight, directionalLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
  return { scene, camera, renderer, controls };
}

function loadGLBModel(url, scene) {
  const loader = new GLTFLoader();
  loader.load(url, (gltf) => {
    scene.add(gltf.scene);
  });
}

function showProgressBar() {
  document.getElementById("progressBarWrapper").style.display = "block";
  const progressText = document.getElementById("progressText");
  const progressBar = document.getElementById("progressBar");
  progressText.innerText = "Bezig met genereren...";
  progressBar.value = 0;
}

function updateProgress(percent, status) {
  const progressText = document.getElementById("progressText");
  const progressBar = document.getElementById("progressBar");
  if (progressText && progressBar) {
    progressText.innerText = `${status} (${percent}%)`;
    progressBar.value = percent;
  }
}

function hideProgressBar() {
  document.getElementById("progressBarWrapper").style.display = "none";
}

async function enhancePrompt(prompt) {
  const response = await fetch("/api/openai/enhance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await response.json();
  return data.enhancedPrompt || prompt;
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

enhanceBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) return alert("⚠️ Vul eerst een prompt in om te verbeteren.");

  enhanceBtn.textContent = "Verbeteren...";
  enhanceBtn.disabled = true;

  try {
    const enhanced = await enhancePrompt(prompt);
    promptInput.value = enhanced;
    enhanceBtn.textContent = "✅ Verbeterd!";
  } catch (err) {
    console.error("❌ Prompt verbeteren mislukt:", err);
    alert("Er ging iets mis bij het verbeteren van de prompt.");
    enhanceBtn.textContent = "✨ Verbeter prompt";
  } finally {
    enhanceBtn.disabled = false;
  }
});

generateBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  const selectedStyle = styleSelect.value;

  if (!prompt) return alert("⚠️ Vul een prompt in.");

  finalPrompt.innerHTML = "";
  downloadBtn.style.display = "none";

  try {
    finalPrompt.innerHTML = "🕒 Model wordt gegenereerd...";

    const taskId = await requestTripoTask(prompt, selectedStyle);
    const modelUrl = await pollForModel(taskId);

    finalPrompt.innerHTML = "✅ Model klaar!";

    const viewer1 = initViewer(viewer);
    scene1 = viewer1.scene;
    loadGLBModel(modelUrl, scene1);

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
