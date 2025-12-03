import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 1;
const DROP_INTERVAL = 1000;
const FAST_DROP_INTERVAL = 80;

const SHAPES = {
  I: { color: 0x38bdf8, blocks: [ [0, 0], [1, 0], [2, 0], [3, 0] ] },
  O: { color: 0xfacc15, blocks: [ [0, 0], [1, 0], [0, 1], [1, 1] ] },
  T: { color: 0xa855f7, blocks: [ [0, 0], [1, 0], [2, 0], [1, 1] ] },
  S: { color: 0x22d3ee, blocks: [ [1, 0], [2, 0], [0, 1], [1, 1] ] },
  Z: { color: 0xfb7185, blocks: [ [0, 0], [1, 0], [1, 1], [2, 1] ] },
  L: { color: 0xf97316, blocks: [ [0, 0], [0, 1], [1, 0], [2, 0] ] },
  J: { color: 0x60a5fa, blocks: [ [0, 0], [1, 0], [2, 0], [2, 1] ] }
};

const statusEl = document.getElementById("status");
const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const restartBtn = document.getElementById("restart");
const sceneContainer = document.getElementById("scene-container");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1221);

const camera = new THREE.PerspectiveCamera(60, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 200);
camera.position.set(8, 18, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
sceneContainer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, BOARD_HEIGHT * 0.35, 0);
controls.enablePan = true;
controls.enableZoom = true;
controls.maxPolarAngle = Math.PI * 0.95;
controls.screenSpacePanning = true;

const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
dirLight.position.set(4, 12, 8);
scene.add(dirLight);

const boardPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(BOARD_WIDTH * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE),
  new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
);
boardPlane.rotateX(-Math.PI / 2);
boardPlane.position.y = -0.51;
scene.add(boardPlane);

const gridHelper = new THREE.GridHelper(
  BOARD_WIDTH * BLOCK_SIZE,
  BOARD_WIDTH,
  new THREE.Color(0x172554),
  new THREE.Color(0x172554)
);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

let board = createEmptyBoard();
let boardMeshes = createEmptyBoard();
let clearingRows = [];
let dropTimer = 0;
let lastTime = 0;
let fastDrop = false;
let running = false;
let paused = false;
let score = 0;
let lines = 0;
let activePiece = null;

window.addEventListener("resize", () => {
  const { clientWidth, clientHeight } = sceneContainer;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
});

startBtn.addEventListener("click", () => {
  if (running) return;
  resetGame();
  running = true;
  paused = false;
  spawnPiece();
  setStatus("游戏中");
});

pauseBtn.addEventListener("click", () => {
  if (!running) return;
  paused = !paused;
  setStatus(paused ? "已暂停" : "游戏中");
});

restartBtn.addEventListener("click", () => {
  resetGame();
  running = true;
  paused = false;
  spawnPiece();
  setStatus("游戏中");
});

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowDown") fastDrop = false;
});

function setStatus(text) {
  statusEl.textContent = text;
}

function createEmptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

function randomShape() {
  const keys = Object.keys(SHAPES);
  const id = keys[Math.floor(Math.random() * keys.length)];
  const shape = SHAPES[id];
  return {
    id,
    color: shape.color,
    blocks: shape.blocks
  };
}

function rotateBlocks(blocks, rotation) {
  let rotated = blocks;
  for (let i = 0; i < rotation; i++) {
    rotated = rotated.map(([x, y]) => [y, -x]);
  }
  return rotated;
}

function spawnPiece() {
  const shape = randomShape();
  const rotation = 0;
  const position = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: BOARD_HEIGHT - 1 };
  const piece = { shape, rotation, position, meshes: [] };
  piece.meshes = shape.blocks.map(() => createBlockMesh(shape.color));
  activePiece = piece;
  updatePieceMeshes();
  scene.add(...piece.meshes);
  if (collides(piece.position, piece.rotation)) {
    setStatus("游戏结束");
    running = false;
  }
}

function createBlockMesh(color) {
  const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.15 });
  return new THREE.Mesh(geometry, material);
}

function updatePieceMeshes() {
  if (!activePiece) return;
  const rotated = rotateBlocks(activePiece.shape.blocks, activePiece.rotation);
  rotated.forEach(([bx, by], index) => {
    const worldPos = cellToWorld(activePiece.position.x + bx, activePiece.position.y + by);
    activePiece.meshes[index].position.copy(worldPos);
  });
}

function cellToWorld(x, y) {
  const worldX = (x - BOARD_WIDTH / 2 + 0.5) * BLOCK_SIZE;
  const worldY = (y + 0.5) * BLOCK_SIZE;
  return new THREE.Vector3(worldX, worldY, 0);
}

function handleKeyDown(event) {
  if (!running || paused) return;
  switch (event.key) {
    case "ArrowLeft":
      movePiece(-1, 0);
      break;
    case "ArrowRight":
      movePiece(1, 0);
      break;
    case "ArrowUp":
      rotatePiece();
      break;
    case "ArrowDown":
      fastDrop = true;
      break;
    default:
      break;
  }
}

function movePiece(dx, dy) {
  if (!activePiece) return;
  const newPos = { x: activePiece.position.x + dx, y: activePiece.position.y + dy };
  if (!collides(newPos, activePiece.rotation)) {
    activePiece.position = newPos;
    updatePieceMeshes();
  }
}

function rotatePiece() {
  const nextRotation = (activePiece.rotation + 1) % 4;
  if (!collides(activePiece.position, nextRotation)) {
    activePiece.rotation = nextRotation;
    updatePieceMeshes();
  }
}

function collides(position, rotation) {
  const rotated = rotateBlocks(activePiece.shape.blocks, rotation);
  return rotated.some(([bx, by]) => {
    const x = position.x + bx;
    const y = position.y + by;
    if (x < 0 || x >= BOARD_WIDTH || y < 0) return true;
    if (board[y][x]) return true;
    return false;
  });
}

function lockPiece() {
  const rotated = rotateBlocks(activePiece.shape.blocks, activePiece.rotation);
  rotated.forEach(([bx, by], index) => {
    const x = activePiece.position.x + bx;
    const y = activePiece.position.y + by;
    const mesh = activePiece.meshes[index];
    board[y][x] = { color: activePiece.shape.color };
    boardMeshes[y][x] = mesh;
  });
  activePiece = null;
  const rowsToClear = findFullRows();
  if (rowsToClear.length > 0) {
    startClearAnimation(rowsToClear);
  } else {
    spawnPiece();
  }
}

function findFullRows() {
  const rows = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    if (board[y].every((cell) => cell !== null)) rows.push(y);
  }
  return rows;
}

function startClearAnimation(rows) {
  rows.forEach((row) => {
    clearingRows.push({ row, progress: 0 });
  });
}

function applyClearAnimation(delta) {
  if (clearingRows.length === 0) return;
  const speed = 2.5;
  clearingRows.forEach((entry) => {
    entry.progress += delta * speed;
    const opacity = Math.max(0, 1 - entry.progress);
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const mesh = boardMeshes[entry.row][x];
      if (!mesh) continue;
      mesh.material.transparent = true;
      mesh.material.opacity = opacity;
      const scale = 1 - Math.min(entry.progress, 1) * 0.4;
      mesh.scale.set(scale, scale, scale);
    }
  });

  const finished = clearingRows.filter((entry) => entry.progress >= 1);
  if (finished.length) {
    const rows = finished.map((item) => item.row).sort((a, b) => a - b);
    rows.forEach((row) => removeRow(row));
    lines += rows.length;
    score += rows.length * 100;
    updateHud();
    clearingRows = clearingRows.filter((entry) => entry.progress < 1);
    spawnPiece();
  }
}

function removeRow(row) {
  for (let x = 0; x < BOARD_WIDTH; x++) {
    const mesh = boardMeshes[row][x];
    if (mesh) scene.remove(mesh);
  }
  for (let y = row; y < BOARD_HEIGHT - 1; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      board[y][x] = board[y + 1][x];
      boardMeshes[y][x] = boardMeshes[y + 1][x];
      const mesh = boardMeshes[y][x];
      if (mesh) {
        const worldPos = cellToWorld(x, y);
        mesh.position.copy(worldPos);
        mesh.material.opacity = 1;
        mesh.scale.set(1, 1, 1);
      }
    }
  }
  // clear top row
  board[BOARD_HEIGHT - 1] = Array(BOARD_WIDTH).fill(null);
  boardMeshes[BOARD_HEIGHT - 1] = Array(BOARD_WIDTH).fill(null);
}

function updateHud() {
  scoreEl.textContent = score;
  linesEl.textContent = lines;
}

function resetGame() {
  board.flat().forEach((cell, index) => {
    const x = index % BOARD_WIDTH;
    const y = Math.floor(index / BOARD_WIDTH);
    const mesh = boardMeshes[y][x];
    if (mesh) scene.remove(mesh);
  });
  board = createEmptyBoard();
  boardMeshes = createEmptyBoard();
  clearingRows = [];
  score = 0;
  lines = 0;
  updateHud();
  if (activePiece) {
    activePiece.meshes.forEach((mesh) => scene.remove(mesh));
  }
  activePiece = null;
  dropTimer = 0;
  lastTime = performance.now();
}

function tick(deltaMs) {
  if (!running || paused) return;
  dropTimer += deltaMs;
  const interval = fastDrop ? FAST_DROP_INTERVAL : DROP_INTERVAL;
  if (dropTimer > interval) {
    dropTimer = 0;
    stepDown();
  }
}

function stepDown() {
  if (!activePiece) return;
  const newPos = { x: activePiece.position.x, y: activePiece.position.y - 1 };
  if (!collides(newPos, activePiece.rotation)) {
    activePiece.position = newPos;
    updatePieceMeshes();
  } else {
    lockPiece();
  }
}

function animate(timestamp) {
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  controls.update();
  applyClearAnimation(delta);
  tick(delta * 1000);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

updateHud();
setStatus("等待开始");
requestAnimationFrame((time) => {
  lastTime = time;
  animate(time);
});
