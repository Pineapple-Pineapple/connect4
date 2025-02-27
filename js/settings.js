/**
 * @fileoverview Manages game settings and statistics storage
 * Handles saving/loading from localStorage and provides methods to update game settings
 *
 * @typedef {Object} PlayerSettings
 * @property {string} name - Player's name
 * @property {string} color - Player's color in hex format
 * @property {number} wins - Number of player's wins
 *
 * @typedef {Object} BoardSettings
 * @property {number} rows - Board rows
 * @property {number} columns - Board columns
 * @property {string} color - Board color in hex format
 *
 * @typedef {Object} GameSettings
 * @property {PlayerSettings} player1 - Settings for player 1
 * @property {PlayerSettings} player2 - Settings for player 2
 * @property {BoardSettings} board - Board settings
 * @property {number} draws - Number of draw games
 *
 * @typedef {'move'|'win'|'draw'} gameResultType
 *
 * @typedef {Object} GameResult
 * @property {gameResultType} type - Type of move result
 * @property {number} [player] - Player number who won (required if type is 'win')
 *
 * @typedef {Object} SettingsEventMap
 * @property {function(GameSettings):void} settingsChanged - Called when settings are changed
 */

export class SettingsManager {
  /**
   * @private
   * @type {GameSettings}
   */
  #settings;

  /**
   * @private
   * @type {Object.<string, Set<Function>}
   */
  #eventListeners = {
    settingsChanged: new Set(),
  };

  /**
   * Storage key used for localStorage
   * @private
   * @type {string}
   */
  #STORAGE_KEY = 'settings';

  /**
   * Default settings for the game
   * @private
   * @type {GameSettings}
   */
  #DEFAULT_SETTINGS = {
    player1: { name: 'Player 1', color: '#fb4934', wins: 0 },
    player2: { name: 'Player 2', color: '#fabd2f', wins: 0 },
    board: { rows: 6, columns: 7, color: '#83a598' },
    draws: 0,
  };

  /**
   * Initializes the settings manager with default settings and loads with any saved settings
   */
  constructor() {
    this.#settings = this.#loadSettings();
  }

  /**
   * Adds an event listener for settings change
   * @param {keyof SettingsEventMap} event - Event name
   * @param {Function} callback - Function to call when event occurs
   */
  addEventListener(event, callback) {
    if (this.#eventListeners[event]) {
      this.#eventListeners[event].add(callback);
    }
  }

  /**
   * Removes an event listener
   * @param {keyof SettingsEventMap} event - Event name
   * @param {Function} callback - Function to remove
   */
  removeEventListener(event, callback) {
    if (this.#eventListeners[event]) {
      this.#eventListeners[event].delete(callback);
    }
  }

  /**
   * Dispatches an event to all registered event listeners
   * @private
   * @param {keyof SettingsEventMap} event - Event name
   * @param {any} data - Data to pass to event listeners
   */
  #dispatchEvent(event, data) {
    if (this.#eventListeners[event]) {
      for (const callback of this.#eventListeners[event]) {
        callback(data);
      }
    }
  }

  /**
   * Loads settings from local storage, or default settings if none exist
   * @private
   * @returns {GameSettings} The loaded settings
   */
  #loadSettings() {
    try {
      const saved = localStorage.getItem(this.#STORAGE_KEY);
      return saved
        ? { ...this.#DEFAULT_SETTINGS, ...JSON.parse(saved) }
        : { ...this.#DEFAULT_SETTINGS };
    } catch (err) {
      console.error('Error loading settings', err);
      return { ...this.#DEFAULT_SETTINGS };
    }
  }

  /**
   * Saves current settings to localStorage
   * @private
   */
  #saveToStorage() {
    try {
      localStorage.setItem(this.#STORAGE_KEY, JSON.stringify(this.#settings));
    } catch (err) {
      console.error('Error saving settings', err);
    }
  }

  /**
   * Updates settings with provided changes
   * @param {Partial<GameSettings>} updates - Object containing settings to update
   */
  updateSettings(updates) {
    const newSettings = { ...this.#settings };

    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'object' && value !== null) {
        newSettings[key] = { ...this.#settings[key], ...value };
      } else {
        newSettings[key] = value;
      }
    }

    this.#settings = newSettings;
    this.#saveToStorage();
    this.#dispatchEvent('settingsChanged', this.#settings);
  }

  /**
   * Resets all game statistics (wins and draws) to zero
   */
  resetStats() {
    this.updateSettings({
      player1: { wins: 0 },
      player2: { wins: 0 },
      draws: 0,
    });
  }

  /**
   * Gets a copy of a player's settings
   * @param {number} player - Player's number (1 or 2)
   * @returns {PlayerSettings} Player's settings
   */
  getPlayerSettings(player) {
    return { ...this.#settings[`player${player}`] };
  }

  /**
   * Gets a copy of the board's settings
   * @returns {BoardSettings} Board settings
   */
  getBoardSettings() {
    return { ...this.#settings.board };
  }

  /**
   * Gets a copy of all the game's settings
   * @returns {GameSettings} Game settings
   */
  getAllSettings() {
    return { ...this.#settings };
  }

  /**
   * Updates game statistics based on a game result
   * @param {GameResult} result - The game result
   */
  updateStats(result) {
    const updates = {};

    if (result.type === 'win') {
      updates[`player${result.player}`] = {
        wins: this.#settings[`player${result.player}`].wins + 1,
      };
    } else if (result.type === 'draw') {
      updates.draws = this.#settings.draws + 1;
    }

    this.updateSettings(updates);
  }

  /**
   * Decrements game statistics when undoing a move
   * @param {GameResult} result - The move result being undone
   */
  decrementStats(result) {
    const updates = {};

    if (result.type === 'win') {
      const currentWins = this.#settings[`player${result.player}`].wins;
      if (currentWins > 0) {
        updates[`player${result.player}`] = {
          wins: currentWins - 1,
        };
      }
    } else if (result.type === 'draw') {
      const currentDraws = this.#settings.draws;
      if (currentDraws > 0) {
        updates.draws = currentDraws - 1;
      }
    }

    if (Object.keys(updates).length > 0) {
      this.updateSettings(updates);
    }
  }
}
