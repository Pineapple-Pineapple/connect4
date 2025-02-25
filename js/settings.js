/**
 * @fileoverview Manages game settings and statistics storage for the Connect 4 game.
 * Handles saving/loading from localStorage and provides methods to update game settings.
 * 
 * @typedef {Object} PlayerSettings
 * @property {string} name - Player's name
 * @property {string} color - Player's color in hex format
 * @property {number} wins - Number of wins for the player
 * 
 * @typedef {Object} BoardSettings
 * @property {number} rows - Number of rows in the game board
 * @property {number} cols - Number of columns in the game board
 * @property {string} color - Board's color in hex format
 * 
 * @typedef {Object} GameSettings
 * @property {PlayerSettings} player1 - Settings for player 1
 * @property {PlayerSettings} player2 - Settings for player 2
 * @property {BoardSettings} board - Settings for the game board
 * @property {number} draws - Number of draw games
 * 
 * @typedef {Object} GameResult
 * @property {string} type - Type of result ('win' or 'draw')
 * @property {number} [player] - Player number who won (required if type is 'win')
 */

/**
 * Manages game settings and statistics for the Connect 4 game.
 * Handles persistence to localStorage and provides methods to access and update settings.
 */
export class SettingsManager {
  /**
   * Initializes the settings manager with default settings and loads any saved settings.
   */
  constructor() {
    /**
     * Default settings for the game
     * @type {GameSettings}
     */
    this.DEFAULT_SETTINGS = {
      player1: { name: 'Player 1', color: '#fb4934', wins: 0 },
      player2: { name: 'Player 2', color: '#fabd2f', wins: 0 },
      board: { rows: 6, cols: 7, color: '#83a598' },
      draws: 0
    }

    /**
     * Current game settings
     * @type {GameSettings}
     */
    this.settings = this.loadSettings();
  }

  /**
   * Loads settings from localStorage, or returns default settings if none exist
   * @returns {GameSettings} The loaded settings
   */
  loadSettings() {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : { ...this.DEFAULT_SETTINGS };
  }

  /**
   * Saves updates to settings and persists to localStorage
   * @param {Partial<GameSettings>} updates - Object containing settings to update
   */
  save(updates) {
    const newSettings = { ...this.settings };
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'object' && value !== null) {
        newSettings[key] = { ...this.settings[key], ...value };
      } else {
        newSettings[key] = value;
      }
    }
    this.settings = newSettings;
    localStorage.setItem('settings', JSON.stringify(this.settings));
  }

  /**
   * Resets all game statistics (wins and draws) to zero
   */
  resetStats() {
    this.save({
      player1: { wins: 0 },
      player2: { wins: 0 },
      draws: 0
    });
  }

  /**
   * Gets a copy of a player's settings
   * @param {number} playerNum - The player number (1 or 2)
   * @returns {PlayerSettings} The player's settings
   */
  getPlayerSettings(playerNum) {
    return { ...this.settings[`player${playerNum}`] };
  }

  /**
   * Gets a copy of the board settings
   * @returns {BoardSettings} The board settings
   */
  getBoardSettings() {
    return { ...this.settings.board };
  }

  /**
   * Gets a copy of all settings
   * @returns {GameSettings} All settings
   */
  getSettings() {
    return { ...this.settings }
  }

  /**
   * Updates game statistics based on a game result
   * @param {GameResult} result - The game result
   */
  updateStats(result) {
    const updates = {};
    if (result.type === 'win') {
      updates[`player${result.player}`] = {
        wins: this.settings[`player${result.player}`].wins + 1
      };
    } else if (result.type === 'draw') {
      updates.draws = this.settings.draws + 1;
    }
    this.save(updates);
  }
}