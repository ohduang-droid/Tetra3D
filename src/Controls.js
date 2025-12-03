export default class Controls {
  constructor(input, game, stateManager) {
    this.input = input;
    this.game = game;
    this.stateManager = stateManager;

    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyP', 'KeyR'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'KeyP' && this.stateManager.current !== 'Start') {
        const next = this.stateManager.current === 'Pause' ? 'Running' : 'Pause';
        this.stateManager.setState(next);
      }
      if (e.code === 'KeyR') {
        this.game.reset();
        this.stateManager.setState('Running');
      }
    });
  }
}
