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
    const player1Color = this.gameManager.settingsManager.getPlayerSettings(1).color;
    const player2Color = this.gameManager.settingsManager.getPlayerSettings(2).color;

    document.documentElement.style.setProperty('--player1-color', player1Color);
    document.documentElement.style.setProperty('--player2-color', player2Color);

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
    const playerColor = document.getElementById('player-color');
    if (this.gameManager.gameStateManager.getWinner() === null) {
      currentPlayer.textContent = this.getCurrentPlayerName();
      playerColor.style.backgroundColor = this.getCurrentPlayerColor();
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
      this.handleColumnHover(col, false, true);
      this.handleGameEnd();
    } else {
      this.handleColumnHover(col, true);
      this.updateStats();
    }
  }

  handleColumnHover(col, isEntering, finalMove = false) {
      if (this.gameManager.connect4.getIsGameOver() && !finalMove) return;

      const currentPlayer = this.gameManager.gameStateManager.getCurrentPlayer();
      const board = this.gameManager.connect4.getBoard();
      const lowestEmptyRow = this.gameManager.connect4.getLowestEmptyRow(board, col);

      if (lowestEmptyRow !== -1) {
          const cell = document.querySelector(`.cell[data-row="${lowestEmptyRow}"][data-col="${col}"]`);
          if (isEntering) {
              cell.classList.add(`player${currentPlayer}-hover`);
          } else {
              cell.classList.remove(`player${currentPlayer}-hover`);
          }
      }
  }

  updateCell(row, col, player, winner = false) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add(`player${player}`);
    cell.classList.remove(`player${player}-hover`);
    if (winner) {
      cell.classList.add('winning-cell');
    }
  }

  disableAllCells() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.classList.add('disabled'));
  }

  enableAllCells() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.classList.remove('disabled'));
  }

  handleGameEnd() {
    const gameEnd = this.gameContainer.querySelector('.game-end');
    const isDraw = this.gameManager.connect4.getIsDraw();
    const winningCells = this.gameManager.connect4.getWinningCells();
    gameEnd.textContent = isDraw ? "It's a draw!" : `${this.getWinner()} wins!`;
    if (!isDraw) {
      winningCells.forEach(cell => this.updateCell(cell[0], cell[1], this.gameManager.connect4.getWinner(), true));
    }
    this.updateStats();
    this.disableAllCells();
  }

  getCurrentPlayerName() {
    const currentPlayer = this.gameManager.gameStateManager.getCurrentPlayer();
    return this.gameManager.settingsManager.getPlayerSettings(currentPlayer).name;
  }

  getCurrentPlayerColor() {
    const currentPlayer = this.gameManager.gameStateManager.getCurrentPlayer();
    return this.gameManager.settingsManager.getPlayerSettings(currentPlayer).color
  }

  getWinner() {
    const winner = this.gameManager.gameStateManager.getWinner();
    return this.gameManager.settingsManager.getPlayerSettings(winner).name;
  }

  handleRestart() {
    this.gameManager.handleNewGame();
  }

  handleSettings() {
    this.gameManager.toggleSettings();
  }
}