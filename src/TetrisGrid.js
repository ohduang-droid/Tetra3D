import { Group, MeshStandardMaterial, Mesh, BoxGeometry, Color } from 'three';

export default class TetrisGrid {
  constructor(width = 10, height = 20, blockSize = 1) {
    this.width = width;
    this.height = height;
    this.blockSize = blockSize;
    this.offsetX = -width / 2 + 0.5;
    this.cells = Array.from({ length: height }, () => Array(width).fill(null));
    this.group = new Group();
    this.blockGeometry = new BoxGeometry(blockSize, blockSize, blockSize);
  }

  reset() {
    this.cells.flat().forEach((cell) => {
      if (cell?.mesh) {
        this.group.remove(cell.mesh);
      }
    });
    this.cells = Array.from({ length: this.height }, () => Array(this.width).fill(null));
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  hasCollision(positions) {
    return positions.some(({ x, y }) => {
      if (!this.inBounds(x, y)) return true;
      return this.cells[y][x] !== null;
    });
  }

  lockBlock(block) {
    const material = new MeshStandardMaterial({ color: block.material.color.clone(), roughness: 0.35, metalness: 0.05 });
    const meshes = block.getWorldCells().map(({ x, y, z }) => {
      const mesh = new Mesh(this.blockGeometry, material.clone());
      mesh.position.set(x + this.offsetX, y, z);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      this.group.add(mesh);
      return mesh;
    });

    block.getWorldCells().forEach(({ x, y }, idx) => {
      if (this.inBounds(x, y)) {
        this.cells[y][x] = { mesh: meshes[idx] };
      }
    });
  }

  clearFullLines() {
    const fullRows = [];
    for (let y = 0; y < this.height; y++) {
      const isFull = this.cells[y].every((cell) => cell !== null);
      if (isFull) fullRows.push(y);
    }

    const animations = [];
    fullRows.forEach((row) => {
      this.cells[row].forEach((cell) => {
        if (cell?.mesh) {
          animations.push({ mesh: cell.mesh, timer: 0.3 });
        }
      });
    });

    // Remove rows and drop others
    fullRows.reverse().forEach((row) => {
      for (let y = row; y < this.height - 1; y++) {
        this.cells[y] = this.cells[y + 1];
        this.cells[y].forEach((cell) => {
          if (cell?.mesh) cell.mesh.position.y = y;
        });
      }
      this.cells[this.height - 1] = Array(this.width).fill(null);
    });

    return animations;
  }
}
