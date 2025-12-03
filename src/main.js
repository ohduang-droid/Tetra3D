import Renderer from './Renderer.js';
import Camera from './Camera.js';
import Game from './Game.js';
import Controls from './Controls.js';
import Input from './Input.js';
import StateManager from './StateManager.js';

const app = document.getElementById('app');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const stateEl = document.getElementById('state');
const centerTip = document.getElementById('centerTip');

const renderer = new Renderer(app);
const camera = new Camera(renderer.renderer.domElement);
const stateManager = new StateManager();
const game = new Game(renderer, camera, stateManager, {
  onScore: (score, lines) => {
    scoreEl.textContent = score;
    linesEl.textContent = lines;
  },
  onStateChange: (state) => {
    stateEl.textContent = state;
    centerTip.style.display = state === 'Start' ? 'block' : 'none';
    centerTip.textContent = state === 'GameOver' ? '游戏结束，按 R 重来' : '按任意键开始';
  },
});

const input = new Input();
const controls = new Controls(input, game, stateManager);
window.input = input;
stateManager.setState('Start');

document.addEventListener('keydown', () => {
  if (stateManager.current === 'Start') {
    stateManager.setState('Running');
    game.reset();
  }
});

let last = performance.now();
function loop(now) {
  const delta = (now - last) / 1000;
  last = now;
  game.update(delta);
  renderer.render(camera.camera, game.scene);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
