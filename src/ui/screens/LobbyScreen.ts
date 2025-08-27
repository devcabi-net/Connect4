import { EventEmitter } from '@core/EventEmitter';
import { Player } from '@core/types';

export class LobbyScreen extends EventEmitter {
  private rooms: any[] = [];
  private messages: any[] = [];

  render(player: Player): HTMLElement {
    const container = document.createElement('div');
    container.className = 'lobby-screen';
    
    container.innerHTML = `
      <div class="lobby-content">
        <div class="lobby-header">
          <div class="lobby-title">
            <h2>🏠 Game Lobby</h2>
            <p>Join existing games or create your own</p>
          </div>
          <div class="player-info">
            <img src="${player.avatar || '/default-avatar.png'}" alt="${player.name}" />
            <span>${player.name}</span>
          </div>
        </div>
        
        <div class="lobby-body">
          <div class="lobby-section">
            <div class="section-header">
              <h3>🎮 Available Games</h3>
              <button class="btn btn-sm btn-primary" id="create-game-btn">
                <span class="btn-icon">➕</span>
                Create Game
              </button>
            </div>
            
            <div class="rooms-list" id="rooms-list">
              ${this.renderRooms()}
            </div>
          </div>
          
          <div class="lobby-section">
            <div class="section-header">
              <h3>💬 Activity</h3>
              <button class="btn btn-sm btn-secondary" id="refresh-btn">
                <span class="btn-icon">🔄</span>
                Refresh
              </button>
            </div>
            
            <div class="messages-list" id="messages-list">
              ${this.renderMessages()}
            </div>
          </div>
        </div>
        
        <div class="lobby-footer">
          <button class="btn btn-secondary" id="back-btn">
            <span class="btn-icon">⬅️</span>
            Back to Welcome
          </button>
        </div>
      </div>
    `;
    
    this.setupEventListeners(container);
    return container;
  }
  
  private renderRooms(): string {
    if (this.rooms.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🎮</div>
          <p>No games available</p>
          <p class="empty-subtitle">Create a game to get started!</p>
        </div>
      `;
    }
    
    return this.rooms.map(room => `
      <div class="room-card" data-room-id="${room.id}">
        <div class="room-info">
          <div class="room-game">${this.getGameIcon(room.gameType)} ${room.gameType}</div>
          <div class="room-players">${room.players.length}/2 players</div>
        </div>
        <div class="room-actions">
          <button class="btn btn-sm btn-primary join-btn">Join</button>
        </div>
      </div>
    `).join('');
  }
  
  private renderMessages(): string {
    if (this.messages.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <p>No activity yet</p>
        </div>
      `;
    }
    
    return this.messages.map(message => `
      <div class="message">
        <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
        <span class="message-text">${message.text}</span>
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
  
  handleMessage(message: any): void {
    this.messages.push(message);
    // Keep only last 10 messages
    if (this.messages.length > 10) {
      this.messages = this.messages.slice(-10);
    }
  }
  
  private setupEventListeners(container: HTMLElement): void {
    // Create game button
    container.querySelector('#create-game-btn')?.addEventListener('click', () => {
      this.emit('createGame', 'connect4');
    });
    
    // Join game buttons
    container.querySelectorAll('.join-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const roomCard = (e.target as HTMLElement).closest('.room-card');
        const roomId = roomCard?.getAttribute('data-room-id');
        if (roomId) {
          this.emit('joinGame', roomId);
        }
      });
    });
    
    // Refresh button
    container.querySelector('#refresh-btn')?.addEventListener('click', () => {
      // Trigger refresh - could emit an event here
      location.reload();
    });
    
    // Back button
    container.querySelector('#back-btn')?.addEventListener('click', () => {
      // This will be handled by the App component
    });
  }
}
