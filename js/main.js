/**
 * @fileoverview Main application file that initializes the Connect 4 game and coordinates 
 * between settings, UI, and game controller components.
 */

import { SettingsManager } from "./settings.js";
import { UIManager } from "./ui.js";
import { GameController } from "./controller.js";

class GameApp {
  /**
   * @private
   * @type {SettingsManager}
   */
  #settingsManager;
  
  /**
   * @private
   * @type {UIManager}
   */
  #uiManager;
  
  /**
   * @private
   * @type {GameController}
   */
  #gameController;

  constructor() {
    this.#settingsManager = new SettingsManager();
    this.#uiManager = new UIManager(this.#settingsManager);
    this.#gameController = new GameController(this.#settingsManager, this.#uiManager);
    
    this.#initialize();
  }

  /**
   * Initialize the application
   * @private
   */
  #initialize() {
    this.#setupSettingsEventListeners();
    this.#validatePlayerNames();
    this.#uiManager.showSettingsScreen();
    
    // Listen for screen toggle events to set up game controls when needed
    this.#uiManager.addEventListener('toggleScreen', () => {
      if (this.#uiManager.currentScreen === 'game') {
        // Set a small timeout to ensure DOM is updated
        setTimeout(() => this.#setupGameEventListeners(), 0);
      }
    });
  }

  /**
   * Set up event listeners for the settings screen
   * @private
   */
  #setupSettingsEventListeners() {
    // Start game button
    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) {
      startGameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.#startGame();
      });
    }
    
    // Player name inputs
    const name1Input = document.getElementById("form-name-1");
    if (name1Input) {
      name1Input.addEventListener('input', () => {
        this.#validatePlayerNames();
      });
    }
    
    const name2Input = document.getElementById("form-name-2");
    if (name2Input) {
      name2Input.addEventListener('input', () => {
        this.#validatePlayerNames();
      });
    }
    
    // Save player 1 button
    const save1Btn = document.getElementById('save-1');
    if (save1Btn) {
      save1Btn.addEventListener('click', (e) => {
        const name = document.querySelector('.form-group > .name-1').value;
        this.#settingsManager.updateSettings({ 
          player1: { name } 
        });
        
        this.#showSavedFeedback(e.target);
      });
    }
    
    // Save player 2 button
    const save2Btn = document.getElementById('save-2');
    if (save2Btn) {
      save2Btn.addEventListener('click', (e) => {
        const name = document.querySelector('.form-group > .name-2').value;
        this.#settingsManager.updateSettings({ 
          player2: { name } 
        });
        
        this.#showSavedFeedback(e.target);
      });
    }
  }
  
  /**
   * Set up event listeners for the game screen controls
   * @private
   */
  #setupGameEventListeners() {
    // Restart game button
    const restartGameBtn = document.getElementById('restart-game');
    if (restartGameBtn) {
      // Remove any existing event listeners to prevent duplicates
      const newRestartBtn = restartGameBtn.cloneNode(true);
      restartGameBtn.parentNode.replaceChild(newRestartBtn, restartGameBtn);
      
      newRestartBtn.addEventListener('click', () => {
        this.#gameController.resetGame();
      });
    }
    
    // Undo button
    const undoBtn = document.getElementById('undo');
    if (undoBtn) {
      // Remove any existing event listeners to prevent duplicates
      const newUndoBtn = undoBtn.cloneNode(true);
      undoBtn.parentNode.replaceChild(newUndoBtn, undoBtn);
      
      newUndoBtn.addEventListener('click', () => {
        this.#gameController.undoMove();
      });
    }
    
    // Settings button
    const settingsBtn = document.getElementById('settings');
    if (settingsBtn) {
      // Remove any existing event listeners to prevent duplicates
      const newSettingsBtn = settingsBtn.cloneNode(true);
      settingsBtn.parentNode.replaceChild(newSettingsBtn, settingsBtn);
      
      newSettingsBtn.addEventListener('click', () => {
        this.#uiManager.showSettingsScreen();
      });
    }
  }

  /**
   * Start a new game
   * @private
   */
  #startGame() {
    const player1 = document.querySelector('.form-group > .name-1')?.value || 'Player 1';
    const player2 = document.querySelector('.form-group > .name-2')?.value || 'Player 2';
    const boardRows = parseInt(document.getElementById('board-rows')?.value || '6');
    const boardColumns = parseInt(document.getElementById('board-cols')?.value || '7');
    const boardColor = document.getElementById('board-color')?.value || '#83a598';
    
    this.#settingsManager.updateSettings({
      player1: { name: player1 },
      player2: { name: player2 },
      board: { rows: boardRows, columns: boardColumns, color: boardColor }
    });
    
    this.#gameController.startNewGame();
    
    // Set a small timeout to ensure DOM is updated before setting up game controls
    setTimeout(() => this.#setupGameEventListeners(), 0);
  }

  /**
   * Show temporary saved feedback on a button
   * @private
   * @param {HTMLElement} button - Button element
   */
  #showSavedFeedback(button) {
    const originalText = button.textContent;
    button.textContent = "Saved!";
    
    setTimeout(() => {
      button.textContent = originalText;
    }, 1000);
  }

  /**
   * Validate player names and update UI button states
   * @private
   */
  #validatePlayerNames() {
    const name1 = document.getElementById("form-name-1");
    const name2 = document.getElementById("form-name-2");
    const startGameBtn = document.getElementById("start-game");
    const save1Btn = document.getElementById("save-1");
    const save2Btn = document.getElementById("save-2");
    
    if (!name1 || !name2 || !startGameBtn || !save1Btn || !save2Btn) return;
    
    const isName1Valid = name1.value.trim().length > 0;
    const isName2Valid = name2.value.trim().length > 0;
    
    // Update save buttons state
    save1Btn.disabled = !isName1Valid;
    save2Btn.disabled = !isName2Valid;
    
    // Update start game button state
    startGameBtn.disabled = !(isName1Valid && isName2Valid);
  }
}

/**
 * Initialize the game application when the DOM content is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  const gameApp = new GameApp();
});