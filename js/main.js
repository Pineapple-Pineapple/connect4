import { SettingsManager } from "./settings.js";
import { UIManager } from "./ui.js";
import { GameController } from "./controller.js";

class GameApp {
  constructor() {
    this.settingsManager = new SettingsManager();
    this.uiManager = new UIManager(this.settingsManager);
    this.gameController = new GameController(this.settingsManager, this.uiManager);
    this.validName = [false, false];
    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
    this.validate();
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

    document.getElementById("form-name-1").addEventListener('input', (e) => {
      this.validate();
    })

    document.getElementById("form-name-2").addEventListener('input', (e) => {
      this.validate();
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

    document.getElementById('undo').addEventListener('click', (e) => {
      this.gameController.undoMove();
    })

    document.getElementById('settings').addEventListener('click', (e) => {
      this.uiManager.showSettingsScreen();
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.uiManager.toggleUI();
    })
  }
  
  validate() {
    const name1 = document.getElementById("form-name-1");
    const save1 = document.getElementById("save-1");
    const name2 = document.getElementById("form-name-2");
    const save2 = document.getElementById("save-2");
    const start = document.getElementById("start-game");

    if (name1.value.length !== 0) {
      this.validName[0] = true;
      save1.disabled = false;
    } else {
      this.validName[0] = false;
      save1.disabled = true;
    }

    if (name2.value.length !== 0) {
      this.validName[1] = true;
      save2.disabled = false;
    } else {
      this.validName[1] = false;
      save2.disabled = true;
    }

    if (this.validName[0] === true && this.validName[1] === true) {
      start.disabled = false;
    } else {
      start.disabled = true;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const gameApp = new GameApp();
  window.gameApp = gameApp;
})
