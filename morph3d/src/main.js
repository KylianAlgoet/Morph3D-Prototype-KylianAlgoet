import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const button = document.getElementById("generateBtn");

button.addEventListener("click", () => {
  const prompt = document.getElementById("promptInput").value.trim();
  const style = document.getElementById("styleSelect").value;

  const modelPath = "damascus_sword.glb"; // het model moet in /public

  document.getElementById("finalPrompt").innerText = `${prompt}, stijl: ${style}`;
  loadGLBModel(modelPath);
});

function loadGLBModel(path) {
  // Reset viewer
  const viewer = document.getElementById("viewer");
  viewer.innerHTML = "";

  // Scene + camera
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0); // lichtgrijze achtergrond

  const camera = new THREE.PerspectiveCamera(
    75,
    viewer.clientWidth / viewer.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 2;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
  viewer.appendChild(renderer.domElement);

  // Verlichting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // heldere basislicht
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(2, 2, 2);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 0.8);
  pointLight.position.set(0, 2, 2);
  scene.add(pointLight);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.enableZoom = true;
  controls.autoRotate = false;

  // Model laden
  const loader = new GLTFLoader();
  loader.load(path, (gltf) => {
    scene.add(gltf.scene);
    gltf.scene.rotation.y = Math.PI;
    animate();
  });

  // Animate loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
}
