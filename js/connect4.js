export class Connect4 {
    constructor(rows = 6, cols = 7) {
        this.rows = rows;
        this.cols = cols;
        this.board = Array(rows).fill().map(() => Array(cols).fill(0));
        this.moves = [];
        this.isGameOver = false;
        this.isDraw = false;
        this.winner = null;
    }

    getNextBoardState(board, column, player) {
        const newBoard = board.map(row => [...row]);
        const row = this.getLowestEmptyRow(board, column);
        
        if (row === -1) return null;
        
        newBoard[row][column] = player;
        return newBoard;
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

    getCurrentPlayer() {
        return (this.moves.length % 2) + 1;
    }

    isValidMove(board, column) {
        return column >= 0 && 
               column < this.cols && 
               board[0][column] === 0;
    }

    getLowestEmptyRow(board, column) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (board[row][column] === 0) {
                return row;
            }
        }
        return -1;
    }

    getWinner() {
      return this.winner;
    }

    isWinningMove(board, row, column) {
        const directions = [
            [0, 1],   // Horizontal
            [1, 0],   // Vertical
            [1, 1],   // Diagonal /
            [1, -1]   // Diagonal \
        ];

        const player = board[row][column];
        
        return directions.some(([dRow, dCol]) => 
            this.countInDirection(board, row, column, dRow, dCol, player) +
            this.countInDirection(board, row, column, -dRow, -dCol, player) - 1 >= 4
        );
    }

    countInDirection(board, row, col, dRow, dCol, player) {
        let count = 0;
        let currentRow = row;
        let currentCol = col;

        while (
            currentRow >= 0 && 
            currentRow < this.rows &&
            currentCol >= 0 && 
            currentCol < this.cols &&
            board[currentRow][currentCol] === player
        ) {
            count++;
            currentRow += dRow;
            currentCol += dCol;
        }

        return count;
    }

    reset() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.moves = [];
        this.isGameOver = false;
        this.isDraw = false;
        this.winner = null;
    }

    getBoard() { return this.board; }
    getMoves() { return [...this.moves]; }
    getIsGameOver() { return this.isGameOver; }
    getIsDraw() { return this.isDraw; }
}