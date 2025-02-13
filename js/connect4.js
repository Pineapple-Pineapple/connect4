export class Connect4Game {
  constructor(rows, cols, players) {
    this.rows = rows
    this.cols = cols
    this.players = players
    this.currentPlayerIndex = 0
    this.board = Array.from({ length: rows }, () => 
      Array(cols).fill(null)
    )
    this.gameOver = false
    this.history = []
  }

  dropToken(col) {
    if (this.gameOver) return false
    for (let row = this.rows - 1; row >= 0; row--) {
      if (this.board[row][col] === null) {
        this.board[row][col] = this.currentPlayerIndex
        this.history.push({ row, col, player: this.currentPlayerIndex })
        if (this.checkWin(row, col)) {
          this.gameOver = true
        } else {
          this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length
        }
      }
      return { row, col, player: this.board[row][col] }
    }

    return null
  }

  undo() {
    if (this.history.length === 0) return false
    const lastMove = this.history.pop()
    this.board[lastMove.row][lastMove.col] = null
    this.currentPlayerIndex = lastMove.player
    this.gameOver = false
  }

  checkWin(row, col) {
    const dirs = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 1, dc: 1 },
      { dr: 1, dc: -1 }
    ]
    const currentPlayer = this.board[row][col]

    for (const { dr, dc } of dirs) {
      let count = 1
      const winningCells = [[row, col]]

      for (let i = 1; i < 4; i++) {
        const nr = row + dr * i
        const nc = col + dc * i
        if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols || this.board[nr][nc] !== currentPlayer) break

        count++
        winningCells.push([nr, nc])
      }

      for (let i = 1; i < 4; i++) {
        const nr = row - dr * i
        const nc = col - dc * i
        if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols || this.board[nr][nc] !== currentPlayer) break

        count++
        winningCells.push([nr, nc])
      }

      if (count >= 4) {
        this.winningCells = winningCells
        return true
      }
    }

    return false
  }

  saveState() {
    const state = {
      rows: this.rows,
      cols: this.cols,
      board: this.board,
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      history: this.history,
      gameOver: this.gameOver,
      winningCells: this.winningCells || null
    }
    localStorage.setItem("connect4State", JSON.stringify(state))
  }

  clone() {
    const clone = new Connect4Game(this.rows, this.cols, this.players)
    clone.currentPlayerIndex = this.currentPlayerIndex
    clone.gameOver = this.gameOver
    clone.board = this.board.map(row => row.slice())
    clone.winningCells = this.winningCells ? this.winningCells.slice() : null
    return clone
  }

  static loadState() {
    const stateStr = localStorage.getItem("connect4State")
    if (!stateStr) return null
    const state = JSON.parse(stateStr)
    const game = new Connect4Game(state.rows, state.cols, state.players)
    game.board = state.board
    game.currentPlayerIndex = state.currentPlayerIndex
    game.history = state.history
    game.gameOver = state.gameOver
    game.winningCells = state.winningCells
    return game
  }
}
