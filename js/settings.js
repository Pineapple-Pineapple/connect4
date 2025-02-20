class SettingsManager {
  constructor() {
    if (!localStorage.getItem("settings")) {
      this.resetToDefaults()
    }

    this.loadSettings()
    this.setupEventListeners()
  }

  get defaultSettings() {
    return {
      player1: {
        name: '',
        color: '#fb4934'
      },
      player2: {
        name: '',
        color: '#fabd2f'
      },
      board: {
        rows: 6,
        columns: 7,
        color: '#83a598'
      }
    }
  }

  get settings() {
    return JSON.parse(localStorage.getItem("settings"))
  }

  resetToDefaults() {
    localStorage.setItem("settings", JSON.stringify(this.defaultSettings))
  }

  updateSettings(newSettings) {
    const current = this.settings
    const updated = { ...current, ...newSettings }
    localStorage.setItem("settings", JSON.stringify(updated))  
  }

  loadSettings() {
    const settings = this.settings

    document.getElementById("name-1").value = settings.player1.name
    document.getElementById("color-1").value = settings.player1.color

    document.getElementById("name-2").value = settings.player2.name
    document.getElementById("color-2").value = settings.player2.color

    document.getElementById("board-rows").value = settings.board.rows
    document.getElementById("board-cols").value = settings.board.columns
    document.getElementById("board-color").value = settings.board.color
  }

  validatePlayerInput(playerNumber) {
    const nameInput = document.getElementById(`name-${playerNumber}`)
    const name = nameInput.value.trim()

    if (name === "") {
      nameInput.setCustomValidity(`Player ${playerNumber} name cannot be empty.`)
    } else {
      const otherPlayerNumber = playerNumber === 1 ? 2 : 1
      const otherName = document.getElementById(`name-${otherPlayerNumber}`).value.trim()

      if (name && otherName && name.toLowerCase() === otherName.toLowerCase()) {
        nameInput.setCustomValidity("Players must have different names.")
      } else {
        nameInput.setCustomValidity("")
      }
    }

    nameInput.reportValidity()
    return nameInput.checkValidity()
  }

  savePlayerSettings(playerNumber) {
    if (!this.validatePlayerInput(playerNumber)) return

    const name = document.getElementById(`name-${playerNumber}`).value
    const color = document.getElementById(`color-${playerNumber}`).value

    this.updateSettings({
      [`player${playerNumber}`]: { name, color }
    })
  }

  validateBoardSettings() {
    const rowsInput = document.getElementById("board-rows")
    const colsInput = document.getElementById("board-cols")

    const rows = parseInt(rowsInput.value)
    const cols = parseInt(colsInput.value)

    let valid = true

    if (rows < 4 || rows > 8) {
      rowsInput.setCustomValidity("Rows must be between 4 and 8.")
      valid = false
    } else {
      rowsInput.setCustomValidity("")
    }

    if (cols < 4 || cols > 8) {
      colsInput.setCustomValidity("Columns must be between 4 and 8.")
      valid = false
    } else {
      colsInput.setCustomValidity("")
    }

    rowsInput.reportValidity()
    colsInput.reportValidity()

    return valid
  }

  saveBoardSettings(event) {
    event.preventDefault()

    if (!this.validateBoardSettings()) return

    const rows = parseInt(document.getElementById("board-rows").value)
    const columns = parseInt(document.getElementById("board-cols").value)
    const color = document.getElementById("board-color").value

    this.updateSettings({
      board: { rows, columns, color }
    })

    this.startGame()
  }

  startGame() {
    document.getElementById("settings-container").style.display = "none"
    document.getElementById("game-container").style.display = "block"
  }

  setupEventListeners() {
    document.getElementById("save-1").addEventListener("click", () => {
      this.savePlayerSettings(1)
    })

    document.getElementById("save-2").addEventListener("click", () => {
      this.savePlayerSettings(2)
    })

    document.getElementById("start-game").addEventListener("click", (e) => {
      this.savePlayerSettings(1)
      this.savePlayerSettings(2)
      this.saveBoardSettings(e)
    })
    
    document.getElementById("name-1").addEventListener("input", () => this.validatePlayerInput(1));
    document.getElementById("name-2").addEventListener("input", () => this.validatePlayerInput(2));
    document.getElementById("board-rows").addEventListener("input", () => this.validateBoardSettings());
    document.getElementById("board-cols").addEventListener("input", () => this.validateBoardSettings());
  }
}

const settingsManager = new SettingsManager()