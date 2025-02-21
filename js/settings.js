export class SettingsManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.loadSettings();
    }

    loadSettings() {
        // Load or initialize default settings
        this.settings = JSON.parse(localStorage.getItem('settings')) || {
            player1: {
                name: 'Player 1',
                color: '#fb4934'
            },
            player2: {
                name: 'Player 2',
                color: '#fabd2f'
            },
            board: {
                rows: 6,
                cols: 7,
                color: '#83a598'
            }
        };

        // Initialize form with current settings
        this.updateFormWithSettings();
    }

    updateFormWithSettings() {
        // Player 1 settings
        document.getElementById('name-1').value = this.settings.player1.name;
        document.getElementById('color-1').value = this.settings.player1.color;

        // Player 2 settings
        document.getElementById('name-2').value = this.settings.player2.name;
        document.getElementById('color-2').value = this.settings.player2.color;

        // Board settings
        document.getElementById('board-rows').value = this.settings.board.rows;
        document.getElementById('board-cols').value = this.settings.board.cols;
        document.getElementById('board-color').value = this.settings.board.color;

        // Stats
        document.getElementById('wins-1').textContent = this.gameManager.gameStateManager.getStats().player1Wins;
        document.getElementById('wins-2').textContent = this.gameManager.gameStateManager.getStats().player2Wins;
        document.getElementById('draws').textContent = this.gameManager.gameStateManager.getStats().draws;
    }

    savePlayerSettings(playerNum) {
        const name = document.getElementById(`name-${playerNum}`).value;
        const color = document.getElementById(`color-${playerNum}`).value;

        this.settings[`player${playerNum}`] = { name, color };
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    saveBoardSettings() {
        const rows = parseInt(document.getElementById('board-rows').value);
        const cols = parseInt(document.getElementById('board-cols').value);
        const color = document.getElementById('board-color').value;

        this.settings.board = { rows, cols, color };
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    getBoardSettings() {
        const rows = parseInt(document.getElementById('board-rows').value);
        const cols = parseInt(document.getElementById('board-cols').value);
        const color = document.getElementById('board-color').value;

        this.settings.board = { rows, cols, color };
        localStorage.setItem('settings', JSON.stringify(this.settings));
        
        return this.settings.board;
    }

    getPlayerSettings(playerNum) {
        return this.settings[`player${playerNum}`];
    }
}