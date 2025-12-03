export default class StateManager {
  constructor() {
    this.current = 'Start';
    this.listeners = [];
  }

  onChange(cb) {
    this.listeners.push(cb);
  }

  setState(state) {
    this.current = state;
    this.listeners.forEach((cb) => cb(state));
  }
}
