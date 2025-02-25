export class UIManager {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    this.isProcessingMove = false;
    this.hoveredColumn = null;
    this.isTouchDevice = 'ontouchstart' in window;

    this.cacheElements();
    this.initializeUI();
    this.setupEventListeners();
  }

  cacheElements() {
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

  handleBoardClick(e) {
    const column = e.target.closest('.column')?.dataset.col;
    if (column !== undefined) {
      this.onColumnClick?.(parseInt(column));
    }
  }

  toggleUI() {
    if (this.elements.gameContainer.style.display === 'block') {
      this.showSettingsScreen();
    } else {
      this.showGameScreen();
    }
  }

  showGameScreen() {
    this.elements.settingsContainer.style.display = 'none';
    this.elements.gameContainer.style.display = 'block';
  }

  showSettingsScreen() {
    this.elements.gameContainer.style.display = 'none';
    this.elements.settingsContainer.style.display = 'block';
  }

  initializeUI() {
    this.setCSSVariables();
    this.createBoard();
    this.updateSettingsForm();
    this.updateStats();
  }

  updateSettingsForm() {
    const { player1, player2, board, draws } = this.settingsManager.getSettings();
    this.elements.info.player1Color.value = player1.color;
    this.elements.info.player2Color.value = player2.color;
    this.elements.info.boardRows.value = board.rows;
    this.elements.info.boardCols.value = board.cols;
    this.elements.info.boardColor.value = board.color;

    for (const el of this.elements.info.player1Name) {
      el.textContent = player1.name;
    }

    for (const el of this.elements.info.player2Name) {
      el.textContent = player2.name;
    }

    for (const el of this.elements.stats.draws) {
      el.textContent = draws;
    }
  }

  setCSSVariables() {
    const { player1, player2, board } = this.settingsManager.getSettings();
    document.documentElement.style.setProperty('--player1-color', player1.color);
    document.documentElement.style.setProperty('--player2-color', player2.color);
    document.documentElement.style.setProperty('--board-color', board.color);
  }

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

  resetBoard() {
    for (const col of this.elements.board.children) {
      col.classList = ['column'];
      for (const cell of col.children) {
        cell.classList = ['cell'];
      }
    };
  }

  disableBoard() {
    for (const col of this.elements.board.children) {
      col.classList.add('disabled')
    }
  }

  updateCell(row, col, player) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.classList.remove(`player${player}-hover`);
    cell.classList.add(`player${player}`);
  }

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

  clearColumn(col) {
    document.querySelectorAll(`.cell[data-col="${col}"]`).forEach(cell => {
      cell.classList.remove('player1-hover', 'player2-hover');
      cell.parentElement.classList.remove('column-hover');
    });
  }

  clearAllHoverStates() {
    if (this.hoveredColumn !== null) {
      this.clearColumn(this.hoveredColumn);
      this.hoveredColumn = null;
    }
  }

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
