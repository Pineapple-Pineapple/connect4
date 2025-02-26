/**
 * @fileoverview Core connect4 game logic that handles game state,
 * move validation, win detection, and board management
 * 
 * @typedef {Array<Array<Number>>} GameBoard
 * A 2D array representing the game board where:
 *   - 0 represents an empty cell
 *   - 1 represents Player 1's piece
 *   - 2 represents Player 2's piece
 * 
 * @typedef {Object} Position
 * @property {number} row - Row coordinate
 * @property {number} col - Column coordinate
 * 
 * @typedef {'move'|'win'|'draw'} gameResultType
 * 
 * @typedef {Object} MoveResult
 * @property {number} row - Row where piece was placed
 * @property {number} column - Column where piece was placed
 * @property {number} player - Player who made the move (1 or 2)
 * @property {gameResultType} type - Type of move result
 * @property {Array<Position>} [winningPositions] - Winning positions if a player won the game
 * 
 * @typedef {Object} GameEventMap
 * @property {function(MoveResult):void} move - Called when a move is made
 * @property {function(MoveResult):void} win - Called when a player wins
 * @property {function(MoveResult):void} draw - Called when the game ends in a draw
 * @property {function():void} reset - Called when the game is reset
 * @property {function(MoveResult):void} undo - Called when a move is undone
 */

export class Connect4 {
  /**
   * @private
   * @type {GameBoard}
   */
  #board;

  /**
   * @private
   * @type {number}
   */
  #rows;

  /**
   * @private
   * @type {number}
   */
  #columns;

  /**
   * @private
   * @type {Array<MoveResult>}
   */
  #moveHistory = [];

  /**
   * @private
   * @type {Array<Position>}
   */
  #winningPositions = [];

  /**
   * @private
   * @type {boolean}
   */
  #gameOver = false;

  /**
   * @private
   * @type {boolean}
   */
  #isDrawn = false;

  /**
   * @private
   * @type {number|null} 
   */
  #winner = null;

  /**
   * @private
   * @type {Object.<Set<Function>>}
   */
  #eventListeners = {
    move: new Set(),
    win: new Set(),
    draw: new Set(),
    reset: new Set(),
    undo: new Set()
  };

  /**
   * Creates a new board with specified dimensions
   * @param {number} [rows=6] - Number of rows in the board
   * @param {number} [columns=7] - Number of columns in the board
   */
  constructor(rows = 6, columns = 7) {
    this.#rows = rows;
    this.#columns = columns;
    this.reset();
  }

  /**
   * Adds an event listener for game events
   * @param {keyof GameEventMap} event - Event name
   * @param {Function} callback - Function to call when the event occurs
   */
  addEventListener(event, callback) {
    if (this.#eventListeners[event]) {
      this.#eventListeners[event].add(callback);
    }
  }

  /**
   * Removes an event listener
   * @param {keyof GameEventMap} event - Event name
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
   * @param {keyof GameEventMap} event - Event name
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
   * Resets the game to its initial state
   */
  reset() {
    this.#board = Array(this.#rows).fill().map(() => Array(this.#columns).fill(0))
    this.#moveHistory = []
    this.#winningPositions = []
    this.#gameOver = false;
    this.#isDrawn = false;
    this.#winner = null;

    this.#dispatchEvent('reset');
  }

  /**
   * Gets the number of rows in the board
   * @returns {number} - Number of rows
   */
  get rows() {
    return this.#rows;
  }

  /**
   * Gets the number of columns in the board
   * @return {number} - Number of columns
   */
  get columns() {
    return this.#columns;
  }

  /**
   * Gets whether the game is over
   * @returns {boolean} Whether the game is over
   */

  get isGameOver() {
    return this.#gameOver;
  }

  /**
   * Gets whether the game ended in a draw
   * @returns {boolean} Whether the game ended in a draw
   */
  get isDraw() {
    return this.#isDrawn;
  }

  /**
   * @get the winner of the game (1 or 2), or null if no winner
   * @returns {number} The winner
   */
  get winner() {
    return this.#winner;
  }

  /**
   * Gets the winning positions if the game has been won
   * @returns {Array<Position>} Array of winning positions
   */
  get winningPositions() {
    return [ ...this.#winningPositions ];
  }

  /**
   * Returns a copy of the current game board
   * @returns {Array<Array<Number>>} The current game board
   */
  getBoard() {
    return this.#board.map(row => [...row]);
  }

  /**
   * Determine's which player's turn it is
   * @return {number} The current player (1 or 2)
   */
  getCurrentPlayer() {
    return this.#moveHistory.length % 2 + 1;
  }

  /**
   * Makes a move in the specified column
   * @param {number} column - The column to place the piece in (0-indexed)
   * @returns {MoveResult|null} The result of the move, or null if the move is invalid
   */
  makeMove(column) {
    if (this.#gameOver || !this.isValidMove(column)) {
      return null;
    }

    const row = this.getLowestEmptyRow(column);
    if (row === -1) {
      return null;
    }

    const player = this.getCurrentPlayer();
    this.#board[row][column] = player;

    const result = { row, column, player, type: 'move' };
    this.#moveHistory.push(result);

    this.#dispatchEvent('move', result);

    if (this.#checkWin(row, column)) {
      this.#gameOver = true;
      this.#winner = player;
      result.type = 'win';
      result.winningPositions = this.#winningPositions;
      this.#dispatchEvent('win', result);
    } else if (this.#moveHistory.length === this.#rows * this.#columns) {
      this.#gameOver = true;
      this.#isDrawn = true;
      result.type = 'draw';
      this.#dispatchEvent('draw', result);
    }

    return result;
  }

  /**
   * Returns the last move made
   * @returns {(MoveResult & {winningPositions: Array<Position>})|null} The last move with winning positions, or null if no moves
   */
  getLastMove() {
    if (this.#moveHistory.length === 0) return null;

    return {
      ...this.#moveHistory[this.#moveHistory.length - 1],
    };
  }

  /**
   * Undoes the last move
   * @returns {MoveResult|null} The move that was undone, or null if no moves
   */
  undoMove() {
    const lastMove = this.getLastMove();
    if (!lastMove) return null;

    this.#board[lastMove.row][lastMove.column] = 0;

    const undoneMove = this.#moveHistory.pop();
    this.#gameOver = false;
    this.#isDrawn = false;
    this.#winningPositions = [];
    this.#winner = null;

    this.#dispatchEvent('undo', undoneMove);
    return undoneMove;
  }

  /**
   * Checks if a move in a specified column is valid
   * @param {number} column - Column to check (0-indexed)
   * @returns {Boolean} Whether the move is valid
   */
  isValidMove(column) {
    return column >= 0 && column < this.#columns && this.#board[0][column] === 0;
  }

  /**
   * Checks whether a specified column is full
   * @param {number} column - Column to check (0-indexed)
   * @return {Boolean} Whether column is full
   */
  isColumnFull(column) {
    return this.#board[0][column] !== 0;
  }

  /**
   * Finds the lowest empty cell of a column
   * @param {number} column - Column to check (0-indexed)
   * @returns {number} The row index of the lowest empty cell, or -1 if column full
   */
  getLowestEmptyRow(column) {
    for (let row = this.#rows - 1; row >= 0; row--) {
      if (this.#board[row][column] === 0) {
        return row;
      }
    }

    return -1;
  }

  /**
   * Checks if the last move resulted in a win 
   * @private
   * @param {number} row 
   * @param {number} col 
   * @returns {boolean} Whether last move resulted in a win
   */
  #checkWin(row, col) {
    const directions = [
      [0, 1], // Horizontal
      [1, 0], // Vertical
      [1, 1], // Diagonal Down-Right
      [1, -1], // Diagonal Down-Left
    ];

    return directions.some(([dr, dc]) => this.#checkDirection(row, col, dr, dc));
  }

  /**
   * Checks for win in a specified direction
   * @private
   * @param {number} row - Start row
   * @param {number} col - Start column
   * @param {number} dr - Row direction (-1, 0, or 1)
   * @param {number} dc - Column direction (-1, 0, or 1)
   * @returns {boolean} Whether there are 4 or more pieces in specified direction
   */
  #checkDirection(row, col, dr, dc) {
    const player = this.#board[row][col];
    let count = 1;

    let r = row + dr, c = col + dc;
    while (this.#isValidCell(r, c) && this.#board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }

    r = row - dr, c = col - dc
    while (this.#isValidCell(r, c) && this.#board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }

    if (count >= 4) {
      this.#winningPositions = this.#getWinningPositions(row, col, dr, dc);
      return true;
    }

    return false;
  }

  /**
   * Checks if a cell is within the bounds of the board
   * @private
   * @param {number} row - Row to check
   * @param {number} col - Column to check
   * @returns {boolean} Whether the cell is valid
   */
  #isValidCell(row, col) {
    return row >= 0 && row < this.#rows && col >= 0 && col < this.#columns;
  }

  /**
   * Gets the coordinates of the cells that form a winning line
   * @private
   * @param {number} row - Starting row
   * @param {number} col - Starting column
   * @param {number} dr - Row direction (-1, 0, or 1)
   * @param {number} dc - Column direction (-1, 0, or 1)
   * @returns {Array<Position>} Array of positions of winning cells
   */
  #getWinningPositions(row, col, dr, dc) {
    const positions = [{ row, col }];
    const player = this.#board[row][col];

    let r = row + dr, c = col + dc;
    while (this.#isValidCell(r, c) && this.#board[r][c] === player) {
      positions.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
    
    r = row - dr;
    c = col - dc;
    while (this.#isValidCell(r, c) && this.#board[r][c] === player) {
      positions.push({ row: r, col: c });
      r -= dr;
      c -= dc;
    }
    
    return positions;
  }
}