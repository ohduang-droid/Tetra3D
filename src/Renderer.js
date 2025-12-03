import { WebGLRenderer, Scene, Color, AmbientLight, DirectionalLight, GridHelper, Fog } from 'three';

export default class Renderer {
  constructor(container) {
    this.scene = new Scene();
    this.scene.background = new Color('#05080f');
    this.scene.fog = new Fog('#05080f', 10, 45);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    const ambient = new AmbientLight(0xffffff, 0.6);
    const dir = new DirectionalLight(0xffffff, 0.8);
    dir.position.set(6, 12, 8);
    this.scene.add(ambient);
    this.scene.add(dir);

    const gridHelper = new GridHelper(10, 10, '#1c2a44', '#1c2a44');
    gridHelper.position.y = -0.01;
    this.scene.add(gridHelper);

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render(camera, scene) {
    this.renderer.render(scene, camera);
  }
}
