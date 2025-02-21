import { Connect4 } from './connect4.js';
import { SettingsManager } from './settings.js';
import { GameStateManager } from './gameState.js';
import { UIManager } from './ui.js';

class GameManager {
  constructor() {
    this.connect4 = new Connect4();

    this.gameStateManager = new GameStateManager(this);
    this.settingsManager = new SettingsManager(this);
    this.uiManager = new UIManager(this);

    this.gameContainer = document.getElementById('game-container');
    this.settingsContainer = document.getElementById('settings-container');
    this.settingsForm = this.settingsContainer.querySelector('form');

    this.initializeEventListeners();

    this.showSettings();
  }

  initializeEventListeners() {
    this.settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.settingsManager.savePlayerSettings(1);
      this.settingsManager.savePlayerSettings(2);
      this.settingsManager.saveBoardSettings();
      this.handleNewGame();
    });

    document.getElementById('save-1').addEventListener('click', () => {
      this.settingsManager.savePlayerSettings(1);
    });

    document.getElementById('save-2').addEventListener('click', () => {
      this.settingsManager.savePlayerSettings(2);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.toggleSettings();
      }
    });


    document.getElementById('reset-stats').addEventListener('click', () => {
      this.gameStateManager.resetStats();
      this.uiManager.updateStats();
    });
  }

  handleNewGame() {
    const { rows, cols } = this.settingsManager.getBoardSettings();
    this.connect4 = new Connect4(rows, cols);

    this.gameStateManager.resetGame();

    this.uiManager.initializeBoard();

    this.hideSettings();
    this.showGame();
  }

  showSettings() {
    this.settingsContainer.style.display = 'block';
  }

  hideSettings() {
    this.settingsContainer.style.display = 'none';
  }

  showGame() {
    this.gameContainer.style.display = 'block';
  }

  hideGame() {
    this.gameContainer.style.display = 'none';
  }

  toggleSettings() {
    if (this.settingsContainer.style.display === 'none') {
      this.showSettings();
      this.hideGame();
    } else {
      this.hideSettings();
      this.showGame();
    }
  }
}

const gameManager = new GameManager();
window.gameManager = gameManager;