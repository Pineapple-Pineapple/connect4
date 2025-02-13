import { Connect4Game } from "./connect4.js"
import { Connect4UI } from "./connect4ui.js"

let game = null
let ui = null

document.getElementById("setup-form").addEventListener("submit", (e) => {
  e.preventDefault()

  const player1 = {
    name: document.getElementById("player1-name").value,
    color: document.getElementById("player1-color").value
  }
  const player2 = {
    name: document.getElementById("player2-name").value,
    color: document.getElementById("player2-color").value
  }

  const rows = parseInt(document.getElementById("board-rows").value)
  const cols = parseInt(document.getElementById("board-cols").value)

  game = new Connect4Game(rows, cols, [player1, player2])
  ui = new Connect4UI(game, document.getElementById("game-container"))
  document.getElementById("setup").style.display = "none"
  document.getElementById("game-container").style.display = "block"
  ui.statusEl.textContent = `${game.players[game.currentPlayerIndex].name}'s turn`
  game.saveState()
})

document.getElementById("reset-btn").addEventListener("click", () => {
  localStorage.removeItem("connect4State")
  location.reload()
})

document.getElementById("undo-btn").addEventListener("click", () => {
  game.undo()
  ui.render()
  ui.statusEl.textContent = `${game.players[game.currentPlayerIndex].name}'s turn`
  game.saveState()
})

document.addEventListener("keydown", function (e) {
  if (game && !game.gameOver) {
    const col = parseInt(e.key) - 1
    if (!isNaN(col) && col >= 0 && col < game.cols) {
      ui.handleCellClick(col)
    }
  }
})

window.addEventListener("load", () => {
  const savedGame = Connect4Game.loadState()
  if (savedGame) {
    game = savedGame
    document.getElementById("setup").style.display = "none"
    document.getElementById("game-container").style.display = "block"
    ui = new Connect4UI(game, document.getElementById("game-container"))
    if (game.gameOver) {
      if (game.gameDraw) ui.statusEl.textContent = "It's a Draw!"
      else ui.statusEl.textContent = `${game.players[game.currentPlayerIndex].name} wins!`
    } else {
      ui.statusEl.textContent = `${game.players[game.currentPlayerIndex].name}'s turn`
    }
  }
})
