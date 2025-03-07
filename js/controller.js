/**
 * @fileoverview Coordinates between the Connect4 game logic,
 * the settings manager, and the UI manager. Handles game flow and user interactions.
 *
 * @typedef {import('./settings.js').SettingsManager} SettingsManager
 * @typedef {import('./ui.js').UIManager} UIManager
 * @typedef {import('./connect4.js').MoveResult} MoveResult
 */

import { Connect4 } from './connect4.js';

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
   * @private
   * @type {Array<{row: number, col: number, classes: Array<string>}>|null}
   */
  #savedBoardState = null;

  /**
   * @private
   * @type {boolean}
   */
  #isPreviewMode = false;

  /**
   * @private
   * @type {Object} Stores bound event handlers for proper cleanup
   */
  #boundGameHandlers = {
    move: null,
    win: null,
    draw: null,
    reset: null
  };

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
    this.#uiManager.addEventListener(
      'columnClick',
      this.#handleMove.bind(this),
    );
    this.#uiManager.addEventListener(
      'columnEnter',
      this.#handleColumnEnter.bind(this),
    );
    this.#uiManager.addEventListener(
      'columnLeave',
      this.#handleColumnLeave.bind(this),
    );
    this.#uiManager.addEventListener(
      'touchMove',
      this.#handleTouchMove.bind(this),
    );
    this.#uiManager.addEventListener(
      'touchEnd',
      this.#handleTouchEnd.bind(this),
    );
    this.#uiManager.addEventListener(
      'keyPress',
      this.#handleKeyPress.bind(this),
    );
    this.#uiManager.addEventListener(
      'resetStats',
      this.#handleResetStats.bind(this),
    );
    this.#uiManager.addEventListener('undo', this.undoMove.bind(this));

    this.#boundGameHandlers = {
      move: this.#handleGameMove.bind(this),
      win: this.#handleGameWin.bind(this),
      draw: this.#handleGameDraw.bind(this),
      reset: this.#handleGameReset.bind(this)
    };

    this.#connect4.addEventListener('move', this.#boundGameHandlers.move);
    this.#connect4.addEventListener('win', this.#boundGameHandlers.win);
    this.#connect4.addEventListener('draw', this.#boundGameHandlers.draw);
    this.#connect4.addEventListener('reset', this.#boundGameHandlers.reset);
  }

  /**
   * Starts a new game with current settings
   */
  startNewGame() {
    const { rows, columns } = this.#settingsManager.getBoardSettings();
    
    if (this.#connect4) {
      this.#connect4.removeEventListener('move', this.#boundGameHandlers.move);
      this.#connect4.removeEventListener('win', this.#boundGameHandlers.win);
      this.#connect4.removeEventListener('draw', this.#boundGameHandlers.draw);
      this.#connect4.removeEventListener('reset', this.#boundGameHandlers.reset);
    }
    
    this.#connect4 = new Connect4(rows, columns);

    this.#boundGameHandlers = {
      move: this.#handleGameMove.bind(this),
      win: this.#handleGameWin.bind(this),
      draw: this.#handleGameDraw.bind(this),
      reset: this.#handleGameReset.bind(this)
    };

    this.#connect4.addEventListener('move', this.#boundGameHandlers.move);
    this.#connect4.addEventListener('win', this.#boundGameHandlers.win);
    this.#connect4.addEventListener('draw', this.#boundGameHandlers.draw);
    this.#connect4.addEventListener('reset', this.#boundGameHandlers.reset);

    this.#uiManager.createBoard();
    this.#uiManager.initializeHistoryPanel();

    this.resetGame();
    this.#uiManager.showGameScreen();
    this.#uiManager.updateSettingsForm();
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
    if (!updateColumn && result) {
      this.#uiManager.updateColumnHover(
        result.column,
        this.#connect4.getLowestEmptyRow(result.column),
        result.player === 1 ? 2 : 1,
        true,
      );
    }

    this.#updateHistoryPanel();
  }

  /**
   * Updates the move history panel
   * @private
   */
  #updateHistoryPanel() {
    const moves = this.#connect4.getMoveHistory();
    this.#uiManager.updateHistoryPanel(
      moves,
      this.#handleHistoryItemClick.bind(this),
      this.#handleHistoryItemHover.bind(this),
      this.#handleHistoryItemLeave.bind(this),
    );
  }

  /**
   * Handles click on a history item
   * @private
   * @param {number} moveIndex - Index of the move in history
   */
  #handleHistoryItemClick(moveIndex) {
    if (this.#isPreviewMode) this.#handleHistoryItemLeave();

    const currentHistory = this.#connect4.getMoveHistory();
    const currentLength = currentHistory.length;

    if (moveIndex === currentLength - 1) return;

    if (moveIndex < currentLength - 1) {
      for (let i = currentLength - 1; i > moveIndex; i--) {
        if (
          currentHistory[i].type === 'win' ||
          currentHistory[i].type === 'draw'
        ) {
          this.#settingsManager.decrementStats(currentHistory[i]);
        }
      }
    }

    const result = this.#connect4.resetToMove(moveIndex);
    if (!result) return;

    this.#resetBoardUI();

    const board = this.#connect4.getBoard();
    this.#updateBoardFromState(board);

    if (this.#connect4.winner) {
      this.#uiManager.highlightWinningCells(this.#connect4.winningPositions);
      this.#uiManager.updateWinnerDisplay(this.#connect4.winner);
      this.#uiManager.disableBoard();
      this.#uiManager.highlightRestartButton(true);
    } else if (this.#connect4.isDraw) {
      this.#uiManager.updateWinnerDisplay(null);
      this.#uiManager.disableBoard();
      this.#uiManager.highlightRestartButton(true);
    } else {
      this.#uiManager.enableBoard();
      this.#uiManager.highlightRestartButton(false);
      this.#updateCurrentPlayer();
    }

    this.#uiManager.updateStats();

    this.#updateHistoryPanel();
  }

  /**
   * Handles hover on a history item
   * @private
   * @param {number} moveIndex - Index of the move in history
   */
  #handleHistoryItemHover(moveIndex) {
    if (this.#isPreviewMode) {
      this.#handleHistoryItemLeave();
    }

    const boardState = this.#connect4.getBoardAtMove(moveIndex);
    if (boardState) {
      this.#savedBoardState = this.#uiManager.saveBoardState();
      this.#uiManager.showBoardPreview(boardState, moveIndex);
      this.#isPreviewMode = true;
    }
  }

  /**
   * Handles mouse leave on a history item
   * @private
   */
  #handleHistoryItemLeave() {
    if (!this.#isPreviewMode) return;

    if (this.#savedBoardState) {
      this.#uiManager.restoreBoardState(this.#savedBoardState);
      this.#savedBoardState = null;
    }

    this.#uiManager.endBoardPreview();
    this.#isPreviewMode = false;
  }

  /**
   * Resets the board UI
   * @private
   */
  #resetBoardUI() {
    this.#uiManager.resetBoard();
  }

  /**
   * Updates the board UI from a board state
   * @private
   * @param {Array<Array<number>>} board - The board state
   */
  #updateBoardFromState(board) {
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        const player = board[row][col];
        if (player !== 0) {
          this.#uiManager.updateCell(row, col, player);
        }
      }
    }
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
        this.#connect4.getCurrentPlayer(),
      );
    }

    this.#updateHistoryPanel();
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

    const undoButton = document.getElementById('undo-move');
    if (undoButton) {
      undoButton.disabled = false;
    }

    this.#updateHistoryPanel();
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

    const undoButton = document.getElementById('undo-move');
    if (undoButton) {
      undoButton.disabled = false;
    }

    this.#updateHistoryPanel();
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

    this.#uiManager.initializeHistoryPanel();
  }

  /**
   * Handles pointer entering a column
   * @private
   * @param {number} column - The column being entered
   */
  #handleColumnEnter(column) {
    if (this.#connect4.isGameOver || this.#connect4.isColumnFull(column))
      return;

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

    if (
      column !== undefined &&
      parseInt(column) !== this.#uiManager.hoveredColumn
    ) {
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
   * Handles a number keypress
   * @private
   * @param {number} key - The number key pressed
   */
  #handleKeyPress(key) {
    if (key == 0) this.#handleMove(9, false);
    else this.#handleMove(key - 1, false);
  }

  /**
   * Handles reset stats button click
   * @private
   */
  #handleResetStats() {
    this.#settingsManager.resetStats();
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
   * Makes a move in a specific column (public method)
   * @param {number} column - The column to make a move in
   */
  makeMove(column) {
    this.#handleMove(column);
  }

  /**
   * Handles undoing a move
   * This function should be connected to the undo button
   */
  undoMove() {
    const lastMove = this.#connect4.getLastMove();
    if (!lastMove) return;

    if (this.#isPreviewMode) this.#handleHistoryItemLeave();

    if (lastMove.type === 'win' || lastMove.type === 'draw') {
      this.#settingsManager.decrementStats(lastMove);
    }

    const undoneMove = this.#connect4.undoMove();
    if (!undoneMove) return;

    this.#uiManager.clearCell(undoneMove.row, undoneMove.column);
    this.#uiManager.enableBoard();
    this.#uiManager.highlightRestartButton(false);
    this.#updateCurrentPlayer();

    if (undoneMove.type === 'win' && undoneMove.winningPositions) {
      this.#uiManager.unhighlightWinningCells(undoneMove.winningPositions);
    }

    this.#uiManager.updateStats();

    this.#updateHistoryPanel();
  }

  /**
   * Cleans up event listeners
   * Used when cleaning up before starting a new game
   */
  cleanupEventListeners() {
    if (this.#connect4) {
      this.#connect4.removeEventListener('move', this.#boundGameHandlers.move);
      this.#connect4.removeEventListener('win', this.#boundGameHandlers.win);
      this.#connect4.removeEventListener('draw', this.#boundGameHandlers.draw);
      this.#connect4.removeEventListener('reset', this.#boundGameHandlers.reset);
    }
  }

  /**
   * Resets the game
   */
  resetGame() {
    if (this.#isPreviewMode) this.#handleHistoryItemLeave();
    this.#connect4.reset();
  }
}
