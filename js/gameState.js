export class GameStateManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.stats = this.loadStats();
  }

  loadStats() {
    return JSON.parse(localStorage.getItem('stats')) || {
      player1Wins: 0,
      player2Wins: 0,
      draws: 0
    };
  }

  saveStats() {
    localStorage.setItem('stats', JSON.stringify(this.stats));
  }

  handleMove(column) {
    const connect4 = this.gameManager.connect4;
    const result = connect4.makeMove(column);

    if (!result) return null;

    if (connect4.getIsGameOver()) {
      if (connect4.getIsDraw()) {
        this.stats.draws++;
      } else {
        this.stats[`player${connect4.getWinner()}Wins`]++;
      }
      this.saveStats();
    }

    return result;
  }

  getStats() {
    return this.stats;
  }

  resetGame() {
    this.gameManager.connect4.reset();
  }

  resetStats() {
    this.stats = {
      player1Wins: 0,
      player2Wins: 0,
      draws: 0
    };
    this.saveStats();
  }

  getCurrentPlayer() {
    return this.gameManager.connect4.getCurrentPlayer();
  }

  getWinner() {
    return this.gameManager.connect4.getWinner();
  }

  getMoveHistory() {
    return this.gameManager.connect4.moves;
  }
}