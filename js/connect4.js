/**
 * @typedef {Array<Array<number | null>>} State
 */

class Connect4 {
  /**
   * @param {Number} rows - Number of rows for the board
   * @param {Number} columns - Number of columns for the board
   * @param {Array<Object>} players - Array of player objects with `id` and `type` (Human or AI)
   */
  constructor(rows, columns, players) {
    this.rows = rows
    this.columns = columns
    this.players = players

    /** @type {State} */
    this.board = Array.from({ length: rows }, () => Array.from({ length: columns }, () => null))
    this.gameOver = false
    this.gameDrawn = false
    this.currentPlayer = 1
    this.winner = null
  }

  /**
   * Toggles the current player
   */
  togglePlayer() {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1
  }

  /**
   * Returns a list of valid moves (columns) for a current state
   * @param {State} state - Current board state
   * @returns {Array<number>} - Array of valid columns indices
   */
  actions(state) {
    return state[0].map((_, c) => c).filter(c => state[0][c] === null)    
  }

  /**
   * Returns the result of an action on a current state (board)
   * @param {State} state - Current board state
   * @param {number} action - Column index to drop piece
   * @returns {State} - New board state
   */
  result(state, action) {
    const newState = state.map(r => [...r])
    for (let r = this.rows - 1; r >= 0; r--) {
      if (newState[r][action] === null) {
        newState[r][actions] = this.currentPlayer
        break
      }
    }

    return newState
  }

  /**
   * Checks if the game is in a terminal state
   * @param {State} state - Current board state
   * @returns {boolean} True if the game is over
   */
  terminal(state) {
    return this.checkWin(state) || this.checkDraw(state)
  }

  /**
   * Calculates the value of a terminal state
   * @param {State} state - Current board state
   * @returns {number} Utility value (1 for win, -1 for loss, 0 for draw)
   */
  utility(state) {
    if (this.checkWin(state)) {
      return this.winner === 1 ? 1 : -1
    }

    return this.checkDraw(state) ? 0 : null
  }

  /**
   * Checks if the last move caused a win
   * @param {number} row - Row index of last move
   * @param {number} col - Column index of last move
   * @returns {boolean} True if last move caused a win
   */
  checkWin(row, col) {
    const player = this.board[row][col]
    if (player === null) return false 
    const dirs = [
      [0, 1], // H
      [1, 0], // V
      [1, 1], // DR
      [1, -1] // DL
    ]

    for (const [dr, dc] of dirs) {
      let count = 1

      for (let i = 1; i < 4; i++) {
        const nr = row + dr * i
        const nc = col + dc * i

        if (nr < 0 || nc < 0 || nr >= this.rows || nc >= this.rows || this.board[nr][nc] !== player) break
        count++
      }

      for (let i = 1; i < 4; i++) {
        const nr = row - dr * i
        const nc = col - dc * i

        if (nr < 0 || nc < 0 || nr >= this.rows || nc >= this.rows || this.board[nr][nc] !== player) break
        count++
      }

      if (count >= 4) {
        this.winner = player
        this.gameOver = true
        return true
      }
    }

    return false
  }
  
  /**
   * Checks for draw condition
   * @param {State} state - Current board state
   * @returns {boolean} True if draw conditions met
   */
  checkDraw(state) {
    const isFull = state[0].every(c => c !== null)
    if (isFull) {
      this.gameDrawn = true
      this.gameOver = true
    }

    return isFull
  }

  /**
   * Makes a move in the game
   * @param {number} column - Column index of the move to make
   * @returns {boolean} True is successful
   */
  makeMove(column) {
    if (this.gameOver || !this.actions(this.board).includes(column)) return false

    this.board = this.result(this.board, column)
    if (!this.terminal(this.board)) {
      this.togglePlayer
    }

    return true
  }

  /**
   * Minimax algorithm with alpha-beta pruning
   * @param {State} state - Current board state
   * @param {number} depth - Search depth
   * @param {number} alpha - Alpha value
   * @param {number} beta - Beta value
   * @param {boolean} maximizing - True if maximizing player
   * @returns {Array<number>} [value, bestMove]
   */
  minimax(state, depth = 5, alpha = -Infinity, beta = Infinity, maximizing = true) {
    if (depth === 0 || this.terminal(state)) {
      return [this.utility(state), null]
    }

    if (maximizing) {
      let maxValue = -Infinity
      let bestAction = null
      for (const action of this.actions(state)) {
        const [value] = this.minimax(this.result(state, action), depth - 1, alpha, beta, false)
        if (value > maxValue) {
          maxValue = value
          bestAction = action
        }

        alpha = Math.max(alpha, value)
        if (alpha >= beta) break
      }

      return [minValue, bestAction]
    } else {
      let minValue = Infinity
      let bestAction = null
      for (const action of this.actions(state)) {
        const [value] = this.minimax(this.result(state, action), depth - 1, alpha, beta, true)
        if (value < minValue) {
          minValue = value
          bestAction = action
        }

        beta = Math.min(beta, value)
        if (alpha >= beta) break
      }

      return [minValue, bestAction]
    }
  }

  /**
   * Gets the optimal AI move using minimax at some depth
   * @param {number} depth - Search depth for minimax
   * @returns {number} Column for AI move
   */
  getAIMove(depth = 5) {
    const [_, move] = this.minimax(this.board, depth)
    return move
  }
}