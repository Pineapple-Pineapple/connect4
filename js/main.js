import { SettingsManager } from "./settings.js";
import { UIManager } from "./ui.js";
import { GameController } from "./controller.js";

class GameApp {
  constructor() {
    this.settingsManager = new SettingsManager();
    this.uiManager = new UIManager(this.settingsManager);
    this.gameController = new GameController(this.settingsManager, this.uiManager);
    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
    this.uiManager.showSettingsScreen();
  }

  setupEventListeners() {
    document.getElementById('start-game').addEventListener('click', (e) => {
      e.preventDefault();
      const player1 = document.querySelector('.form-group > .name-1').value
      const player2 = document.querySelector('.form-group > .name-2').value
      this.settingsManager.saveSettings({
        player1: { name: player1 },
        player2: { name: player2 }
      });
      this.gameController.startNewgame();
    })

    document.getElementById('save-1').addEventListener('click', (e) => {
      const player1 = document.querySelector('.form-group > .name-1').value
      this.settingsManager.saveSettings({ player1: { name: player1 }})
      this.uiManager.updateSettingsForm();
      this.uiManager.updateStats();
    })

    document.getElementById('save-2').addEventListener('click', () => {
      const player2 = document.querySelector('.form-group > .name-2').value
      this.settingsManager.saveSettings({ player2: { name: player2 }})
      this.uiManager.updateSettingsForm();
      this.uiManager.updateStats();
    })

    document.getElementById('restart-game').addEventListener('click', (e) => {
      this.gameController.resetGame();
    })

    document.getElementById('settings').addEventListener('click', (e) => {
      this.uiManager.showSettingsScreen();
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.uiManager.toggleUI();
    })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const gameApp = new GameApp();
  window.gameApp = gameApp;
})
