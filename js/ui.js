export class UIManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.gameContainer = document.getElementById('game-container');
    this.initializeBoard();
  }

  initializeBoard() {
    // Clear and set up initial game elements from template
    const template = document.getElementById('game-template');
    this.gameContainer.innerHTML = template.innerHTML;

    // Get current settings
    const { rows, cols, color } = this.gameManager.settingsManager.getBoardSettings();

    // Set up board grid
    const board = this.gameContainer.querySelector('.board');
    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    board.style.backgroundColor = color;

    // Create cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        cell.addEventListener('click', () => this.handleColumnClick(col));
        cell.addEventListener('mouseenter', () => this.handleColumnHover(col, true));
        cell.addEventListener('mouseleave', () => this.handleColumnHover(col, false));

        board.appendChild(cell);
      }
    }

    // Add event listeners for buttons
    const restartButton = this.gameContainer.querySelector('#restart-game');
    const settingsButton = this.gameContainer.querySelector('#settings');

    restartButton.addEventListener('click', () => this.handleRestart());
    settingsButton.addEventListener('click', () => this.handleSettings());

    this.updateStats();
  }

  updateStats() {
    const stats = this.gameManager.gameStateManager.getStats();
    const player1 = this.gameManager.settingsManager.getPlayerSettings(1);
    const player2 = this.gameManager.settingsManager.getPlayerSettings(2);

    // Update current player
    const currentPlayer = document.getElementById('current-player');
    if (this.gameManager.gameStateManager.getWinner() === null) {
      currentPlayer.textContent = `Current Turn: ${this.getCurrentPlayerName()}`;
    }

    // Update scores
    const player1Score = document.getElementById('player1-score');
    const drawsScore = document.getElementById('draws-score');
    const player2Score = document.getElementById('player2-score');

    player1Score.textContent = `${player1.name}: ${stats.player1Wins}`;
    drawsScore.textContent = `Draws: ${stats.draws}`;
    player2Score.textContent = `${player2.name}: ${stats.player2Wins}`;

    // Update settings stats
    document.getElementById("wins-1-name").textContent = player1.name;
    document.getElementById("wins-1").textContent = stats.player1Wins;
    document.getElementById("wins-2-name").textContent = player2.name;
    document.getElementById("wins-2").textContent = stats.player2Wins;
    document.getElementById("draws").textContent = stats.draws;
  }

  handleColumnClick(col) {
    const result = this.gameManager.gameStateManager.handleMove(col);

    if (!result) return;

    this.updateCell(result.row, result.column, result.player);

    if (this.gameManager.connect4.getIsGameOver()) {
      this.handleGameEnd();
    } else {
      this.updateStats();
    }
  }

  handleColumnHover(col, isEntering) {
    if (this.gameManager.connect4.getIsGameOver()) return;

    const currentPlayer = this.gameManager.gameStateManager.getCurrentPlayer();
    const playerColor = this.gameManager.settingsManager.getPlayerSettings(currentPlayer).color;
    const board = this.gameManager.connect4.getBoard();

    const cells = document.querySelectorAll(`.cell[data-col="${col}"]`);
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row);
      if (board[row][col] === 0) {
        cell.style.backgroundColor = isEntering ?
          this.adjustColorOpacity(playerColor, 0.3) :
          'var(--bg)';
      }
    });
  }

  updateCell(row, col, player) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    const playerColor = this.gameManager.settingsManager.getPlayerSettings(player).color;
    cell.style.backgroundColor = playerColor;
  }

  handleGameEnd() {
    const gameEnd = this.gameContainer.querySelector('.game-end');
    gameEnd.textContent = this.gameManager.connect4.getIsDraw() ?
      "It's a draw!" :
      `${this.getWinner()} wins!`;
    this.updateStats();
  }

  getCurrentPlayerName() {
    const currentPlayer = this.gameManager.gameStateManager.getCurrentPlayer();
    return this.gameManager.settingsManager.getPlayerSettings(currentPlayer).name;
  }

  getWinner() {
    const winner = this.gameManager.gameStateManager.getWinner();
    return this.gameManager.settingsManager.getPlayerSettings(winner).name;
  }

  adjustColorOpacity(color, opacity) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  handleRestart() {
    this.gameManager.handleNewGame();
  }

  handleSettings() {
    this.gameManager.toggleSettings();
  }
}