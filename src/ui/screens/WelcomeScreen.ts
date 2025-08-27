import { EventEmitter } from '@core/EventEmitter';
import { Player } from '@core/types';

export class WelcomeScreen extends EventEmitter {
  render(player: Player): HTMLElement {
    const container = document.createElement('div');
    container.className = 'welcome-screen';
    
    container.innerHTML = `
      <div class="welcome-content">
        <div class="welcome-header">
          <div class="player-info">
            <div class="player-avatar">
              <img src="${player.avatar || '/default-avatar.png'}" alt="${player.name}" />
            </div>
            <div class="player-details">
              <h1 class="player-name">Welcome, ${player.name}!</h1>
              <p class="player-status">Ready to play</p>
            </div>
          </div>
        </div>
        
        <div class="welcome-body">
          <div class="game-hub-title">
            <h2>🎮 Game Hub</h2>
            <p>Choose your game and start playing with friends</p>
          </div>
          
          <div class="game-options">
            <div class="game-card" data-game="connect4">
              <div class="game-icon">🔴</div>
              <h3>Connect 4</h3>
              <p>Classic strategy game</p>
            </div>
            
            <div class="game-card" data-game="mancala">
              <div class="game-icon">🟡</div>
              <h3>Mancala</h3>
              <p>Ancient board game</p>
            </div>
            
            <div class="game-card" data-game="tictactoe">
              <div class="game-icon">❌</div>
              <h3>Tic Tac Toe</h3>
              <p>Simple and fun</p>
            </div>
          </div>
          
          <div class="welcome-actions">
            <button class="btn btn-primary" id="create-game-btn">
              <span class="btn-icon">🎮</span>
              Create Game
            </button>
            <button class="btn btn-secondary" id="show-lobby-btn">
              <span class="btn-icon">🏠</span>
              View Lobby
            </button>
          </div>
        </div>
      </div>
    `;
    
    this.setupEventListeners(container);
    return container;
  }
  
  private setupEventListeners(container: HTMLElement): void {
    // Game card selection
    container.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        const gameType = card.getAttribute('data-game');
        if (gameType) {
          this.emit('createGame', gameType);
        }
      });
    });
    
    // Button actions
    container.querySelector('#create-game-btn')?.addEventListener('click', () => {
      this.emit('createGame', 'connect4'); // Default to Connect 4
    });
    
    container.querySelector('#show-lobby-btn')?.addEventListener('click', () => {
      this.emit('showLobby');
    });
  }
}
