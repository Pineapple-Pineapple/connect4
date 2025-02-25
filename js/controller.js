/**
 * @fileoverview Game controller that coordinates between the Connect4 game logic,
 * the settings manager, and the UI manager. Handles game flow, user interactions,
 * and updates the UI based on game state.
 */

import { Connect4 } from "./connect4.js";

/**
 * Controller class that manages game flow and coordinates between game logic and UI
 */
export class GameController {
  /**
   * Creates a new game controller
   * @param {import('./settings.js').SettingsManager} settingsManager - The settings manager instance
   * @param {import('./ui.js').UIManager} uiManager - The UI manager instance
   */
  constructor(settingsManager, uiManager) {
    /** @type {import('./settings.js').SettingsManager} Settings manager instance */
    this.settingsManager = settingsManager;
    
    /** @type {import('./ui.js').UIManager} UI manager instance */
    this.uiManager = uiManager;
    
    /** @type {Connect4} Connect4 game logic instance */
    this.connect4 = new Connect4();
    
    this.setupUIHandlers();
  }

  /**
   * Sets up event handlers for user interactions with the UI
   */
  setupUIHandlers() {
    this.uiManager.onColumnClick = this.handleMove.bind(this);
    this.uiManager.handlePointerEnter = this.handlePointerEnter.bind(this);
    this.uiManager.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.uiManager.handleTouchMove = this.handleTouchMove.bind(this);
    this.uiManager.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  /**
   * Starts a new game with current settings
   */
  startNewgame() {
    const { rows, cols } = this.settingsManager.getBoardSettings();
    this.connect4 = new Connect4(rows, cols);
    this.resetGame();
    this.uiManager.showGameScreen();
    this.uiManager.updateSettingsForm();
    this.updateCurrentPlayer();
  }

  /**
   * Handles a player making a move in a specific column
   * @param {number} column - The column index where the move is made
   * @param {boolean} [updateColumn=false] - Whether to update the column hover effect
   */
  handleMove(column, updateColumn = false) {
    if (this.connect4.isGameOver) return;

    const result = this.connect4.makeMove(column);
    if (!result) return;

    this.uiManager.updateCell(result.row, result.column, result.player);

    if (result.type === 'win' || result.type === 'draw') {
      this.handleGameEnd(result);
    } else {
      this.updateCurrentPlayer();
      if (!updateColumn) this.uiManager.updateColumn(result.column, this.connect4.getLowestEmptyRow(result.column), this.connect4.getCurrentPlayer());
    }
  }

  /**
   * Undoes the last move and updates the UI accordingly
   */
  undoMove() {
    const move = this.connect4.undoMove();
    if (move === -1) return;
    if (move.type === 'win') {
      for (const winCell of move.winningCells) {
        const cell = document.querySelector(`[data-row="${winCell[0]}"][data-col="${winCell[1]}"]`);
        cell.classList.remove('winning-cell');
      }
      this.settingsManager.save({
        [`player${move.player}`]: {
          wins: this.settingsManager.getPlayerSettings(move.player).wins - 1
        }
      })
    } else if (move.type === 'draw') {
      this.settingsManager.save({
        draws: this.settingsManager.settings.draws - 1
      })
    }

    document.getElementById("restart-game").classList.remove('highlight');
    this.uiManager.updateStats();
    this.uiManager.clearCell(move.row, move.column);
    this.uiManager.enableBoard();
    this.updateCurrentPlayer();
  }

  /**
   * Handles pointer entering a column for hover effects
   * @param {number} col - The column index being hovered
   */
  handlePointerEnter(col) {
    if (this.connect4.isGameOver || this.connect4.isColumnFull(col)) return
    this.uiManager.hoveredColumn = col;
    const lowest = this.connect4.getLowestEmptyRow(col);
    const player = this.connect4.getCurrentPlayer();
    this.uiManager.updateColumn(col, lowest, player)
  }

  /**
   * Handles pointer leaving a column to clear hover effects
   */
  handlePointerLeave() {
    this.uiManager.clearAllHoverStates();
  }

  /**
   * Handles touch move events for mobile play
   * @param {TouchEvent} e - The touch move event
   */
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

  /**
   * Handles touch end events for mobile play
   * @param {TouchEvent} e - The touch end event
   */
  handleTouchEnd(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const col = element?.closest('.column')?.dataset.col;
    
    this.uiManager.clearAllHoverStates();
    col !== undefined && this.handleMove(parseInt(col), true);
  }

  /**
   * Handles the end of a game (win or draw)
   * @param {import('./connect4.js').MoveResult} result - The result of the final move
   */
  handleGameEnd(result) {
    this.settingsManager.updateStats(result);
    this.uiManager.updateStats();
    this.uiManager.disableBoard();
    document.getElementById("restart-game").classList.add('highlight');

    if (result.type === 'win') {
      this.highlightWinningCells();
      const player = this.settingsManager.getPlayerSettings(result.player).name
      this.uiManager.elements.currentPlayer.textContent = `Winner: ${player}`;
    } else if (result.type === 'draw') {
      this.uiManager.elements.currentPlayer.textContent = "It's a draw!";
      this.uiManager.elements.playerColor.style.backgroundColor = "rgba(0, 0, 0, 0)";
    }
  }

  /**
   * Updates the UI to show the current player
   */
  updateCurrentPlayer() {
    const currentPlayer = this.connect4.getCurrentPlayer();
    const { name, color } = this.settingsManager.getPlayerSettings(currentPlayer);
    this.uiManager.elements.currentPlayer.textContent = name;
    this.uiManager.elements.playerColor.style.backgroundColor = color;
  }

  /**
   * Highlights the cells that form the winning connection
   */
  highlightWinningCells() {
    this.connect4.winningCells.forEach(([ row, col ]) => {
      const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      cell.classList.add('winning-cell');
    })
  }

  /**
   * Resets the game state and UI
   */
  resetGame() {
    this.connect4.reset();
    this.uiManager.resetBoard();
    document.getElementById("restart-game").classList.remove('highlight');
    this.updateCurrentPlayer();
    this.uiManager.updateStats();
  }
}