import { Connect4 } from "./connect4.js";

export class GameController {
  constructor(settingsManager, uiManager) {
    this.settingsManager = settingsManager;
    this.uiManager = uiManager;
    this.connect4 = new Connect4();
    this.setupUIHandlers();
  }

  setupUIHandlers() {
    this.uiManager.onColumnClick = this.handleMove.bind(this);
    this.uiManager.handlePointerEnter = this.handlePointerEnter.bind(this);
    this.uiManager.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.uiManager.handleTouchMove = this.handleTouchMove.bind(this);
    this.uiManager.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  startNewgame() {
    const { rows, cols } = this.settingsManager.getBoardSettings();
    this.connect4  = new Connect4(rows, cols);
    this.uiManager.resetBoard();
    this.uiManager.showGameScreen();
    this.updateCurrentPlayer();
  }

  handleMove(column, mobile = false) {
    if (this.connect4.isGameOver) return;

    const result = this.connect4.makeMove(column);
    if (!result) return;

    this.uiManager.updateCell(result.row, result.column, result.player);

    if (result.type === 'win' || result.type === 'draw') {
      this.handleGameEnd(result);
    } else {
      this.updateCurrentPlayer();
      if (!mobile) this.uiManager.updateColumn(result.column, this.connect4.getLowestEmptyRow(result.column), this.connect4.getCurrentPlayer());
    }
  }

  undoMove() {
    const move = this.connect4.undoMove();
    if (move === -1) return;
    if (move.type === 'win') {
      for (const winCell of move.winningCells) {
        const cell = document.querySelector(`[data-row="${winCell[0]}"][data-col="${winCell[1]}"]`);
        cell.classList.remove('winning-cell');
      }
    }
    this.uiManager.clearCell(move.row, move.column);
    this.uiManager.enableBoard();
    this.updateCurrentPlayer();
  }

  handlePointerEnter(col) {
    if (this.connect4.isGameOver || this.connect4.isColumnFull(col)) return
    this.uiManager.hoveredColumn = col;
    const lowest = this.connect4.getLowestEmptyRow(col);
    const player = this.connect4.getCurrentPlayer();
    this.uiManager.updateColumn(col, lowest, player)
  }

  handlePointerLeave() {
    this.uiManager.clearAllHoverStates();
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const col = element?.closest('.column')?.dataset.col;
    
    if (col !== this.uiManager.hoveredColumn) {
      this.uiManager.clearAllHoverStates();
      col !== undefined && this.handlePointerEnter(parseInt(col));
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const col = element?.closest('.column')?.dataset.col;
    
    this.uiManager.clearAllHoverStates();
    col !== undefined && this.handleMove(parseInt(col), true);
  }

  handleGameEnd(result) {
    this.settingsManager.updateStats(result);
    this.uiManager.updateStats();
    this.uiManager.disableBoard();

    if (result.type === 'win') {
      this.highlightWinningCells();
      const player = this.settingsManager.getPlayerSettings(result.player).name
      this.uiManager.elements.currentPlayer.textContent = `Winner: ${player}`;
    } else if (result.type === 'draw') {
      this.uiManager.elements.currentPlayer.textContent = "It's a draw!";
      this.uiManager.elements.playerColor.style.backgroundColor = "rgba(0, 0, 0, 0)";
    }
  }

  updateCurrentPlayer() {
    const currentPlayer = this.connect4.getCurrentPlayer();
    const { name, color } = this.settingsManager.getPlayerSettings(currentPlayer);
    this.uiManager.elements.currentPlayer.textContent = name;
    this.uiManager.elements.playerColor.style.backgroundColor = color;
  }

  highlightWinningCells() {
    this.connect4.winningCells.forEach(([ row, col ]) => {
      const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      cell.classList.add('winning-cell');
    })
  }

  resetGame() {
    this.connect4.reset();
    this.uiManager.resetBoard();
    this.updateCurrentPlayer();
    this.uiManager.updateStats();
  }
}