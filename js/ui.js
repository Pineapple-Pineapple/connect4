/**
 * @fileoverview UI Manager that handles the visual presentation and user interaction
 * for the Connect 4 game. Manages the game board, settings screen, and statistics display.
 * 
 * @typedef {Object} UIElements
 * @property {HTMLElement} gameContainer - Container for the game board and controls
 * @property {HTMLElement} settingsContainer - Container for the settings form
 * @property {HTMLElement} board - The game board element
 * @property {HTMLTemplateElement} boardTempate - Template for the game board
 * @property {HTMLElement} currentPlayer - Element displaying the current player
 * @property {HTMLElement} playerColor - Element displaying the current player's color
 * @property {Object} stats - Elements that display game statistics
 * @property {HTMLCollectionOf<Element>} stats.player1 - Elements showing player 1's wins
 * @property {HTMLCollectionOf<Element>} stats.player2 - Elements showing player 2's wins
 * @property {HTMLCollectionOf<Element>} stats.draws - Elements showing number of draws
 * @property {Object} info - Elements that display/input game settings
 * @property {HTMLCollectionOf<Element>} info.player1Name - Elements for player 1's name
 * @property {HTMLElement} info.player1Color - Input for player 1's color
 * @property {HTMLCollectionOf<Element>} info.player2Name - Elements for player 2's name
 * @property {HTMLElement} info.player2Color - Input for player 2's color
 * @property {HTMLElement} info.boardRows - Input for board rows
 * @property {HTMLElement} info.boardCols - Input for board columns
 * @property {HTMLElement} info.boardColor - Input for board color
 */

/**
 * Manages the user interface for the Connect 4 game
 */
export class UIManager {
  /**
   * Creates a new UI manager
   * @param {import('./settings.js').SettingsManager} settingsManager - The settings manager instance
   */
  constructor(settingsManager) {
    /** @type {import('./settings.js').SettingsManager} Settings manager instance */
    this.settingsManager = settingsManager;
    
    /** @type {boolean} Whether a move is currently being processed */
    this.isProcessingMove = false;
    
    /** @type {number|null} Currently hovered column index */
    this.hoveredColumn = null;
    
    /** @type {boolean} Whether the device supports touch events */
    this.isTouchDevice = 'ontouchstart' in window;

    /** @type {Function|undefined} Callback for when a column is clicked */
    this.onColumnClick = undefined;
    
    /** @type {Function|undefined} Callback for when pointer enters a column */
    this.handlePointerEnter = undefined;
    
    /** @type {Function|undefined} Callback for when pointer leaves a column */
    this.handlePointerLeave = undefined;
    
    /** @type {Function|undefined} Callback for touch move events */
    this.handleTouchMove = undefined;
    
    /** @type {Function|undefined} Callback for touch end events */
    this.handleTouchEnd = undefined;

    this.cacheElements();
    this.initializeUI();
    this.setupEventListeners();
  }

  /**
   * Caches DOM elements for faster access
   */
  cacheElements() {
    /** @type {UIElements} Cached DOM elements */
    this.elements = {
      gameContainer: document.getElementById('game-container'),
      settingsContainer: document.getElementById('settings-container'),
      board: document.getElementById('board'),
      boardTempate: document.getElementById('game-template'),
      currentPlayer: document.getElementById('current-player'),
      playerColor: document.getElementById('player-color'),
      stats: {
        player1: document.getElementsByClassName('wins-1'),
        player2: document.getElementsByClassName('wins-2'),
        draws: document.getElementsByClassName('draws')
      },
      info: {
        player1Name: document.getElementsByClassName('name-1'),
        player1Color: document.getElementById('color-1'),
        player2Name: document.getElementsByClassName('name-2'),
        player2Color: document.getElementById('color-2'),
        boardRows: document.getElementById('board-rows'),
        boardCols: document.getElementById('board-cols'),
        boardColor: document.getElementById('board-color'),
      }
    }
  }

  /**
   * Sets up event listeners for UI interactions
   */
  setupEventListeners() {
    this.elements.board.addEventListener('click', this.handleBoardClick.bind(this));
    for (const col of this.elements.board.children) {
      col.addEventListener('mouseenter', () => this.handlePointerEnter?.(col.dataset.col));
      col.addEventListener('mouseleave', () => this.handlePointerLeave?.(col.dataset.col));
      col.addEventListener('mousedown', (e) => { if (!this.isTouchDevice) e.preventDefault() });
      col.addEventListener('touchstart', (e) => { e.preventDefault(); this.handlePointerEnter(col.dataset.col) });
      col.addEventListener('touchmove', (e) => this.handleTouchMove(e));
      col.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }
    document.getElementById('reset-stats').addEventListener('click', () => {
      this.settingsManager.resetStats();
      this.updateStats();
    })
  }

  /**
   * Handles click events on the game board
   * @param {MouseEvent} e - The click event
   */
  handleBoardClick(e) {
    const column = e.target.closest('.column')?.dataset.col;
    if (column !== undefined) {
      this.onColumnClick?.(parseInt(column));
    }
  }

  /**
   * Toggles between game screen and settings screen
   */
  toggleUI() {
    if (this.elements.gameContainer.style.display === 'block') {
      this.showSettingsScreen();
    } else {
      this.showGameScreen();
    }
  }

  /**
   * Shows the game screen and hides the settings screen
   */
  showGameScreen() {
    this.elements.settingsContainer.style.display = 'none';
    this.elements.gameContainer.style.display = 'block';
  }

  /**
   * Shows the settings screen and hides the game screen
   */
  showSettingsScreen() {
    this.elements.gameContainer.style.display = 'none';
    this.elements.settingsContainer.style.display = 'block';
  }

  /**
   * Initializes the UI with current settings
   */
  initializeUI() {
    this.setCSSVariables();
    this.createBoard();
    this.updateSettingsForm();
    this.updateStats();
  }

  /**
   * Updates the settings form with current settings values
   */
  updateSettingsForm() {
    const { player1, player2, board, draws } = this.settingsManager.getSettings();
    this.elements.info.player1Color.value = player1.color;
    this.elements.info.player2Color.value = player2.color;
    this.elements.info.boardRows.value = board.rows;
    this.elements.info.boardCols.value = board.cols;
    this.elements.info.boardColor.value = board.color;

    for (const el of this.elements.info.player1Name) {
      el.textContent = player1.name;
      if (el.type === "text") el.value = player1.name;
    }

    for (const el of this.elements.info.player2Name) {
      el.textContent = player2.name;
      if (el.type === "text") el.value = player2.name;
    }

    for (const el of this.elements.stats.draws) {
      el.textContent = draws;
    }
  }

  /**
   * Sets CSS variables based on current settings
   */
  setCSSVariables() {
    const { player1, player2, board } = this.settingsManager.getSettings();
    document.documentElement.style.setProperty('--player1-color', player1.color);
    document.documentElement.style.setProperty('--player2-color', player2.color);
    document.documentElement.style.setProperty('--board-color', board.color);
  }

  /**
   * Creates the game board based on current settings
   */
  createBoard() {
    const template = this.elements.boardTempate.innerHTML;
    this.elements.gameContainer.innerHTML = template;
    this.cacheElements();
    const { rows, cols } = this.settingsManager.getBoardSettings();
    this.elements.board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.elements.board.innerHTML = '';

    for (let col = 0; col < cols; col++) {
      const column = document.createElement('div');
      column.classList.add('column');
      column.dataset.col = col;

      for (let row = 0; row < rows; row++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        column.appendChild(cell);
      }

      this.elements.board.appendChild(column);
    }
  }

  /**
   * Resets the game board to its initial state
   */
  resetBoard() {
    for (const col of this.elements.board.children) {
      col.classList = ['column'];
      for (const cell of col.children) {
        cell.classList = ['cell'];
      }
    };
  }

  /**
   * Disables user interaction with the game board
   */
  disableBoard() {
    for (const col of this.elements.board.children) {
      col.classList.add('disabled')
    }
  }

  /**
   * Enables user interaction with the game board
   */
  enableBoard() {
    for (const col of this.elements.board.children) {
      col.classList.remove('disabled')
    }
  }

  /**
   * Updates a cell to show a player's piece
   * @param {number} row - Row index of the cell
   * @param {number} col - Column index of the cell
   * @param {number} player - Player number (1 or 2)
   */
  updateCell(row, col, player) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.classList.remove(`player${player}-hover`);
    cell.classList.add(`player${player}`);
  }

  /**
   * Updates a column to show hover state
   * @param {number} col - Column index
   * @param {number} lowest - Lowest empty row in the column
   * @param {number} player - Current player (1 or 2)
   * @param {boolean} [clear=false] - Whether to clear the hover state
   */
  updateColumn(col, lowest, player, clear = false) {
    const cell = document.querySelector(`.cell[data-row="${lowest}"][data-col="${col}"]`);
    if (!clear) {
      cell.classList.add(`player${player}-hover`);
      cell.parentElement.classList.add('column-hover');
    } else {
      cell.classList.remove(`player${player}-hover`);
      cell.parentElement.classList.remove('column-hover');
    }
  }

  /**
   * Clears hover state from a column
   * @param {number} col - Column index
   */
  clearColumn(col) {
    document.querySelectorAll(`.cell[data-col="${col}"]`).forEach(cell => {
      cell.classList.remove('player1-hover', 'player2-hover');
      cell.parentElement.classList.remove('column-hover');
    });
  }

  /**
   * Clears a cell to its initial state
   * @param {number} row - Row index of the cell
   * @param {number} col - Column index of the cell
   */
  clearCell(row, col) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cell.classList = ['cell'];
  }

  /**
   * Clears hover states from all columns
   */
  clearAllHoverStates() {
    if (this.hoveredColumn !== null) {
      this.clearColumn(this.hoveredColumn);
      this.hoveredColumn = null;
    }
  }

  /**
   * Updates statistics display with current values
   */
  updateStats() {
    const { player1, player2, draws } = this.settingsManager.getSettings();
    for (const c of this.elements.stats.player1) {
      c.textContent = player1.wins;
    }
    for (const c of this.elements.stats.player2) {
      c.textContent = player2.wins;
    }
    for (const c of this.elements.stats.draws) {
      c.textContent = draws;
    }
  }
}