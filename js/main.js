import { Connect4 } from './connect4.js';
import { SettingsManager } from './settings.js';
import { GameStateManager } from './gameState.js';
import { UIManager } from './ui.js';

class GameManager {
  static DEFAULT_CONFIG = {
    containerIds: {
      game: 'game-container',
      settings: 'settings-container'
    },
    buttonIds: {
      savePlayer1: 'save-1',
      savePlayer2: 'save-2',
      resetStats: 'reset-stats'
    }
  };

  constructor(config = {}) {
    this.config = { ...GameManager.DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  initialize() {
    try {
      this.initializeComponents();
      this.initializeDOMElements();
      this.initializeEventListeners();
      this.showSettings();
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.handleInitializationError(error);
    }
  }

  initializeComponents() {
    this.connect4 = new Connect4();
    this.gameStateManager = new GameStateManager(this);
    this.settingsManager = new SettingsManager(this);
    this.uiManager = new UIManager(this);
  }

  initializeDOMElements() {
    const { containerIds } = this.config;

    this.gameContainer = document.getElementById(containerIds.game);
    this.settingsContainer = document.getElementById(containerIds.settings);

    if (!this.gameContainer || !this.settingsContainer) {
      throw new Error('Required game containers not found');
    }

    this.settingsForm = this.settingsContainer.querySelector('form');
    if (!this.settingsForm) {
      throw new Error('Settings form not found');
    }
  }

  initializeEventListeners() {
    const { buttonIds } = this.config;

    this.boundHandleEscape = this.handleEscape.bind(this);
    this.boundHandleSettingsSubmit = this.handleSettingsSubmit.bind(this);

    this.settingsForm.addEventListener('submit', this.boundHandleSettingsSubmit);

    this.addButtonListener(buttonIds.savePlayer1, () =>
      this.settingsManager.savePlayerSettings(1));
    this.addButtonListener(buttonIds.savePlayer2, () =>
      this.settingsManager.savePlayerSettings(2));
    this.addButtonListener(buttonIds.resetStats, () => {
      this.gameStateManager.resetStats();
      this.uiManager.updateStats();
    });

    document.addEventListener('keydown', this.boundHandleEscape);
  }

  addButtonListener(id, handler) {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener('click', handler);
    } else {
      console.warn(`Button with id '${id}' not found`);
    }
  }

  handleSettingsSubmit(e) {
    e.preventDefault();
    try {
      this.settingsManager.savePlayerSettings(1);
      this.settingsManager.savePlayerSettings(2);
      this.settingsManager.saveBoardSettings();
      this.handleNewGame();
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.uiManager.showError('Failed to save settings');
    }
  }

  handleEscape(e) {
    if (e.key === 'Escape') {
      this.toggleSettings();
    }
  }

  handleNewGame() {
    try {
      const { rows, cols } = this.settingsManager.getBoardSettings();
      this.connect4 = new Connect4(rows, cols);
      this.gameStateManager.resetGame();
      this.uiManager.initializeBoard();
      this.hideSettings();
      this.showGame();
    } catch (error) {
      console.error('Failed to start new game:', error);
      this.uiManager.showError('Failed to start new game');
    }
  }

  handleInitializationError(error) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = 'Failed to initialize game. Please refresh the page.';
    document.body.appendChild(errorElement);
  }

  destroy() {
    document.removeEventListener('keydown', this.boundHandleEscape);
    this.settingsForm.removeEventListener('submit', this.boundHandleSettingsSubmit);
  }

  showSettings() {
    this.validateContainer(this.settingsContainer);
    this.settingsContainer.style.display = 'block';
  }

  hideSettings() {
    this.validateContainer(this.settingsContainer);
    this.settingsContainer.style.display = 'none';
  }

  showGame() {
    this.validateContainer(this.gameContainer);
    this.gameContainer.style.display = 'block';
  }

  hideGame() {
    this.validateContainer(this.gameContainer);
    this.gameContainer.style.display = 'none';
  }

  validateContainer(container) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('Invalid container element');
    }
  }

  toggleSettings() {
    try {
      if (this.settingsContainer.style.display === 'none') {
        this.showSettings();
        this.hideGame();
      } else {
        this.hideSettings();
        this.showGame();
      }
    } catch (error) {
      console.error('Failed to toggle settings:', error);
    }
  }
}

const gameManager = new GameManager();
export default gameManager;

if (typeof window !== 'undefined') {
  window.gameManager = gameManager;
}