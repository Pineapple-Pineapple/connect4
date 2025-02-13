export class Connect4UI {
  constructor(game, container) {
    this.game = game
    this.container = container
    this.boardEl = document.getElementById("board")
    this.statusEl = document.getElementById("game-status")
    this.initBoard()
    this.render()
  }

  initBoard() {
    this.boardEl.innerHTML = ""
    this.boardEl.style.gridTemplateColumns = `repeat(${this.game.cols}, 50px)`
    for (let r = 0; r < this.game.rows; r++) {
      for (let c = 0; c < this.game.cols; c++) {
        const cell = document.createElement("div")
        cell.classList.add("cell")
        cell.dataset.row = r
        cell.dataset.col = c
        cell.addEventListener("click", () => this.handleCellClick(c))
        this.boardEl.appendChild(cell)
      }
    }
  }

  handleCellClick(col) {
    if (this.game.gameOver) return
    const move = this.game.dropToken(col)
    if (move) {
      this.animateTokenDrop(move.row, col, this.game.players[move.player].color)
      this.game.saveState()
      this.render()
      if (this.game.gameOver) {
        if (this.game.gameDraw) {
          this.statusEl.textContent = "It's a Draw!"
          return
        }
        this.highlightWin()
        this.statusEl.textContent = `${this.game.players[move.player].name} wins!`
      } else {
        this.statusEl.textContent = `${this.game.players[this.game.currentPlayerIndex].name}'s turn`
      }
    }
  }

  animateTokenDrop(row, col, color) {
    const idx = row * this.game.cols + col
    const cell = this.boardEl.children[idx]
    cell.style.backgroundCOlor = color
    cell.classList.add("token")
  }

  render() {
    for (let r = 0; r < this.game.rows; r++) {
      for (let c = 0; c < this.game.cols; c++) {
        const idx = r * this.game.cols + c
        const cell = this.boardEl.children[idx]
        const playerIdx = this.game.board[r][c]
        if (playerIdx === null) {
          cell.style.backgroundColor = "#fff"
          cell.classList.remove("winning")
        } else {
          cell.style.backgroundColor = this.game.players[playerIdx].color
          cell.classList.remove("winning")
        }
      }
    }
  }

  highlightWin() {
    if (!this.game.winningCells) return
    this.game.winningCells.forEach(([r, c]) => {
      const idx = r * this.game.cols + c
      this.boardEl.children[idx].classList.add("winning")
    })
  }
}
