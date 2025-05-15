// ✅ Morph3D - Volledig AI-gestuurde model loader met GPT interpretatie via proxy

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const generateBtn = document.getElementById("generateBtn");
const promptInput = document.getElementById("promptInput");
const styleSelect = document.getElementById("styleSelect");
const finalPrompt = document.getElementById("finalPrompt");
const viewer = document.getElementById("viewer");
const downloadBtn = document.getElementById("downloadBtn");

let currentBlobURL = null;

// Externe glb bestanden (open source of raw GitHub URLs)
const MODEL_URLS = {
  sword: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SimpleMesh/glTF-Binary/SimpleMesh.glb",
  robot: "https://models.babylonjs.com/robot.glb",
  tree: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb",
  gun: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb",
  car: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",
  default: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb"
};



async function getModelFromGPT(prompt) {
const res = await fetch("/api/chat", {
  
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

const data = await res.json();
console.log("📦 Server response:", data);
return data.model || "default";

}

generateBtn.addEventListener("click", async () => {
  const rawPrompt = promptInput.value.trim();
  const style = styleSelect.value;

  finalPrompt.innerHTML = `🧠 AI denkt na over je prompt...`;
  const mappedKey = await getModelFromGPT(rawPrompt);
  const modelURL = MODEL_URLS[mappedKey] || MODEL_URLS["default"];

  finalPrompt.innerHTML = `AI begrijpt je prompt als: <strong>${mappedKey}</strong><br>Model wordt geladen...`;
  loadGLBModel(modelURL);

  // Downloadknop instellen
  downloadBtn.style.display = "inline-block";
  downloadBtn.onclick = () => {
    const a = document.createElement("a");
    a.href = modelURL;
    a.download = `${mappedKey}.glb`;
    a.click();
  };
});

function loadGLBModel(url) {
  viewer.innerHTML = "";
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const camera = new THREE.PerspectiveCamera(75, viewer.clientWidth / viewer.clientHeight, 0.1, 1000);
  camera.position.z = 2;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
  viewer.appendChild(renderer.domElement);

  const light = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(light);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(2, 2, 2);
  scene.add(dirLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;

  const loader = new GLTFLoader();
  loader.load(url, (gltf) => {
    scene.add(gltf.scene);
    animate();
  });

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
}
