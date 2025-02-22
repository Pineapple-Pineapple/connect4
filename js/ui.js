export class UIManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.gameContainer = document.getElementById('game-container');
    this.isProcessingMove = false;
    this.hoveredColumn = null;
    this.cachedElements = {};
    this.isTouchDevice = 'ontouchstart' in window;
    
    this.initializeBoard();
    this.setupGlobalEvents();
  }

  setupGlobalEvents() {
    const handlePointerAction = (e, isClick = false) => {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const element = document.elementFromPoint(clientX, clientY);
      const column = element?.closest('.column')?.dataset.col;
      
      this.clearAllHoverStates();
      if (column !== undefined) {
        isClick ? this.handleColumnClick(parseInt(column)) : this.handlePointerEnter(parseInt(column));
      }
    };

    if (!this.isTouchDevice) {
      document.addEventListener('mousemove', (e) => {
        if (e.buttons === 1) handlePointerAction(e);
      });

      document.addEventListener('mouseup', (e) => handlePointerAction(e, true));
    }
  }

  initializeBoard() {
    const template = document.getElementById('game-template');
    this.gameContainer.innerHTML = template.innerHTML;
    this.cacheDOMElements();

    const { rows, cols, color } = this.gameManager.settingsManager.getBoardSettings();
    const { player1Color, player2Color } = this.getPlayerColors();

    this.setCSSVariables(player1Color, player2Color);
    this.createBoardStructure(rows, cols, color);
    this.setupButtonEvents();
    this.updateStats();
  }

  cacheDOMElements() {
    const elements = {
      board: '.board',
      currentPlayer: '#current-player',
      playerColor: '#player-color',
      player1Score: '#player1-score',
      drawsScore: '#draws-score',
      player2Score: '#player2-score',
      gameEnd: '.game-end',
      restartButton: '#restart-game',
      settingsButton: '#settings'
    };

    Object.entries(elements).forEach(([key, selector]) => {
      this.cachedElements[key] = this.gameContainer.querySelector(selector);
    });
  }

  getPlayerColors() {
    return {
      player1Color: this.gameManager.settingsManager.getPlayerSettings(1).color,
      player2Color: this.gameManager.settingsManager.getPlayerSettings(2).color
    };
  }

  setCSSVariables(player1Color, player2Color) {
    document.documentElement.style.setProperty('--player1-color', player1Color);
    document.documentElement.style.setProperty('--player2-color', player2Color);
  }

  createBoardStructure(rows, cols, color) {
    this.cachedElements.board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.cachedElements.board.style.backgroundColor = color;

    Array.from({ length: cols }).forEach((_, col) => {
      const column = this.createColumn(col, rows);
      this.cachedElements.board.appendChild(column);
    });
  }

  createColumn(col, rows) {
    const column = document.createElement('div');
    column.className = 'column';
    column.dataset.col = col;

    Array.from({ length: rows }).forEach((_, row) => {
      column.appendChild(this.createCell(row, col));
    });

    this.addColumnInteractions(column, col);
    return column;
  }

  createCell(row, col) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = row;
    cell.dataset.col = col;
    return cell;
  }

  addColumnInteractions(column, col) {
    const eventHandlers = {
      mouseenter: () => this.handlePointerEnter(col),
      mouseleave: () => this.handlePointerLeave(col),
      mousedown: (e) => { if (!this.isTouchDevice) e.preventDefault() },
      touchstart: (e) => { e.preventDefault(); this.handlePointerEnter(col) },
      touchmove: (e) => this.handleTouchMove(e),
      touchend: (e) => this.handleTouchEnd(e)
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      column.addEventListener(event, handler, event.startsWith('touch') ? { passive: false } : {});
    });
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const column = element?.closest('.column')?.dataset.col;
    
    if (column !== this.hoveredColumn) {
      this.clearAllHoverStates();
      column !== undefined && this.handlePointerEnter(parseInt(column));
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const column = element?.closest('.column')?.dataset.col;
    
    this.clearAllHoverStates();
    column !== undefined && this.handleColumnClick(parseInt(column));
  }

  handlePointerEnter(col) {
    if (this.gameManager.connect4.getIsGameOver()) return;
    this.hoveredColumn = col;
    this.updateColumnHoverState(col);
  }

  handlePointerLeave(col) {
    if (this.hoveredColumn === col) {
      this.hoveredColumn = null;
      this.clearColumnHoverState(col);
    }
  }

  clearAllHoverStates() {
    if (this.hoveredColumn !== null) {
      this.clearColumnHoverState(this.hoveredColumn);
      this.hoveredColumn = null;
    }
  }

  async handleColumnClick(col) {
    if (this.isProcessingMove || this.gameManager.connect4.getIsGameOver()) return;
    
    this.isProcessingMove = true;
    try {
      const result = await this.gameManager.gameStateManager.handleMove(col);
      if (!result) return;

      this.clearAllHoverStates();
      this.updateCell(result.row, result.column, result.player);

      if (this.gameManager.connect4.getIsGameOver()) {
        this.handleGameEnd();
      } else {
        this.updateStats();
        // Re-add hover state if mouse is still in the column
        if (!this.isTouchDevice && document.querySelector(`.column[data-col="${col}"]:hover`)) {
          this.handlePointerEnter(col);
        }
      }
    } finally {
      this.isProcessingMove = false;
    }
  }

  updateColumnHoverState(col) {
    const board = this.gameManager.connect4.getBoard();
    const lowestRow = this.gameManager.connect4.getLowestEmptyRow(board, col);
    if (lowestRow === -1) return;

    const player = this.gameManager.gameStateManager.getCurrentPlayer();
    const cell = document.querySelector(`.cell[data-row="${lowestRow}"][data-col="${col}"]`);
    cell.classList.add(`player${player}-hover`);
    cell.parentElement.classList.add('column-hover');
  }

  clearColumnHoverState(col) {
    document.querySelectorAll(`.cell[data-col="${col}"]`).forEach(cell => {
      cell.classList.remove('player1-hover', 'player2-hover');
      cell.parentElement.classList.remove('column-hover');
    });
  }

  updateCell(row, col, player, winner = false) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cell.classList.remove('player1-hover', 'player2-hover');
    cell.classList.add(`player${player}`, winner && 'winning-cell');
  }

  updateStats() {
    const stats = this.gameManager.gameStateManager.getStats();
    const [player1, player2] = [1, 2].map(p => this.gameManager.settingsManager.getPlayerSettings(p));

    this.cachedElements.currentPlayer.textContent = this.getCurrentPlayerName();
    this.cachedElements.playerColor.style.backgroundColor = this.getCurrentPlayerColor();

    this.cachedElements.player1Score.textContent = `${player1.name}: ${stats.player1Wins}`;
    this.cachedElements.drawsScore.textContent = `Draws: ${stats.draws}`;
    this.cachedElements.player2Score.textContent = `${player2.name}: ${stats.player2Wins}`;
  }

  handleGameEnd() {
    const isDraw = this.gameManager.connect4.getIsDraw();
    this.cachedElements.gameEnd.textContent = isDraw ? "It's a draw!" : `${this.getWinner()} wins!`;

    if (!isDraw) {
      this.gameManager.connect4.getWinningCells().forEach(cell => {
        this.updateCell(cell[0], cell[1], this.gameManager.connect4.getWinner(), true);
      });
    }
    this.disableAllCells();
    this.updateStats();
  }

  disableAllCells() {
    document.querySelectorAll('.cell').forEach(cell => cell.classList.add('disabled'));
  }

  getCurrentPlayerName() {
    return this.getPlayerSetting('name');
  }

  getCurrentPlayerColor() {
    return this.getPlayerSetting('color');
  }

  getPlayerSetting(prop) {
    const player = this.gameManager.gameStateManager.getCurrentPlayer();
    return this.gameManager.settingsManager.getPlayerSettings(player)[prop];
  }

  getWinner() {
    const winner = this.gameManager.connect4.getWinner();
    return this.gameManager.settingsManager.getPlayerSettings(winner).name;
  }

  setupButtonEvents() {
    this.cachedElements.restartButton.addEventListener('click', () => this.gameManager.handleNewGame());
    this.cachedElements.settingsButton.addEventListener('click', () => this.gameManager.toggleSettings());
  }

  getLowestEmptyRow(board, col) {
    for (let row = board.length - 1; row >= 0; row--) {
      if (board[row][col] === 0) return row;
    }
    return -1;
  }
}