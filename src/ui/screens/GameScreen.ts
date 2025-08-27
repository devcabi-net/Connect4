import { EventEmitter } from '@core/EventEmitter';
import { Player, GameRoom } from '@core/types';

export class GameScreen extends EventEmitter {
  render(room: GameRoom, player: Player): HTMLElement {
    const container = document.createElement('div');
    container.className = 'game-screen';
    
    container.innerHTML = `
      <div class="game-content">
        <div class="game-header">
          <div class="game-info">
            <h2>${this.getGameIcon(room.gameType)} ${this.getGameName(room.gameType)}</h2>
            <p>Room: ${room.id}</p>
          </div>
          <div class="player-info">
            <img src="${player.avatar || '/default-avatar.png'}" alt="${player.name}" />
            <span>${player.name}</span>
          </div>
        </div>
        
        <div class="game-body">
          <div class="game-board" id="game-board">
            ${this.renderGameBoard(room)}
          </div>
          
          <div class="game-sidebar">
            <div class="game-status">
              <h3>Game Status</h3>
              <div class="status-indicator">
                <span class="status-dot active"></span>
                <span>In Progress</span>
              </div>
            </div>
            
            <div class="players-list">
              <h3>Players</h3>
              ${this.renderPlayersList(room)}
            </div>
            
            <div class="game-actions">
              <button class="btn btn-secondary" id="leave-game-btn">
                <span class="btn-icon">🚪</span>
                Leave Game
              </button>
              <button class="btn btn-primary" id="new-game-btn">
                <span class="btn-icon">🔄</span>
                New Game
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.setupEventListeners(container, room);
    return container;
  }
  
  private renderGameBoard(room: GameRoom): string {
    // This will be different for each game type
    switch (room.gameType) {
      case 'connect4':
        return this.renderConnect4Board(room);
      case 'mancala':
        return this.renderMancalaBoard(room);
      case 'tictactoe':
        return this.renderTicTacToeBoard(room);
      default:
        return '<div class="game-placeholder">Game board loading...</div>';
    }
  }
  
  private renderConnect4Board(_room: GameRoom): string {
    // Simple Connect 4 board for now
    return `
      <div class="connect4-board">
        <div class="board-grid">
          ${Array(6).fill(0).map(() => 
            Array(7).fill(0).map(() => '<div class="cell empty"></div>').join('')
          ).join('')}
        </div>
        <div class="board-controls">
          ${Array(7).fill(0).map((_, i) => 
            `<button class="drop-btn" data-column="${i}">Drop</button>`
          ).join('')}
        </div>
      </div>
    `;
  }
  
  private renderMancalaBoard(_room: GameRoom): string {
    return `
      <div class="mancala-board">
        <div class="mancala-placeholder">
          <h3>Mancala Game</h3>
          <p>Coming soon!</p>
        </div>
      </div>
    `;
  }
  
  private renderTicTacToeBoard(_room: GameRoom): string {
    return `
      <div class="tictactoe-board">
        <div class="tictactoe-placeholder">
          <h3>Tic Tac Toe Game</h3>
          <p>Coming soon!</p>
        </div>
      </div>
    `;
  }
  
  private renderPlayersList(room: GameRoom): string {
    if (!room.players || room.players.length === 0) {
      return '<p>No players joined</p>';
    }
    
    return room.players.map(player => `
      <div class="player-item">
        <img src="${player.avatar || '/default-avatar.png'}" alt="${player.name}" />
        <span>${player.name}</span>
        <span class="player-status">${player.id === room.currentPlayer ? 'Current Turn' : 'Waiting'}</span>
      </div>
    `).join('');
  }
  
  private getGameIcon(gameType: string): string {
    const icons: { [key: string]: string } = {
      connect4: '🔴',
      mancala: '🟡',
      tictactoe: '❌'
    };
    return icons[gameType] || '🎮';
  }
  
  private getGameName(gameType: string): string {
    const names: { [key: string]: string } = {
      connect4: 'Connect 4',
      mancala: 'Mancala',
      tictactoe: 'Tic Tac Toe'
    };
    return names[gameType] || 'Unknown Game';
  }
  
  private setupEventListeners(container: HTMLElement, room: GameRoom): void {
    // Game-specific actions
    if (room.gameType === 'connect4') {
      container.querySelectorAll('.drop-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const column = (e.target as HTMLElement).getAttribute('data-column');
          if (column) {
            this.emit('gameAction', {
              type: 'drop',
              column: parseInt(column),
              gameType: room.gameType
            });
          }
        });
      });
    }
    
    // General game actions
    container.querySelector('#leave-game-btn')?.addEventListener('click', () => {
      this.emit('leaveGame');
    });
    
    container.querySelector('#new-game-btn')?.addEventListener('click', () => {
      this.emit('gameAction', {
        type: 'newGame',
        gameType: room.gameType
      });
    });
  }
}
