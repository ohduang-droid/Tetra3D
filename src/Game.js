import { Scene, AxesHelper, Vector3, Clock } from 'three';
import Block from './Block.js';
import TetrisGrid from './TetrisGrid.js';

const TYPES = ['I', 'O', 'T', 'S', 'Z', 'L', 'J'];

export default class Game {
  constructor(renderer, camera, stateManager, hooks = {}) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = renderer.scene;
    this.grid = new TetrisGrid();
    this.scene.add(this.grid.group);
    this.stateManager = stateManager;
    this.hooks = hooks;

    this.score = 0;
    this.lines = 0;
    this.dropInterval = 1;
    this.dropTimer = 0;
    this.falling = null;
    this.clearingAnimations = [];

    this.stateManager.onChange((state) => {
      this.hooks.onStateChange?.(state);
    });
  }

  reset() {
    this.score = 0;
    this.lines = 0;
    this.dropTimer = 0;
    this.clearingAnimations = [];
    this.grid.reset();
    this.scene.remove(this.falling?.group);
    this.spawnBlock();
    this.hooks.onScore?.(this.score, this.lines);
  }

  spawnBlock() {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const block = new Block(type, 1, this.grid.offsetX);
    const maxCellY = Math.max(...block.cells.map((c) => c.y));
    const spawnY = this.grid.height - 1 - maxCellY;
    block.setPosition(Math.floor(this.grid.width / 2), spawnY, 0);
    this.scene.add(block.group);
    this.falling = block;
    if (this.grid.hasCollision(block.getWorldCells())) {
      this.stateManager.setState('GameOver');
    }
  }

  tryMove(dx, dy) {
    if (!this.falling) return;
    const target = this.falling.clone();
    target.setPosition(this.falling.position.x + dx, this.falling.position.y + dy, 0);
    if (!this.grid.hasCollision(target.getWorldCells())) {
      this.falling.setPosition(target.position.x, target.position.y, target.position.z);
    } else if (dy === -1) {
      // landed
      this.lockBlock();
    }
  }

  tryRotate() {
    if (!this.falling) return;
    const target = this.falling.clone();
    target.rotate();
    target.setPosition(target.position.x, target.position.y, target.position.z);
    if (!this.grid.hasCollision(target.getWorldCells())) {
      this.falling.rotate();
    }
  }

  lockBlock() {
    this.grid.lockBlock(this.falling);
    this.scene.remove(this.falling.group);
    this.falling = null;
    const animations = this.grid.clearFullLines();
    if (animations.length) {
      const rows = new Set(animations.map((a) => a.mesh.position.y));
      this.lines += rows.size;
      this.score += rows.size * 100;
      this.clearingAnimations.push(...animations);
      this.hooks.onScore?.(this.score, this.lines);
    }
    this.spawnBlock();
  }

  updateClearingAnimations(delta) {
    this.clearingAnimations.forEach((a) => {
      a.timer -= delta;
      const t = Math.max(a.timer, 0) / 0.3;
      a.mesh.material.transparent = true;
      a.mesh.material.opacity = t;
      a.mesh.scale.setScalar(Math.max(0.1, t));
    });
    this.clearingAnimations = this.clearingAnimations.filter((a) => {
      if (a.timer <= 0) {
        this.grid.group.remove(a.mesh);
        return false;
      }
      return true;
    });
  }

  update(delta) {
    if (this.stateManager.current === 'Pause' || this.stateManager.current === 'Start' || this.stateManager.current === 'GameOver') {
      this.camera.update();
      return;
    }

    this.dropTimer += delta;
    if (this.dropTimer >= this.dropInterval) {
      this.tryMove(0, -1);
      this.dropTimer = 0;
    }

    this.handleInput();
    this.updateClearingAnimations(delta);
    this.camera.update();
  }

  handleInput() {
    const input = window.input;
    if (!input) return;
    if (input.consume('ArrowLeft')) this.tryMove(-1, 0);
    if (input.consume('ArrowRight')) this.tryMove(1, 0);
    if (input.consume('ArrowDown')) this.tryMove(0, -1);
    if (input.consume('ArrowUp')) this.tryRotate();
  }
}
