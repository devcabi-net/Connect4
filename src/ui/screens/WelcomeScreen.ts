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
              <div class="game-status">Available</div>
            </div>
            
            <div class="game-card" data-game="mancala">
              <div class="game-icon">🟡</div>
              <h3>Mancala</h3>
              <p>Ancient board game</p>
              <div class="game-status coming-soon">Coming Soon</div>
            </div>
            
            <div class="game-card" data-game="tictactoe">
              <div class="game-icon">❌</div>
              <h3>Tic Tac Toe</h3>
              <p>Simple and fun</p>
              <div class="game-status coming-soon">Coming Soon</div>
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
        const statusElement = card.querySelector('.game-status');
        const isComingSoon = statusElement?.classList.contains('coming-soon');
        
        if (gameType && !isComingSoon) {
          this.emit('createGame', gameType);
        } else if (isComingSoon && gameType) {
          // Show a subtle notification for coming soon games
          this.showComingSoonNotification(gameType);
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
  
  private showComingSoonNotification(gameType: string): void {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-secondary);
      color: var(--text-primary);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = `${gameType.charAt(0).toUpperCase() + gameType.slice(1)} coming soon!`;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}
