import { BoxGeometry, MeshStandardMaterial, Mesh, Group, Color, Vector3, MathUtils } from 'three';

const COLORS = [
  '#5ad1e8', '#ff9f68', '#ffd166', '#7ce7a1', '#9b8cfa', '#f67280', '#70d6ff'
];

const SHAPES = {
  I: [new Vector3(-2, 0, 0), new Vector3(-1, 0, 0), new Vector3(0, 0, 0), new Vector3(1, 0, 0)],
  O: [new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(1, 1, 0)],
  T: [new Vector3(-1, 0, 0), new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(0, 1, 0)],
  S: [new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(-1, 1, 0), new Vector3(0, 1, 0)],
  Z: [new Vector3(-1, 0, 0), new Vector3(0, 0, 0), new Vector3(0, 1, 0), new Vector3(1, 1, 0)],
  L: [new Vector3(-1, 0, 0), new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(1, 1, 0)],
  J: [new Vector3(-1, 0, 0), new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(-1, 1, 0)],
};

export default class Block {
  constructor(type, blockSize = 1, offsetX = -5) {
    this.type = type;
    this.group = new Group();
    this.blockSize = blockSize;
    this.offsetX = offsetX;
    this.cells = SHAPES[type].map((v) => v.clone());
    this.position = new Vector3(0, 0, 0);
    this.rotationY = 0;

    const geometry = new BoxGeometry(blockSize, blockSize, blockSize);
    const color = new Color(COLORS[Math.floor(Math.random() * COLORS.length)]);
    this.material = new MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1 });

    this.meshes = this.cells.map(() => new Mesh(geometry, this.material.clone()));
    this.meshes.forEach((mesh) => {
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      this.group.add(mesh);
    });

    this.updateMeshPositions();
  }

  clone() {
    const b = new Block(this.type, this.blockSize, this.offsetX);
    b.position.copy(this.position);
    b.rotationY = this.rotationY;
    b.cells = this.cells.map((v) => v.clone());
    return b;
  }

  rotate() {
    this.rotationY = (this.rotationY + Math.PI / 2) % (Math.PI * 2);
    const cos = Math.round(Math.cos(this.rotationY));
    const sin = Math.round(Math.sin(this.rotationY));
    this.cells = this.cells.map(({ x, y, z }) => new Vector3(
      x * cos - z * sin,
      y,
      x * sin + z * cos
    ));
    this.updateMeshPositions();
  }

  setPosition(x, y, z = 0) {
    this.position.set(x, y, z);
    this.updateMeshPositions();
  }

  getWorldCells() {
    return this.cells.map((c) => new Vector3(
      c.x + this.position.x,
      c.y + this.position.y,
      c.z + this.position.z
    ));
  }

  updateMeshPositions() {
    const worldCells = this.getWorldCells();
    worldCells.forEach((cell, i) => {
      this.meshes[i].position.set(cell.x + this.offsetX, cell.y, cell.z);
    });
    this.group.rotation.y = this.rotationY;
  }
}
