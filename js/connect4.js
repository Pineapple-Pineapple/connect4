export class Connect4 {
  constructor(rows = 6, cols = 7) {
    this.rows = rows;
    this.cols = cols;
    this.reset();
  }

  reset() {
    this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
    this.moves = [];
    this.winningCells = [];
    this.isGameOver = false;
    this.isDraw = false;
    this.winner = null;
  }

  getBoard() {
    return this.board;
  }

  getCurrentPlayer() {
    return this.moves.length % 2 + 1;
  }

  makeMove(column) {
    if (this.isGameOver || !this.isValidMove(column)) return null;

    const row = this.getLowestEmptyRow(column);
    if (row === -1) return null;

    const player = this.getCurrentPlayer();
    this.board[row][column] = player;
    this.moves.push(column);

    const result = { row, column, player, type: "move" }
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

  isValidMove(column) {
    return column >= 0 && column < this.cols && this.board[0][column] === 0;
  }

  getLowestEmptyRow(column) {
    for (let row = this.rows - 1; row >= 0; row--) {
      if (this.board[row][column] === 0) return row;
    }
    return -1;
  }

  checkWin(row, col) {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    return directions.some(([dr, dc]) => 
      this.checkDirection(row, col, dr, dc)
    );
  }

  checkDirection(row, col, dr, dc) {
    const player = this.board[row][col];
    let count = 1;

    let r = row + dr, c = col + dc;
    while (this.isValidCell(r, c) && this.board[r][c] === player) {
      count ++;
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (this.isValidCell(r, c) && this.board[r][c] === player) {
      count ++;
      r -= dr;
      c -= dc;
    }

    if (count >= 4) {
      this.winningCells = this.getWinningCells(row, col, dr, dc);
      return true
    }

    return false;
  }

  isValidCell(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  getWinningCells(row, col, dr, dc) {
    const cells = [[row, col]];
    let r = row + dr, c = col + dc;
    while (this.isValidCell(r, c) && this.board[r][c] === this.board[row][col]) {
      cells.push([r, c]);
      r += dr;
      c += dc;
    }

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