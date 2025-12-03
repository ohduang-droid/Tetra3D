export default class Input {
  constructor() {
    this.keys = new Set();
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  consume(code) {
    const has = this.keys.has(code);
    if (has) this.keys.delete(code);
    return has;
  }
}
