/**
 * @fileoverview Coordinates between the Connect4 game logic,
 * the settings manager, and the UI manager. Handles game flow and user interactions.
 * 
 * @typedef {import('./settings.js').SettingsManager} SettingsManager
 * @typedef {import('./ui.js').UIManager} UIManager
 * @typedef {import('./connect4.js').MoveResult} MoveResult
 */

import { Connect4 } from "./connect4.js";

export class GameController {
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
   * @type {Connect4}
   */
  #connect4;

  /**
   * @param {SettingsManager} settingsManager - The settings manager instance
   * @param {UIManager} uiManager - The UI manager instance
   */
  constructor(settingsManager, uiManager) {
    this.#settingsManager = settingsManager;
    this.#uiManager = uiManager;
    this.#connect4 = new Connect4();
    
    this.#setupEventListeners();
  }

  /**
   * Sets up event listeners for game events
   * @private
   */
  #setupEventListeners() {
    // UI event listeners
    this.#uiManager.addEventListener('columnClick', this.#handleMove.bind(this));
    this.#uiManager.addEventListener('columnEnter', this.#handleColumnEnter.bind(this));
    this.#uiManager.addEventListener('columnLeave', this.#handleColumnLeave.bind(this));
    this.#uiManager.addEventListener('touchMove', this.#handleTouchMove.bind(this));
    this.#uiManager.addEventListener('touchEnd', this.#handleTouchEnd.bind(this));
    this.#uiManager.addEventListener('resetStats', this.#handleResetStats.bind(this));
    this.#uiManager.addEventListener('toggleScreen', this.#handleToggleScreen.bind(this));
    
    // Game event listeners
    this.#connect4.addEventListener('move', this.#handleGameMove.bind(this));
    this.#connect4.addEventListener('win', this.#handleGameWin.bind(this));
    this.#connect4.addEventListener('draw', this.#handleGameDraw.bind(this));
    this.#connect4.addEventListener('reset', this.#handleGameReset.bind(this));
    this.#connect4.addEventListener('undo', this.#handleGameUndo.bind(this));
  }

  /**
   * Starts a new game with current settings
   */
  startNewGame() {
    const { rows, columns } = this.#settingsManager.getBoardSettings();
    this.#connect4 = new Connect4(rows, columns);
    
    // Re-attach game event listeners
    this.#connect4.addEventListener('move', this.#handleGameMove.bind(this));
    this.#connect4.addEventListener('win', this.#handleGameWin.bind(this));
    this.#connect4.addEventListener('draw', this.#handleGameDraw.bind(this));
    this.#connect4.addEventListener('reset', this.#handleGameReset.bind(this));
    this.#connect4.addEventListener('undo', this.#handleGameUndo.bind(this));
    
    this.#uiManager.createBoard();

    this.resetGame();
    this.#uiManager.showGameScreen();
    this.#updateCurrentPlayer();
  }

  /**
   * Handles a player making a move in a specific column
   * @private
   * @param {number} column - The column index where the move is made
   * @param {boolean} [updateColumn=false] - Whether to update the column hover effect
   */
  #handleMove(column, updateColumn = true) {
    if (this.#connect4.isGameOver) return;
    const result = this.#connect4.makeMove(column);
    if (!updateColumn && result) this.#uiManager.updateColumnHover(result.column, this.#connect4.getLowestEmptyRow(result.column), result.player === 1 ? 2 : 1, true);
  }

  makeMove(column) {
    this.#handleMove(column);
  }

  /**
   * Handles game move events from Connect4
   * @private
   * @param {MoveResult} result - The move result
   */
  #handleGameMove(result) {
    this.#uiManager.updateCell(result.row, result.column, result.player);
    this.#updateCurrentPlayer();
    
    const lowestEmptyRow = this.#connect4.getLowestEmptyRow(result.column);
    if (lowestEmptyRow !== -1) {
      this.#uiManager.updateColumnHover(
        result.column, 
        lowestEmptyRow, 
        this.#connect4.getCurrentPlayer()
      );
    }
  }

  /**
   * Handles game win events from Connect4
   * @private
   * @param {MoveResult} result - The move result
   */
  #handleGameWin(result) {
    this.#settingsManager.updateStats({ type: 'win', player: result.player });
    this.#uiManager.updateStats();
    this.#uiManager.disableBoard();
    this.#uiManager.highlightRestartButton(true);
    this.#uiManager.highlightWinningCells(this.#connect4.winningPositions);
    this.#uiManager.updateWinnerDisplay(result.player);
  }

  /**
   * Handles game draw events from Connect4
   * @private
   */
  #handleGameDraw() {
    this.#settingsManager.updateStats({ type: 'draw' });
    this.#uiManager.updateStats();
    this.#uiManager.disableBoard();
    this.#uiManager.highlightRestartButton(true);
    this.#uiManager.updateWinnerDisplay(null);
  }

  /**
   * Handles game reset events from Connect4
   * @private
   */
  #handleGameReset() {
    this.#uiManager.resetBoard();
    this.#uiManager.enableBoard();
    this.#uiManager.highlightRestartButton(false);
    this.#updateCurrentPlayer();
  }

  /**
   * Handles game undo events from Connect4
   * @private
   * @param {MoveResult} move - The undone move
   */
  #handleGameUndo(move) {
    if (move.type === 'win') {
      this.#uiManager.unhighlightWinningCells(move.winningPositions || []);
      
      // Revert the win stat
      const playerSettings = this.#settingsManager.getPlayerSettings(move.player);
      this.#settingsManager.updateSettings({
        [`player${move.player}`]: {
          wins: Math.max(0, playerSettings.wins - 1)
        }
      });
    } else if (move.type === 'draw') {
      // Revert the draw stat
      const settings = this.#settingsManager.getAllSettings();
      this.#settingsManager.updateSettings({
        draws: Math.max(0, settings.draws - 1)
      });
    }
    
    this.#uiManager.updateStats();
    this.#uiManager.clearCell(move.row, move.column);
    this.#uiManager.enableBoard();
    this.#uiManager.highlightRestartButton(false);
    this.#updateCurrentPlayer();
  }

  /**
   * Handles pointer entering a column
   * @private
   * @param {number} column - The column being entered
   */
  #handleColumnEnter(column) {
    if (this.#connect4.isGameOver || this.#connect4.isColumnFull(column)) return;
    
    this.#uiManager.hoveredColumn = column;
    const lowestEmptyRow = this.#connect4.getLowestEmptyRow(column);
    const currentPlayer = this.#connect4.getCurrentPlayer();
    
    this.#uiManager.updateColumnHover(column, lowestEmptyRow, currentPlayer);
  }

  /**
   * Handles pointer leaving a column
   * @private
   */
  #handleColumnLeave() {
    this.#uiManager.clearAllHoverStates();
  }

  /**
   * Handles touch move events
   * @private
   * @param {TouchEvent} e - The touch move event
   */
  #handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const column = element?.closest('.column')?.dataset.col;
    
    if (column !== undefined && parseInt(column) !== this.#uiManager.hoveredColumn) {
      this.#uiManager.clearAllHoverStates();
      this.#handleColumnEnter(parseInt(column));
    }
  }

  /**
   * Handles touch end events
   * @private
   * @param {TouchEvent} e - The touch end event
   */
  #handleTouchEnd(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const column = element?.closest('.column')?.dataset.col;
    
    this.#uiManager.clearAllHoverStates();
    
    if (column !== undefined) {
      this.#handleMove(parseInt(column), false);
    }
  }

  /**
   * Handles reset stats button click
   * @private
   */
  #handleResetStats() {
    this.#settingsManager.resetStats();
  }

  /**
   * Handles toggling between game and settings screens
   * @private
   */
  #handleToggleScreen() {
    // Additional logic when screens change
  }

  /**
   * Updates the UI to show the current player
   * @private
   */
  #updateCurrentPlayer() {
    const currentPlayer = this.#connect4.getCurrentPlayer();
    this.#uiManager.updateCurrentPlayer(currentPlayer);
  }

  /**
   * Undoes the last move if possible
   */
  undoMove() {
    this.#connect4.undoMove();
  }

  /**
   * Resets the game
   */
  resetGame() {
    this.#connect4.reset();
  }
}