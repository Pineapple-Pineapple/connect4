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

        for (const [dRow, dCol] of directions) {
            let count = 1;
            const tempWinningCells = [[row, column]];

            for (let i = 1; i < 4; i++) {
                const newRow = row + i * dRow;
                const newCol = column + i * dCol;
                if (
                    newRow >= 0 &&
                    newRow < this.rows &&
                    newCol >= 0 &&
                    newCol < this.cols &&
                    board[newRow][newCol] === player
                ) {
                    count++;
                    tempWinningCells.push([newRow, newCol]);
                } else {
                    break;
                }
            }

            for (let i = 1; i < 4; i++) {
                const newRow = row - i * dRow;
                const newCol = column - i * dCol;
                if (
                    newRow >= 0 &&
                    newRow < this.rows &&
                    newCol >= 0 &&
                    newCol < this.cols &&
                    board[newRow][newCol] === player
                ) {
                    count++;
                    tempWinningCells.push([newRow, newCol]);
                } else {
                    break;
                }
            }

            if (count >= 4) {
                this.winningCells = tempWinningCells;
                return true;
            }
        }

        return false;
    }

    reset() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.moves = [];
        this.winningCells = [];
        this.isGameOver = false;
        this.isDraw = false;
        this.winner = null;
    }

    getBoard() { return this.board; }
    getMoves() { return [...this.moves]; }
    getIsGameOver() { return this.isGameOver; }
    getIsDraw() { return this.isDraw; }
    getWinningCells() { return this.winningCells; }
}