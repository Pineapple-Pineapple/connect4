export class SettingsManager {
  constructor() {
    this.DEFAULT_SETTINGS = {
      player1: { name: 'Player 1', color: '#fb4934', wins: 0 },
      player2: { name: 'Player 2', color: '#fabd2f', wins: 0 },
      board: { rows: 6, cols: 7, color: '#83a598' },
      draws: 0
    }

    this.settings = this.loadSettings();
  }

  loadSettings() {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : { ...this.DEFAULT_SETTINGS };
  }

  save(updates) {
    const newSettings = { ...this.settings };

    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'object' && value !== null) {
        newSettings[key] = { ...this.settings[key], ...value };
      } else {
        newSettings[key] = value;
      }
    }

    this.settings = newSettings;
    localStorage.setItem('settings', JSON.stringify(this.settings));
  }

  resetStats() {
    this.save({
      player1: { wins: 0 },
      player2: { wins: 0 },
      draws: 0
    });
  }

  getPlayerSettings(playerNum) {
    return { ...this.settings[`player${playerNum}`] };
  }

  getBoardSettings() {
    return { ...this.settings.board };
  }

  getSettings() {
    return { ...this.settings }
  }

  updateStats(result) {
    const updates = {};
    if (result.type === 'win') {
      updates[`player${result.player}`] = {
        wins: this.settings[`player${result.player}`].wins + 1
      };
    } else if (result.type === 'draw') {
      updates.draws = this.settings.draws + 1;
    }

    this.save(updates);
  }
}