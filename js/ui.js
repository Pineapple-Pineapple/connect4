/**
 * @fileoverview Manages visual presentation and user interaction,
 * game board, settings screen, and user interface
 *
 * @typedef {Object} UIEventMap
 * @property {function(number):void} columnClick - Called when a column is clicked
 * @property {function(number):void} columnEnter - Called when a pointer enters a column
 * @property {function(number):void} columnLeave - Called when a pointer leaves a column
 * @property {function(TouchEvent):void} touchMove - Called when a touch moves across the board
 * @property {function(TouchEvent):void} touchEnd - Called when a touch ends
 * @property {function(number):void} keyPress - Called when a key is pressed
 * @property {function():void} resetStats - Called when the user clicks the reset stats button
 * @property {function():void} toggleScreen - Called when the user switches screens
 * @property {function():void} undo - Called when the user clicks the undo button
 *
 * @typedef {import('./settings.js').SettingsManager} SettingsManager
 */

export class UIManager {
  /**
   * @private
   * @type {SettingsManager}
   */
  #settingsManager;

  /**
   * @private
   * @type {Object.<string, HTMLElement|Object>}
   */
  #elements = {};

  /**
   * @private
   * @type {number|null}
   */
  #hoveredColumn = null;

  /**
   * @private
   * @type{boolean}
   */
  #isTouchDevice = 'ontouchstart' in window;

  /**
   * @private
   * @type {Object.<string, Set<Function>>}
   */
  #eventListeners = {
    columnClick: new Set(),
    columnEnter: new Set(),
    columnLeave: new Set(),
    touchMove: new Set(),
    touchEnd: new Set(),
    resetStats: new Set(),
    toggleScreen: new Set(),
    keyPress: new Set(),
    undo: new Set(),
  };

  /**
   * @private
   * @type {string}
   */
  #currentScreen = 'settings';

  /**
   * @private
   * @type {boolean}
   */
  #isGameInitialized = false;

  /**
   * @private
   * @type {Object} Track bound event handlers for proper cleanup
   */
  #boundBoardEventHandlers = {
    click: null,
    columnEvents: new Map()
  };

  /**
   * @param {SettingsManager} settingsManager - The settings manager instance
   */
  constructor(settingsManager) {
    this.#settingsManager = settingsManager;

    this.#settingsManager.addEventListener('settingsChanged', () => {
      this.#updateUIFromSettings();
    });

    this.#cacheElements();
    this.#initializeUI();
    this.#setupEventListeners();
  }

  /**
   * Adds an event listener for UI events
   * @param {keyof UIEventMap} event - Event name
   * @param {Function} callback - Function to call when the event occurs
   */
  addEventListener(event, callback) {
    if (this.#eventListeners[event]) {
      this.#eventListeners[event].add(callback);
    }
  }

  /**
   * Removes an event listener
   * @param {keyof UIEventMap} event - Event name
   * @param {Function} callback - Function to remove
   */
  removeEventListener(event, callback) {
    if (this.#eventListeners[event]) {
      this.#eventListeners[event].delete(callback);
    }
  }

  /**
   * Dispatches an event to all registered listeners
   * @private
   * @param {keyof UIEventMap} event - Event name
   * @param {any} data - Data to pass to listeners
   */
  #dispatchEvent(event, data) {
    if (this.#eventListeners[event]) {
      for (const callback of this.#eventListeners[event]) {
        callback(data);
      }
    }
  }

  /**
   * Caches DOM elements for faster access
   * @private
   */
  #cacheElements() {
    this.#elements = {
      gameContainer: document.getElementById('game-container'),
      settingsContainer: document.getElementById('settings-container'),
      boardTemplate: document.getElementById('game-template'),
      stats: {
        player1: document.getElementsByClassName('wins-1'),
        player2: document.getElementsByClassName('wins-2'),
        draws: document.getElementsByClassName('draws'),
      },
      settings: {
        player1Name: document.getElementsByClassName('name-1'),
        player1Color: document.getElementById('color-1'),
        player2Name: document.getElementsByClassName('name-2'),
        player2Color: document.getElementById('color-2'),
        boardRows: document.getElementById('board-rows'),
        boardCols: document.getElementById('board-cols'),
        boardColor: document.getElementById('board-color'),
      },
    };
  }

  /**
   * Setup event listeners for UI interactions
   * @private
   */
  #setupEventListeners() {
    const resetStats = document.getElementById('reset-stats');
    if (resetStats) {
      resetStats.addEventListener('click', () => {
        this.#dispatchEvent('resetStats');
      });
    }

    document.addEventListener('keypress', (e) => {
      if (!isNaN(parseInt(e.key)) && this.#currentScreen === 'game') {
        this.#dispatchEvent('keyPress', parseInt(e.key));
      }
    });
  }

  /**
   * Sets up event listeners for the game controls
   * @private
   */
  #setupGameControlEventListeners() {
    const settingsButton = document.getElementById('settings');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        this.#dispatchEvent('toggleScreen');
      });
    }

    const restartGameBtn = document.getElementById('restart-game');
    if (restartGameBtn) {
      restartGameBtn.addEventListener('click', () => {
        this.#dispatchEvent('restart');
      });
    }

    const undoButton = document.getElementById('undo-move');
    if (undoButton) {
      undoButton.addEventListener('click', () => {
        this.#dispatchEvent('undo');
      });
    }
  }

  /**
   * Cleans up board event listeners to prevent duplicates
   * @private
   */
  #cleanupBoardEventListeners() {
    const board = document.getElementById('board');
    if (!board) return;
    
    if (this.#boundBoardEventHandlers.click) {
      board.removeEventListener('click', this.#boundBoardEventHandlers.click);
      this.#boundBoardEventHandlers.click = null;
    }
    
    for (const { element, handlers } of this.#boundBoardEventHandlers.columnEvents.values()) {
      if (element && handlers) {
        for (const [eventType, handler] of Object.entries(handlers)) {
          element.removeEventListener(eventType, handler);
        }
      }
    }
    
    this.#boundBoardEventHandlers.columnEvents.clear();
  }

  /**
   * Sets up event listeners specific to the board cells and columns
   * @private
   */
  #setupBoardEventListeners() {
    const board = document.getElementById('board');
    if (!board) return;

    this.#cleanupBoardEventListeners();
    
    this.#boundBoardEventHandlers.click = this.#handleBoardClick.bind(this);
    board.addEventListener('click', this.#boundBoardEventHandlers.click);
    
    for (const col of board.children) {
      const colId = parseInt(col.dataset.col);
      const handlers = {};
      
      handlers.mouseenter = () => {
        this.#dispatchEvent('columnEnter', colId);
      };
      col.addEventListener('mouseenter', handlers.mouseenter);
      
      handlers.mouseleave = () => {
        this.#dispatchEvent('columnLeave', colId);
      };
      col.addEventListener('mouseleave', handlers.mouseleave);
      
      handlers.mousedown = (e) => {
        if (!this.#isTouchDevice) e.preventDefault();
      };
      col.addEventListener('mousedown', handlers.mousedown);
      
      handlers.touchstart = (e) => {
        e.preventDefault();
        this.#dispatchEvent('columnEnter', colId);
      };
      col.addEventListener('touchstart', handlers.touchstart);
      
      handlers.touchmove = (e) => {
        this.#dispatchEvent('touchMove', e);
      };
      col.addEventListener('touchmove', handlers.touchmove);
      
      handlers.touchend = (e) => {
        this.#dispatchEvent('touchEnd', e);
      };
      col.addEventListener('touchend', handlers.touchend);
      
      this.#boundBoardEventHandlers.columnEvents.set(colId, { element: col, handlers });
    }
  }

  /**
   * Handles click events on the game board
   * @private
   * @param {MouseEvent} e - The click event
   */
  #handleBoardClick(e) {
    const column = e.target.closest('.column')?.dataset?.col;
    if (column !== undefined) {
      this.#dispatchEvent('columnClick', parseInt(column));
    }
  }

  /**
   * Initializes the UI elements from the current settings
   * @private
   */
  #initializeUI() {
    this.#setCSSVariables();
    this.#updateUIFromSettings();
  }

  /**
   * Updates all UI from current settings
   * @private
   */
  #updateUIFromSettings() {
    this.updateSettingsForm();
    this.updateStats();
    this.#setCSSVariables();
  }

  /**
   * Updates the settings form with current settings values
   */
  updateSettingsForm() {
    const { player1, player2, board } = this.#settingsManager.getAllSettings();

    if (this.#elements.settings.player1Color) {
      this.#elements.settings.player1Color.value = player1.color;
    }
    if (this.#elements.settings.player2Color) {
      this.#elements.settings.player2Color.value = player2.color;
    }
    if (this.#elements.settings.boardColor) {
      this.#elements.settings.boardColor.value = board.color;
    }

    if (this.#elements.settings.boardRows) {
      this.#elements.settings.boardRows.value = board.rows;
    }
    if (this.#elements.settings.boardCols) {
      this.#elements.settings.boardCols.value = board.columns;
    }

    for (const el of this.#elements.settings.player1Name) {
      el.textContent = player1.name;
      if (el.tagName === 'INPUT') el.value = player1.name;
    }

    for (const el of this.#elements.settings.player2Name) {
      el.textContent = player2.name;
      if (el.tagName === 'INPUT') el.value = player2.name;
    }
  }

  /**
   * Sets CSS variables based on current settings
   * @private
   */
  #setCSSVariables() {
    const { player1, player2, board } = this.#settingsManager.getAllSettings();
    document.documentElement.style.setProperty(
      '--player1-color',
      player1.color,
    );
    document.documentElement.style.setProperty(
      '--player2-color',
      player2.color,
    );
    document.documentElement.style.setProperty('--board-color', board.color);
  }

  /**
   * Initializes the game UI from the template
   * @private
   */
  #initializeGameUI() {
    if (this.#isGameInitialized) return;

    if (this.#elements.boardTemplate && this.#elements.gameContainer) {
      this.#elements.gameContainer.innerHTML =
        this.#elements.boardTemplate.innerHTML;
      this.#setupGameControlEventListeners();
      this.#isGameInitialized = true;
    }
  }

  /**
   * Gets the current screen being displayed
   * @return {string} The current screen ('game' or 'settings')
   */
  get currentScreen() {
    return this.#currentScreen;
  }

  /**
   * Gets the currently hovered column
   * @return {number|null} The hovered column, or null if none
   */
  get hoveredColumn() {
    return this.#hoveredColumn;
  }

  /**
   * Sets the currently hovered column
   * @param {number|null} column - The column to hover, or null if none
   */
  set hoveredColumn(column) {
    this.#hoveredColumn = column;
  }

  /**
   * Toggles between game and settings screen
   */
  toggleScreen() {
    if (this.#currentScreen === 'game') {
      this.showSettingsScreen();
    } else {
      this.showGameScreen();
    }

    this.#dispatchEvent('toggleScreen');
  }

  /**
   * Shows the game screen and hides the settings screen
   */
  showGameScreen() {
    this.#initializeGameUI();
    this.#elements.settingsContainer.style.display = 'none';
    this.#elements.gameContainer.style.display = 'block';
    this.#currentScreen = 'game';
  }

  /**
   * Shows the settings screen and hides the game screen
   */
  showSettingsScreen() {
    this.#cleanupBoardEventListeners();
    this.#elements.settingsContainer.style.display = 'block';
    this.#elements.gameContainer.style.display = 'none';
    this.#currentScreen = 'settings';
  }

  /**
   * Creates the game board based on current settings
   */
  createBoard() {
    this.#initializeGameUI();
    this.#cleanupBoardEventListeners();

    const board = document.getElementById('board');
    if (!board) return;

    const { rows, columns } = this.#settingsManager.getBoardSettings();
    board.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    board.innerHTML = '';

    for (let col = 0; col < columns; col++) {
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

      board.appendChild(column);
    }

    this.#setupBoardEventListeners();
  }

  /**
   * Resets board back to initial state
   */
  resetBoard() {
    const board = document.getElementById('board');
    if (!board) return;

    for (const col of board.children) {
      col.classList = ['column'];
      for (const cell of col.children) {
        cell.classList = ['cell'];
      }
    }
  }

  /**
   * Disables user interaction with the board
   */
  disableBoard() {
    const board = document.getElementById('board');
    if (!board) return;

    for (const col of board.children) {
      col.classList.add('disabled');
    }
  }

  /**
   * Enables user interaction with the board
   */
  enableBoard() {
    const board = document.getElementById('board');
    if (!board) return;

    for (const col of board.children) {
      col.classList.remove('disabled');
    }
  }

  /**
   * Updates a cell to show a player's piece
   * @param {number} row - Row index of the piece
   * @param {number} col - Column index of the piece
   * @param {number} player - Player number (1 or 2)
   */
  updateCell(row, col, player) {
    const cell = document.querySelector(
      `[data-row="${row}"][data-col="${col}"]`,
    );
    if (cell) {
      cell.classList.remove(`player${player}-hover`);
      cell.classList.add(`player${player}`);
    }
  }

  /**
   * Update a column to show hover state
   * @param {number} col - Column index to update
   * @param {number} lowestRow - Lowest row in the column
   * @param {number} player - Current player (1 or 2)
   * @param {boolean} [clear=false] - Whether to clear the hover state
   */
  updateColumnHover(col, lowestRow, player, clear = false) {
    const cell = document.querySelector(
      `.cell[data-row="${lowestRow}"][data-col="${col}"]`,
    );
    if (!cell) return;

    this.clearColumnHover(col);

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
  clearColumnHover(col) {
    document.querySelectorAll(`.cell[data-col="${col}"]`).forEach((cell) => {
      cell.classList.remove('player1-hover', 'player2-hover');
      cell.parentElement.classList.remove('column-hover');
    });
  }

  /**
   * Clears a cell to its initial state
   * @param {number} row - Row index of the cell
   * @param {number} col -Column index of the cell
   */
  clearCell(row, col) {
    const cell = document.querySelector(
      `.cell[data-row="${row}"][data-col="${col}"]`,
    );
    if (cell) {
      cell.classList = ['cell'];
    }
  }

  /**
   * Clears hover states any hovered columns
   */
  clearAllHoverStates() {
    if (this.#hoveredColumn !== null) {
      this.clearColumnHover(this.#hoveredColumn);
      this.#hoveredColumn = null;
    }
  }

  /**
   * Updates the current player display
   * @param {number} playerNum - Player number (1 or 2)
   */
  updateCurrentPlayer(playerNum) {
    const currentPlayer = document.getElementById('current-player');
    const playerColor = document.getElementById('player-color');

    if (!currentPlayer || !playerColor) return;

    const { name, color } = this.#settingsManager.getPlayerSettings(playerNum);
    currentPlayer.textContent = name;
    playerColor.style.backgroundColor = color;
  }

  /**
   * Updates the winner display
   * @param {number|null} playerNum - Player number (1 or 2), or null for draw
   */
  updateWinnerDisplay(playerNum) {
    const currentPlayer = document.getElementById('current-player');
    const playerColor = document.getElementById('player-color');

    if (!currentPlayer || !playerColor) return;

    if (playerNum) {
      const player = this.#settingsManager.getPlayerSettings(playerNum);
      currentPlayer.textContent = `Winner: ${player.name}`;
      playerColor.style.display = 'block';
      playerColor.style.backgroundColor = player.color;
    } else {
      currentPlayer.textContent = "It's a draw!";
      playerColor.style.display = 'none';
    }
  }

  /**
   * Highlights winning cells
   * @param {Array<{row: number, col: number}>} positions - Winning positions
   */
  highlightWinningCells(positions) {
    positions.forEach(({ row, col }) => {
      const cell = document.querySelector(
        `[data-row="${row}"][data-col="${col}"]`,
      );
      if (cell) {
        cell.classList.add('winning-cell');
      }
    });
  }

  /**
   * Unhighlights winning cells
   * @param {Array<{row: number, col: number}>} positions - Winning positions
   */
  unhighlightWinningCells(positions) {
    positions.forEach(({ row, col }) => {
      const cell = document.querySelector(
        `[data-row="${row}"][data-col="${col}"]`,
      );
      if (cell) {
        cell.classList.remove('winning-cell');
      }
    });
  }

  /**
   * Highlights the restart button
   * @param {boolean} highlight - Whether to highlight
   */
  highlightRestartButton(highlight) {
    const restartButton = document.getElementById('restart-game');
    if (restartButton) {
      if (highlight) {
        restartButton.classList.add('highlight');
      } else {
        restartButton.classList.remove('highlight');
      }
    }
  }

  /**
   * Update stats display with current values
   */
  updateStats() {
    const { player1, player2, draws } = this.#settingsManager.getAllSettings();

    for (const el of this.#elements.stats.player1) {
      el.textContent = player1.wins;
    }

    for (const el of this.#elements.stats.player2) {
      el.textContent = player2.wins;
    }

    for (const el of this.#elements.stats.draws) {
      el.textContent = draws;
    }
  }

  /**
   * Initializes the move history panel
   */
  initializeHistoryPanel() {
    const historyPanel = document.getElementById('move-history');
    if (!historyPanel) return;

    historyPanel.innerHTML = '';

    const header = document.createElement('h3');
    header.textContent = 'Move History';
    historyPanel.appendChild(header);

    const historyList = document.createElement('div');
    historyList.id = 'history-list';
    historyList.className = 'history-list';
    historyPanel.appendChild(historyList);
  }

  /**
   * Updates the move history panel with scroll-aware touch handling
   * @param {Array<MoveResult>} moves - Array of moves to display
   * @param {function(number):void} onMoveClick - Callback for when a move is clicked
   * @param {function(number):void} onMoveHover - Callback for when a move is hovered
   * @param {function():void} onMoveLeave - Callback for when mouse leaves a move
   */
  updateHistoryPanel(moves, onMoveClick, onMoveHover, onMoveLeave) {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    historyList.innerHTML = '';

    let isScrolling = false;
    let initialScrollTop = 0;

    historyList.addEventListener(
      'touchstart',
      () => {
        initialScrollTop = historyList.scrollTop;
        isScrolling = false;
      },
      { passive: true },
    );

    historyList.addEventListener(
      'touchmove',
      () => {
        if (Math.abs(historyList.scrollTop - initialScrollTop) > 3) {
          isScrolling = true;
        }
      },
      { passive: true },
    );

    moves.reverse().forEach((move, idx) => {
      const reversedIndex = moves.length - 1 - idx;
      const { player, type, column } = move;

      const moveItem = document.createElement('div');
      moveItem.className = `history-item ${type === 'win' ? 'winning-move' : ''} ${type === 'draw' ? 'draw-move' : ''}`;
      moveItem.dataset.moveIndex = reversedIndex;

      const playerName = this.#settingsManager.getPlayerSettings(player).name;
      const moveNumber = reversedIndex + 1;

      let moveText = `Move ${moveNumber}: ${playerName} in column ${column + 1}`;
      if (type === 'win') {
        moveText += ` (WIN)`;
      } else if (type === 'draw') {
        moveText += ` (DRAW)`;
      }

      moveItem.textContent = moveText;

      if (!this.#isTouchDevice) {
        moveItem.addEventListener('click', () => onMoveClick(reversedIndex));
        moveItem.addEventListener('mouseenter', () =>
          onMoveHover(reversedIndex),
        );
        moveItem.addEventListener('mouseleave', onMoveLeave);
      } else {
        let touchTimer = null;
        let isShowingPreview = false;
        let touchStartX = 0;
        let touchStartY = 0;
        let hasMoved = false;

        moveItem.addEventListener('touchstart', (e) => {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          hasMoved = false;

          if (touchTimer) {
            clearTimeout(touchTimer);
          }

          touchTimer = setTimeout(() => {
            if (!hasMoved && !isScrolling) {
              isShowingPreview = true;
              onMoveHover(reversedIndex);
              moveItem.classList.add('history-item-active');
            }
          }, 500);
        });

        moveItem.addEventListener('touchmove', (e) => {
          const touch = e.touches[0];
          const moveX = Math.abs(touch.clientX - touchStartX);
          const moveY = Math.abs(touch.clientY - touchStartY);

          if (moveX > 10 || moveY > 10) {
            hasMoved = true;

            if (touchTimer) {
              clearTimeout(touchTimer);
              touchTimer = null;
            }

            if (isShowingPreview) {
              onMoveLeave();
              isShowingPreview = false;
              moveItem.classList.remove('history-item-active');
            }
          }

          const elementAtTouch = document.elementFromPoint(
            touch.clientX,
            touch.clientY,
          );
          if (!moveItem.contains(elementAtTouch)) {
            if (touchTimer) {
              clearTimeout(touchTimer);
              touchTimer = null;
            }

            if (isShowingPreview) {
              onMoveLeave();
              isShowingPreview = false;
              moveItem.classList.remove('history-item-active');
            }
          }
        });

        moveItem.addEventListener('touchend', (e) => {
          if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
          }

          if (isShowingPreview) {
            onMoveLeave();
            isShowingPreview = false;
            moveItem.classList.remove('history-item-active');
          } else if (!hasMoved && !isScrolling) {
            onMoveClick(reversedIndex);
          }
        });

        moveItem.addEventListener('touchcancel', () => {
          if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
          }

          if (isShowingPreview) {
            onMoveLeave();
            isShowingPreview = false;
            moveItem.classList.remove('history-item-active');
          }
        });
      }

      historyList.appendChild(moveItem);
    });

    historyList.scrollTop = 0;
  }

  /**
   * Saves the current board state for later restoration
   * @returns {Array<{row: number, col: number, classes: Array<string>}>} Current cell states
   */
  saveBoardState() {
    const cells = document.querySelectorAll('.cell');
    const cellStates = [];

    cells.forEach((cell) => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const classes = [...cell.classList];

      cellStates.push({ row, col, classes });
    });

    return cellStates;
  }

  /**
   * Restores the board to a saved state
   * @param {Array<{row: number, col: number, classes: Array<string>}>} cellStates - Saved cell states
   */
  restoreBoardState(cellStates) {
    cellStates.forEach(({ row, col, classes }) => {
      const cell = document.querySelector(
        `.cell[data-row="${row}"][data-col="${col}"]`,
      );
      if (cell) {
        cell.className = '';
        classes.forEach((cls) => cell.classList.add(cls));
      }
    });
  }

  /**
   * Shows a preview of the board at a specific move directly on the main board
   * @param {Array<Array<number>>} boardState - The board state to preview
   * @param {number} moveIndex - Index of the move being previewed
   */
  showBoardPreview(boardState, moveIndex) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell) => {
      cell.classList.remove('player1', 'player2', 'winning-cell');
    });

    for (let row = 0; row < boardState.length; row++) {
      for (let col = 0; col < boardState[row].length; col++) {
        const player = boardState[row][col];
        if (player !== 0) {
          const cell = document.querySelector(
            `.cell[data-row="${row}"][data-col="${col}"]`,
          );
          if (cell) {
            cell.classList.add(`player${player}`);
          }
        }
      }
    }

    const board = document.getElementById('board');
    if (board) {
      board.classList.add('preview-mode');

      const previewLabel = document.createElement('div');
      previewLabel.className = 'preview-label';
      previewLabel.textContent = `Move ${moveIndex + 1}`;

      const existingLabel = board.querySelector('.preview-label');
      if (existingLabel) {
        existingLabel.remove();
      }

      board.appendChild(previewLabel);
    }
  }

  /**
   * Ends the board preview
   */
  endBoardPreview() {
    const board = document.getElementById('board');
    if (board) {
      board.classList.remove('preview-mode');

      const previewLabel = board.querySelector('.preview-label');
      if (previewLabel) {
        previewLabel.remove();
      }
    }
  }
}
