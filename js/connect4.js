/**
 * @fileoverview Connect4 game logic implementation that handles game state, 
 * move validation, win detection, and board management.
 * 
 * @typedef {Array<Array<number>>} GameBoard
 * A 2D array representing the game board where:
 * - 0 represents an empty cell
 * - 1 represents Player 1's piece
 * - 2 represents Player 2's piece
 * 
 * @typedef {Object} MoveResult
 * @property {number} row - Row where the piece was placed
 * @property {number} column - Column where the piece was placed
 * @property {number} player - Player who made the move (1 or 2)
 * @property {string} type - Type of move result ('move', 'win', or 'draw')
 * @property {Array<Array<number>>} [winningCells] - Coordinates of winning cells if type is 'win'
 */

/**
 * Core Connect4 game logic class that manages the game board, validates moves,
 * tracks game state, and determines win conditions.
 */
export class Connect4 {
  /**
   * Creates a new Connect4 game with the specified dimensions
   * @param {number} [rows=6] - Number of rows in the game board
   * @param {number} [cols=7] - Number of columns in the game board
   */
  constructor(rows = 6, cols = 7) {
    /** @type {number} Number of rows in the game board */
    this.rows = rows;
    
    /** @type {number} Number of columns in the game board */
    this.cols = cols;
    
    this.reset();
  }

  /**
   * Resets the game to its initial state
   */
  reset() {
    /** @type {GameBoard} 2D array representing the game board */
    this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
    
    /** @type {Array<MoveResult>} History of moves made in the game */
    this.moves = [];
    
    /** @type {Array<Array<number>>} Coordinates of cells that form a winning line */
    this.winningCells = [];
    
    /** @type {boolean} Whether the game has ended */
    this.isGameOver = false;
    
    /** @type {boolean} Whether the game ended in a draw */
    this.isDraw = false;
    
    /** @type {number|null} The player number of the winner (1 or 2), or null if no winner */
    this.winner = null;
  }

  /**
   * Returns a copy of the current game board
   * @returns {GameBoard} The current game board
   */
  getBoard() {
    return this.board;
  }

  /**
   * Determines which player's turn it is
   * @returns {number} The current player (1 or 2)
   */
  getCurrentPlayer() {
    return this.moves.length % 2 + 1;
  }

  /**
   * Makes a move in the specified column
   * @param {number} column - The column to place the piece in (0-indexed)
   * @returns {MoveResult|null} The result of the move, or null if the move is invalid
   */
  makeMove(column) {
    if (this.isGameOver || !this.isValidMove(column)) return null;
    const row = this.getLowestEmptyRow(column);
    if (row === -1) return null;
    
    const player = this.getCurrentPlayer();
    this.board[row][column] = player;
    
    const result = { row, column, player, type: "move" }
    this.moves.push(result);
    
    if (this.checkWin(row, column)) {
      this.isGameOver = true;
      this.winner = player;
      result.type = 'win';
    } else if (this.moves.length === this.rows * this.cols) {
      this.isGameOver = true;
      this.isDraw = true;
      result.type = 'draw';
    }
    
    return result;
  }

  /**
   * Gets information about the last move made
   * @returns {MoveResult|number} The last move with winning cells (if any), or -1 if no moves have been made
   */
  getLastMove() {
    if (this.moves.length === 0) return -1;
    return {
      ...this.moves[this.moves.length - 1],
      winningCells: this.winningCells
    };
  }

  /**
   * Undoes the last move
   * @returns {MoveResult|number} The move that was undone, or -1 if no moves have been made
   */
  undoMove() {
    const lastMove = this.getLastMove();
    if (lastMove === -1) return lastMove;
    
    this.board[lastMove.row][lastMove.column] = 0;
    this.moves.pop();
    this.isGameOver = false;
    this.isDraw = false;
    this.winningCells = [];
    
    return lastMove;
  }

  /**
   * Checks if a move in the specified column is valid
   * @param {number} column - The column to check
   * @returns {boolean} Whether the move is valid
   */
  isValidMove(column) {
    return column >= 0 && column < this.cols && this.board[0][column] === 0;
  }

  /**
   * Checks if a column is full
   * @param {number} column - The column to check
   * @returns {boolean} Whether the column is full
   */
  isColumnFull(column) {
    return this.board[0][column] !== 0;
  }

  /**
   * Finds the lowest empty cell in a column
   * @param {number} column - The column to check
   * @returns {number} The row index of the lowest empty cell, or -1 if the column is full
   */
  getLowestEmptyRow(column) {
    for (let row = this.rows - 1; row >= 0; row--) {
      if (this.board[row][column] === 0) return row;
    }
    return -1;
  }

  /**
   * Checks if the last move resulted in a win
   * @param {number} row - The row of the last move
   * @param {number} col - The column of the last move
   * @returns {boolean} Whether the last move resulted in a win
   */
  checkWin(row, col) {
    const directions = [
      [0, 1],  // horizontal
      [1, 0],  // vertical
      [1, 1],  // diagonal down-right
      [1, -1]  // diagonal down-left
    ];
    
    return directions.some(([dr, dc]) => 
      this.checkDirection(row, col, dr, dc)
    );
  }

  /**
   * Checks for a win in a specific direction
   * @param {number} row - Starting row
   * @param {number} col - Starting column
   * @param {number} dr - Row direction (-1, 0, or 1)
   * @param {number} dc - Column direction (-1, 0, or 1)
   * @returns {boolean} Whether there are 4 or more pieces in a row in this direction
   */
  checkDirection(row, col, dr, dc) {
    const player = this.board[row][col];
    let count = 1;
    
    // Check in the positive direction
    let r = row + dr, c = col + dc;
    while (this.isValidCell(r, c) && this.board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }
    
    // Check in the negative direction
    r = row - dr;
    c = col - dc;
    while (this.isValidCell(r, c) && this.board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }
    
    if (count >= 4) {
      this.winningCells = this.getWinningCells(row, col, dr, dc);
      return true
    }
    
    return false;
  }

  /**
   * Checks if a cell is within the bounds of the board
   * @param {number} row - Row to check
   * @param {number} col - Column to check
   * @returns {boolean} Whether the cell is valid
   */
  isValidCell(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  /**
   * Gets the coordinates of cells that form a winning line
   * @param {number} row - Starting row
   * @param {number} col - Starting column
   * @param {number} dr - Row direction
   * @param {number} dc - Column direction
   * @returns {Array<Array<number>>} Array of [row, col] coordinates of winning cells
   */
  getWinningCells(row, col, dr, dc) {
    const cells = [[row, col]];
    
    // Add cells in the positive direction
    let r = row + dr, c = col + dc;
    while (this.isValidCell(r, c) && this.board[r][c] === this.board[row][col]) {
      cells.push([r, c]);
      r += dr;
      c += dc;
    }
    
    // Add cells in the negative direction
    r = row - dr;
    c = col - dc;
    while (this.isValidCell(r, c) && this.board[r][c] === this.board[row][col]) {
      cells.push([r, c]);
      r -= dr;
      c -= dc;
    }
    
    return cells;
  }
}