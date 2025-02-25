/**
 * @fileoverview Main application file that initializes the Connect 4 game and coordinates 
 * between settings, UI, and game controller components.
 */

import { SettingsManager } from "./settings.js";
import { UIManager } from "./ui.js";
import { GameController } from "./controller.js";

/**
 * Main application class that manages the Connect 4 game and coordinates between
 * settings, UI, and controller components.
 */
class GameApp {
  /**
   * Initialize the game application with settings, UI, and controller components.
   */
  constructor() {
    /** @type {SettingsManager} Settings manager instance */
    this.settingsManager = new SettingsManager();
    
    /** @type {UIManager} UI manager instance */
    this.uiManager = new UIManager(this.settingsManager);
    
    /** @type {GameController} Game controller instance */
    this.gameController = new GameController(this.settingsManager, this.uiManager);
    
    /** 
     * Array tracking the validity of both player names [player1Valid, player2Valid]
     * @type {boolean[]} 
     */
    this.validName = [false, false];
    
    /** 
     * Current screen being displayed ("settings" or "game")
     * @type {string} 
     */
    this.currentScreen = "settings";
    
    this.initialize();
  }

  /**
   * Initialize the application by setting up event listeners and displaying the settings screen.
   */
  initialize() {
    this.setupEventListeners();
    this.validate();
    this.uiManager.showSettingsScreen();
  }

  /**
   * Set up all event listeners for the game application.
   */
  setupEventListeners() {
    document.getElementById('start-game').addEventListener('click', (e) => {
      e.preventDefault();
      const player1 = document.querySelector('.form-group > .name-1').value
      const player2 = document.querySelector('.form-group > .name-2').value
      this.settingsManager.save({
        player1: { name: player1 },
        player2: { name: player2 }
      });
      this.gameController.startNewgame();
      this.currentScreen = "game";
    })
    
    document.getElementById("form-name-1").addEventListener('input', (e) => {
      this.validate();
    })
    
    document.getElementById("form-name-2").addEventListener('input', (e) => {
      this.validate();
    })
    
    document.getElementById('save-1').addEventListener('click', (e) => {
      const player1 = document.querySelector('.form-group > .name-1').value
      this.settingsManager.save({ player1: { name: player1 }})
      this.uiManager.updateSettingsForm();
      this.uiManager.updateStats();
      e.target.textContent = "Saved!"
      setTimeout(() => {
        e.target.textContent = "Save";
      }, 1000)
    })
    
    document.getElementById('save-2').addEventListener('click', (e) => {
      const player2 = document.querySelector('.form-group > .name-2').value
      this.settingsManager.save({ player2: { name: player2 }})
      this.uiManager.updateSettingsForm();
      this.uiManager.updateStats();
      e.target.textContent = "Saved!"
      setTimeout(() => {
        e.target.textContent = "Save";
      }, 1000)
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
      const key = e.key;
      const maxCols = this.gameController.connect4.cols;
      if (key === 'Escape') {
        this.uiManager.toggleUI();
        this.currentScreen = this.currentScreen === "settings" ? "game" : "settings"
      }
      else if (Number.isInteger(parseInt(key)) && parseInt(key) <= maxCols && this.currentScreen === "game") {
        this.gameController.handleMove(parseInt(key) - 1, true);
      }
    })
  }
  
  /**
   * Validate player names and update UI button states based on validation.
   */
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

/**
 * Initialize the game application when the DOM content is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  const gameApp = new GameApp();
  window.gameApp = gameApp;
})