export class Connect4 {
  constructor(rows = 6, cols = 7) {
    this.rows = rows;
    this.cols = cols;
    this.board = Array(rows).fill().map(() => Array(cols).fill(0));
    this.moves = [];
    this.winningCells = [];
    this.isGameOver = false;
    this.isDraw = false;
    this.winner = null;
  }

  getBoard() {
    return this.board;
  }

  getIsGameOver() {
    return this.isGameOver;
  }

  getIsDraw() {
    return this.isDraw;
  }

  getWinner() {
    return this.winner;
  }

  getWinningCells() {
    return this.winningCells;
  }

  getCurrentPlayer() {
    return this.moves.length % 2 + 1;
  }

  makeMove(column) {
    if (this.isGameOver || !this.isValidMove(this.board, column)) {
      return null;
    }

    const row = this.getLowestEmptyRow(this.board, column);
    if (row === -1) return null;

    const currentPlayer = this.getCurrentPlayer();
    this.board[row][column] = currentPlayer;
    this.moves.push(column);

    if (this.isWinningMove(this.board, row, column)) {
      this.isGameOver = true;
      this.winner = currentPlayer;
      return { row, column, type: 'win', player: currentPlayer };
    }

    if (this.moves.length === this.rows * this.cols) {
      this.isGameOver = true;
      this.isDraw = true;
      return { row, column, type: 'draw', player: currentPlayer };
    }

    return { row, column, type: 'ongoing', player: currentPlayer };
  }

  reset() {
    this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
    this.moves = [];
    this.winningCells = [];
    this.isGameOver = false;
    this.isDraw = false;
    this.winner = null;
  }

  undo(moves = 1) {
    if (this.isGameOver) {
      this.isGameOver = false;
      this.isDraw = false;
      this.winner = null;
      this.winningCells = [];
    }

    for (let i = 0; i < moves; i++) {
      const column = this.moves.pop();
      const row = this.getLowestEmptyRow(this.board, column);
      this.board[row][column] = 0;
    }
  }

  isValidMove(board, column) {
    return column >= 0 && column < this.cols && board[0][column] === 0;
  }

  isValidCell(row, column) {
    return row >= 0 && row < this.rows && column >= 0 && column < this.cols
  }

  getLowestEmptyRow(board, column) {
    for (let row = this.rows - 1; row >= 0; row--) {
      if (board[row][column] === 0) {
        return row;
      }
    }
    return -1;
  }

  isWinningMove(board, row, column) {
    return (
      this.checkDirection(board, row, column, 0, 1) ||  // Horizontal
      this.checkDirection(board, row, column, 1, 0) ||  // Vertical
      this.checkDirection(board, row, column, 1, 1) ||  // Diagonal down-right
      this.checkDirection(board, row, column, 1, -1)     // Diagonal down-left
    );
  }

  checkDirection(board, row, column, deltaRow, deltaCol) {
    const player = board[row][column];
    const winningCells = [[row, column]];

    let [r, c] = [row + deltaRow, column + deltaCol];
    while (this.isValidCell(r, c) && board[r][c] === player) {
      winningCells.push([r, c]);
      r += deltaRow;
      c += deltaCol;
    }

    [r, c] = [row - deltaRow, column - deltaCol];
    while (this.isValidCell(r, c) && board[r][c] === player) {
      winningCells.unshift([r, c]);
      r -= deltaRow;
      c -= deltaCol;
    }

    if (winningCells.length >= 4) {
      this.winningCells = winningCells;
      return true;
    }
    return false;
  }

  static fromString(str) {
    const [rows, cols, movesStr] = str.split(';');
    const connect4 = new Connect4(parseInt(rows), parseInt(cols));
    const moves = movesStr.split(',').map(move => parseInt(move));
    moves.forEach(move => connect4.makeMove(move));
    return connect4;
  }

  toString() {
    return `${this.rows};${this.cols};${this.moves.join(',')}`;
  }

  static fromJSON(json) {
    const { rows, cols, board, moves, isGameOver, isDraw, winner } = JSON.parse(json);
    const connect4 = new Connect4(rows, cols);
    connect4.board = board;
    connect4.moves = moves;
    connect4.isGameOver = isGameOver;
    connect4.isDraw = isDraw;
    connect4.winner = winner;
    return connect4;
  }

  toJSON() {
    return JSON.stringify({
      rows: this.rows,
      cols: this.cols,
      board: this.board,
      moves: this.moves,
      isGameOver: this.isGameOver,
      isDraw: this.isDraw,
      winner: this.winner
    });
  }

  static fromLocalStorage(key) {
    return Connect4.fromJSON(localStorage.getItem(key));
  }

  saveToLocalStorage(key) {
    localStorage.setItem(key, this.toJSON());
    return this;
  }

  static clearLocalStorage(key) {
    localStorage.removeItem(key);
  }
}