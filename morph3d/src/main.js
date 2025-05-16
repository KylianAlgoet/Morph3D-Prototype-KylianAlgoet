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
const outputBox = document.getElementById("output");
const progressBarWrapper = document.getElementById("progressBarWrapper");


viewer.classList.add("hidden");
outputBox.classList.add("hidden");
downloadBtn.classList.add("hidden");
progressBarWrapper.classList.add("hidden");


promptInput.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

promptInput.style.height = (promptInput.scrollHeight) + 'px';

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
  progressBarWrapper.classList.remove("hidden");
  const progressText = document.getElementById("progressText");
  const progressBar = document.getElementById("progressBar");
  progressText.innerText = "Generating...";
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
  progressBarWrapper.classList.add("hidden");
}

enhanceBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) return alert("⚠️ Please enter a prompt to enhance.");

  enhanceBtn.textContent = "Enhancing...";
  enhanceBtn.disabled = true;

  try {
    const enhanced = await enhancePrompt(prompt);
    promptInput.value = enhanced;
   
    promptInput.style.height = 'auto';
    promptInput.style.height = (promptInput.scrollHeight) + 'px';
    enhanceBtn.textContent = "✅ Enhanced!";
  } catch (err) {
    console.error("❌ Prompt enhancement failed:", err);
    alert("Something went wrong while enhancing the prompt.");
    enhanceBtn.textContent = "✨ Enhance prompt";
  } finally {
    enhanceBtn.disabled = false;
  }
});

generateBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  let selectedStyle = styleSelect.value;
  if (!selectedStyle || selectedStyle === "") {
    selectedStyle = undefined; 
  }

  if (!prompt) return alert("⚠️ Please enter a prompt.");

 
  viewer.classList.add("hidden");
  downloadBtn.classList.add("hidden");
  outputBox.classList.remove("hidden");
  showProgressBar();

  try {
    finalPrompt.innerHTML = "🕒 Generating model...";

    const taskId = await requestTripoTask(prompt, selectedStyle);
    const modelUrl = await pollForModel(taskId);

    finalPrompt.innerHTML = "✅ Model ready!";

 
    viewer.classList.remove("hidden");
    const viewer1 = initViewer(viewer);
    scene1 = viewer1.scene;
    loadGLBModel(modelUrl, scene1);

    downloadBtn.classList.remove("hidden");
    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = modelUrl;
      a.download = "generated_model.glb";
      a.click();
    };
  } catch (err) {
    finalPrompt.innerHTML = `❌ Error: ${err}`;
    console.error(err);
  } finally {
    hideProgressBar();
  }
});

async function enhancePrompt(prompt) {
  const response = await fetch("/api/openai/enhance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await response.json();
  return data.enhancedPrompt || prompt;
}

async function requestTripoTask(prompt, model_type) {
  const res = await fetch("/api/tripo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      model_type: model_type !== "" ? model_type : undefined,
    }),
  });

  const data = await res.json();
  if (!data.taskId) throw new Error("No taskId received from Tripo API");
  return data.taskId;
}

async function pollForModel(taskId) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tripo/status/${taskId}`);
        const data = await res.json();

        const percent = Math.min(Math.max(data.progress ?? 0, 0), 100);
        updateProgress(percent, "Generating...");

        if (data.status === "success" && data.modelUrl) {
          updateProgress(100, "Done!");
          clearInterval(interval);
          setTimeout(() => hideProgressBar(), 1000);
          resolve(data.modelUrl);
        } else if (data.status === "failed") {
          clearInterval(interval);
          reject("❌ Model generation failed.");
        }
      } catch (err) {
        clearInterval(interval);
        reject("❌ Polling error: " + err.message);
      }
    }, 3000);
  });
  
}

const customSelect = document.getElementById("customStyleSelect");
const selected = customSelect.querySelector(".selected");
const options = customSelect.querySelector(".options");
const hiddenInput = document.getElementById("styleSelect");

selected.onclick = () => {
  customSelect.classList.toggle("open");
};
options.onclick = (e) => {
  if (e.target.tagName === "LI") {
    selected.textContent = e.target.textContent;
    hiddenInput.value = e.target.getAttribute("data-value");
    customSelect.classList.remove("open");
    for (let li of options.children) li.classList.remove("active");
    e.target.classList.add("active");
  }
};

document.addEventListener("click", (e) => {
  if (!customSelect.contains(e.target)) customSelect.classList.remove("open");
});
