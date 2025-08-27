import { Player } from '@core/types';

export class ActivityUI {
  private container: HTMLElement;
  
  constructor(containerId: string = 'app') {
    this.container = document.getElementById(containerId) || document.body;
  }

  showLoadingScreen(): void {
    this.container.innerHTML = `
      <div class="activity-screen">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <h2>🎮 Connect 4</h2>
          <p>Connecting to Discord...</p>
        </div>
      </div>
    `;
  }

  showWelcomeScreen(player: Player): void {
    this.container.innerHTML = `
      <div class="activity-screen">
        <header class="activity-header">
          <div class="player-info">
            <div class="player-avatar">
              ${player.avatar 
                ? `<img src="${player.avatar}" alt="${player.name}" class="avatar-img">` 
                : `<div class="avatar-placeholder">${player.name[0]}</div>`
              }
            </div>
            <div class="player-details">
              <h3>${player.name}</h3>
              <span class="connection-status">🟢 Connected</span>
            </div>
          </div>
        </header>
        
        <main class="activity-main">
          <div class="welcome-card">
            <div class="game-icon">🔴🟡</div>
            <h1>Connect 4</h1>
            <p class="game-description">Drop discs to get four in a row and win!</p>
            
            <div class="action-buttons">
              <button class="btn btn-primary" id="create-game-btn">
                <span class="btn-icon">➕</span>
                Create Game
              </button>
              <button class="btn btn-secondary" id="join-game-btn">
                <span class="btn-icon">🔗</span>
                Join Game
              </button>
            </div>
          </div>
          
          <div class="stats-card">
            <h3>Quick Stats</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">0</span>
                <span class="stat-label">Games Played</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">0</span>
                <span class="stat-label">Wins</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">-</span>
                <span class="stat-label">Win Rate</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
    
    this.setupEventListeners();
  }

  showGameLobby(rooms: any[], player: Player): void {
    const roomsHTML = rooms.length > 0 
      ? rooms.map(room => `
          <div class="room-card" data-room-id="${room.id}">
            <div class="room-info">
              <h4>${room.name}</h4>
              <span class="room-players">${room.players}/${room.maxPlayers} players</span>
              <span class="room-status status-${room.status}">${room.status}</span>
            </div>
            <button class="btn btn-small" onclick="joinRoom('${room.id}')">Join</button>
          </div>
        `).join('')
      : `
          <div class="empty-state">
            <span class="empty-icon">🎮</span>
            <p>No active games</p>
            <small>Create a game to get started!</small>
          </div>
        `;

    this.container.innerHTML = `
      <div class="activity-screen">
        <header class="activity-header">
          <div class="player-info">
            <div class="player-avatar">
              ${player.avatar 
                ? `<img src="${player.avatar}" alt="${player.name}" class="avatar-img">` 
                : `<div class="avatar-placeholder">${player.name[0]}</div>`
              }
            </div>
            <div class="player-details">
              <h3>${player.name}</h3>
              <span class="connection-status">🟢 Connected</span>
            </div>
          </div>
          <button class="btn btn-icon" id="refresh-btn" title="Refresh">🔄</button>
        </header>
        
        <main class="activity-main">
          <div class="lobby-section">
            <div class="section-header">
              <h2>🎮 Game Rooms</h2>
              <button class="btn btn-primary" id="create-room-btn">Create Room</button>
            </div>
            <div class="rooms-container">
              ${roomsHTML}
            </div>
          </div>
        </main>
      </div>
    `;
    
    this.setupLobbyEventListeners();
  }

  showGameRoom(room: any, game: any, player: Player): void {
    const boardHTML = this.generateBoardHTML(game?.board || this.createEmptyBoard());
    const isPlayerTurn = game?.currentPlayer === player.id;
    const gameStatus = this.getGameStatus(game, player);
    
    this.container.innerHTML = `
      <div class="activity-screen">
        <header class="activity-header">
          <div class="game-info">
            <h2>${room.name}</h2>
            <span class="game-status">${gameStatus}</span>
          </div>
          <button class="btn btn-secondary" id="leave-room-btn">Leave Game</button>
        </header>
        
        <main class="activity-main game-main">
          <div class="game-container">
            <div class="game-board-container">
              <div class="current-player-indicator">
                ${isPlayerTurn ? '🔴 Your Turn' : '🟡 Opponent\'s Turn'}
              </div>
              <div class="game-board" id="game-board">
                ${boardHTML}
              </div>
            </div>
            
            <div class="game-sidebar">
              <div class="players-panel">
                <h3>Players</h3>
                <div class="players-list">
                  ${room.players?.map((p: any) => `
                    <div class="player-item ${p.id === player.id ? 'current-player' : ''}">
                      <div class="player-avatar small">
                        ${p.avatar 
                          ? `<img src="${p.avatar}" alt="${p.name}">` 
                          : `<div class="avatar-placeholder">${p.name[0]}</div>`
                        }
                      </div>
                      <span class="player-name">${p.name}</span>
                      <span class="player-disc">${p.id === room.players[0].id ? '🔴' : '🟡'}</span>
                    </div>
                  `).join('') || ''}
                </div>
              </div>
              
              <div class="game-controls">
                <button class="btn btn-secondary" id="new-game-btn">New Game</button>
                <button class="btn btn-outline" id="game-rules-btn">Rules</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
    
    this.setupGameEventListeners(game);
  }

  showError(message: string, canRetry: boolean = true): void {
    this.container.innerHTML = `
      <div class="activity-screen">
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p class="error-message">${message}</p>
          ${canRetry ? `
            <div class="error-actions">
              <button class="btn btn-primary" id="retry-btn">Try Again</button>
              <button class="btn btn-secondary" id="home-btn">Go Home</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private generateBoardHTML(board: number[][]): string {
    let html = '';
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const cell = board[row]?.[col] || 0;
        const cellClass = cell === 1 ? 'red' : cell === 2 ? 'yellow' : 'empty';
        html += `<div class="board-cell ${cellClass}" data-col="${col}"></div>`;
      }
    }
    return html;
  }

  private createEmptyBoard(): number[][] {
    return Array(6).fill(null).map(() => Array(7).fill(0));
  }

  private getGameStatus(game: any, player: Player): string {
    if (!game) return 'Waiting to start...';
    if (game.winner) {
      return game.winner === player.id ? '🎉 You Won!' : '😢 You Lost';
    }
    if (game.isDraw) return '🤝 Draw!';
    return game.currentPlayer === player.id ? 'Your turn' : 'Opponent\'s turn';
  }

  private setupEventListeners(): void {
    const createBtn = document.getElementById('create-game-btn');
    const joinBtn = document.getElementById('join-game-btn');
    
    createBtn?.addEventListener('click', () => {
      this.emit('create-game');
    });
    
    joinBtn?.addEventListener('click', () => {
      this.emit('show-lobby');
    });
  }

  private setupLobbyEventListeners(): void {
    const createRoomBtn = document.getElementById('create-room-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    
    createRoomBtn?.addEventListener('click', () => {
      this.emit('create-room');
    });
    
    refreshBtn?.addEventListener('click', () => {
      this.emit('refresh-lobby');
    });
  }

  private setupGameEventListeners(_game: any): void {
    const gameBoard = document.getElementById('game-board');
    const leaveBtn = document.getElementById('leave-room-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    
    gameBoard?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('board-cell')) {
        const col = parseInt(target.dataset.col || '0');
        this.emit('make-move', { column: col });
      }
    });
    
    leaveBtn?.addEventListener('click', () => {
      this.emit('leave-room');
    });
    
    newGameBtn?.addEventListener('click', () => {
      this.emit('new-game');
    });
  }

  // Simple event emitter
  private emit(event: string, data?: any): void {
    const customEvent = new CustomEvent(event, { detail: data });
    document.dispatchEvent(customEvent);
  }
}
