import { GameHub } from '@core/GameHub';
import './style.css';

// Main application class
class DiscordGameApp {
  private gameHub: GameHub;
  // private currentView: 'loading' | 'lobby' | 'room' | 'game' = 'loading';

  constructor() {
    this.gameHub = new GameHub();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Game Hub events
    this.gameHub.on('initialized', (data) => {
      this.showLobby();
      this.updateConnectionStatus(data.discordConnected);
    });

    this.gameHub.on('playerConnected', (player) => {
      this.updatePlayerInfo(player);
    });

    this.gameHub.on('lobbyMessage', (message) => {
      this.handleLobbyMessage(message);
    });

    this.gameHub.on('error', (error) => {
      console.error('Game Hub Error:', error);
      this.showError('Failed to connect to game services');
    });
  }

  async initialize(): Promise<void> {
    try {
      console.log('🎮 Starting Discord Game App...');
      
      // Show loading screen
      this.showLoading();
      
      // Initialize game hub
      await this.gameHub.initialize();
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to start the application');
    }
  }

  private showLoading(): void {
    // this.currentView = 'loading';
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="loading-screen">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <h2>🎮 Discord Game Hub</h2>
            <p>Connecting to game services...</p>
          </div>
        </div>
      `;
    }
  }

  private showLobby(): void {
    // this.currentView = 'lobby';
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="lobby-screen">
          <header class="lobby-header">
            <div class="header-content">
              <h1>🎮 Discord Game Hub</h1>
              <div class="player-info" id="player-info">
                <div class="player-avatar" id="player-avatar"></div>
                <span id="player-name">Loading...</span>
              </div>
            </div>
            <div class="connection-status" id="connection-status">
              <span class="status-indicator"></span>
              <span class="status-text">Connecting...</span>
            </div>
          </header>

          <main class="lobby-main">
            <div class="lobby-sidebar">
              <h3>🎯 Available Games</h3>
              <div class="game-list" id="game-list">
                Loading games...
              </div>
              
              <div class="lobby-stats" id="lobby-stats">
                <h4>📊 Lobby Stats</h4>
                <div class="stats-content">
                  <div class="stat">
                    <span class="stat-label">Players Online:</span>
                    <span class="stat-value" id="players-count">0</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Active Games:</span>
                    <span class="stat-value" id="games-count">0</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="lobby-content">
              <div class="room-list-section">
                <div class="section-header">
                  <h3>🏠 Open Rooms</h3>
                  <button class="btn btn-primary" id="refresh-rooms">🔄 Refresh</button>
                </div>
                <div class="room-list" id="room-list">
                  <div class="empty-state">
                    <p>No open rooms yet. Create one to get started!</p>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <div class="create-room-modal" id="create-room-modal" style="display: none;">
            <div class="modal-content">
              <div class="modal-header">
                <h3>Create New Room</h3>
                <button class="btn-close" id="close-modal">×</button>
              </div>
              <div class="modal-body">
                <div class="form-group">
                  <label for="game-type">Game Type:</label>
                  <select id="game-type" class="form-control">
                    <option value="">Select a game...</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="room-name">Room Name (optional):</label>
                  <input type="text" id="room-name" class="form-control" placeholder="My awesome game room">
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" id="cancel-create">Cancel</button>
                <button class="btn btn-primary" id="confirm-create">Create Room</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    this.setupLobbyEventHandlers();
    this.loadAvailableGames();
    this.refreshRooms();
    this.updateLobbyStats();
  }

  private setupLobbyEventHandlers(): void {
    // Refresh rooms button
    const refreshButton = document.getElementById('refresh-rooms');
    refreshButton?.addEventListener('click', () => this.refreshRooms());

    // Create room modal
    const gameList = document.getElementById('game-list');
    gameList?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('create-game-btn')) {
        const gameType = target.dataset.gameType;
        if (gameType) {
          this.showCreateRoomModal(gameType);
        }
      }
    });

    // Modal handlers
    // const modal = document.getElementById('create-room-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelCreate = document.getElementById('cancel-create');
    const confirmCreate = document.getElementById('confirm-create');

    closeModal?.addEventListener('click', () => this.hideCreateRoomModal());
    cancelCreate?.addEventListener('click', () => this.hideCreateRoomModal());
    confirmCreate?.addEventListener('click', () => this.handleCreateRoom());

    // Room list click handlers
    const roomList = document.getElementById('room-list');
    roomList?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('join-room-btn')) {
        const roomId = target.dataset.roomId;
        if (roomId) {
          this.joinRoom(roomId);
        }
      }
    });
  }

  private loadAvailableGames(): void {
    const gameList = document.getElementById('game-list');
    if (!gameList) return;

    const games = this.gameHub.getAvailableGames();
    
    if (games.length === 0) {
      gameList.innerHTML = '<p>No games available</p>';
      return;
    }

    gameList.innerHTML = games.map(game => `
      <div class="game-card">
        <div class="game-info">
          <div class="game-icon">${game.thumbnail}</div>
          <div class="game-details">
            <h4>${game.displayName}</h4>
            <p class="game-description">${game.description}</p>
            <div class="game-meta">
              <span class="players">${game.minPlayers}-${game.maxPlayers} players</span>
              <span class="duration">${game.estimatedDuration}</span>
            </div>
          </div>
        </div>
        <button class="btn btn-primary create-game-btn" data-game-type="${game.id}">
          Create Room
        </button>
      </div>
    `).join('');
  }

  private async refreshRooms(): Promise<void> {
    const roomList = document.getElementById('room-list');
    if (!roomList) return;

    const rooms = await this.gameHub.getPublicRooms();
    
    if (rooms.length === 0) {
      roomList.innerHTML = `
        <div class="empty-state">
          <p>No open rooms yet. Create one to get started!</p>
        </div>
      `;
      return;
    }

    roomList.innerHTML = rooms.map(room => `
      <div class="room-card">
        <div class="room-info">
          <h4>${room.name}</h4>
          <div class="room-meta">
            <span class="game-type">${room.gameType}</span>
            <span class="players">${room.players.length}/${room.maxPlayers} players</span>
            <span class="created">${this.formatTime(room.created)}</span>
          </div>
          <div class="room-players">
            ${room.players.map(p => `<span class="player-tag">${p.name}</span>`).join('')}
          </div>
        </div>
        <button class="btn btn-success join-room-btn" data-room-id="${room.id}">
          Join Room
        </button>
      </div>
    `).join('');
  }

  private showCreateRoomModal(gameType: string): void {
    const modal = document.getElementById('create-room-modal');
    const gameTypeSelect = document.getElementById('game-type') as HTMLSelectElement;
    
    if (modal && gameTypeSelect) {
      // Populate game types
      const games = this.gameHub.getAvailableGames();
      gameTypeSelect.innerHTML = games.map(game => 
        `<option value="${game.id}" ${game.id === gameType ? 'selected' : ''}>${game.displayName}</option>`
      ).join('');
      
      modal.style.display = 'flex';
    }
  }

  private hideCreateRoomModal(): void {
    const modal = document.getElementById('create-room-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private async handleCreateRoom(): Promise<void> {
    const gameType = (document.getElementById('game-type') as HTMLSelectElement)?.value;
    const roomName = (document.getElementById('room-name') as HTMLInputElement)?.value;

    if (!gameType) {
      alert('Please select a game type');
      return;
    }

    const roomId = await this.gameHub.createRoom(gameType, roomName || undefined);
    
    if (roomId) {
      this.hideCreateRoomModal();
      console.log(`Created room: ${roomId}`);
      await this.showGameRoom(roomId);
    } else {
      alert('Failed to create room');
    }
  }

  private async joinRoom(roomId: string): Promise<void> {
    const success = await this.gameHub.joinRoom(roomId);
    
    if (success) {
      console.log(`Joined room: ${roomId}`);
      await this.showGameRoom(roomId);
    } else {
      alert('Failed to join room');
    }
  }

  private async showGameRoom(_roomId: string): Promise<void> {
    const room = await this.gameHub.getCurrentRoom();
    
    if (!room) {
      console.error('No room data found');
      return;
    }

    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="game-room">
          <header class="room-header">
            <div class="room-info">
              <h2>🎮 ${room.name}</h2>
              <p>Game: ${room.gameType} • Status: ${room.status}</p>
            </div>
            <button class="btn btn-secondary" id="leave-room">← Leave Room</button>
          </header>

          <div class="room-content">
            <div class="game-area">
              <div class="players-bar">
                ${room.players.map(player => `
                  <div class="player-info ${player.isHost ? 'host' : ''} ${player.isReady ? 'ready' : ''}">
                    <div class="player-avatar">
                      ${player.avatar ? `<img src="${player.avatar}" alt="${player.name}">` : '👤'}
                    </div>
                    <span class="player-name">${player.name}</span>
                    ${player.isHost ? '<span class="host-badge">HOST</span>' : ''}
                    ${player.isReady ? '<span class="ready-badge">✓</span>' : '<span class="not-ready-badge">⏳</span>'}
                  </div>
                `).join('')}
              </div>

              ${room.status === 'waiting' ? `
                <div class="waiting-area">
                  <h3>Waiting for players...</h3>
                  <p>Players: ${room.players.length}/${room.maxPlayers}</p>
                  <div class="waiting-controls">
                    <button class="btn btn-success" id="ready-toggle">
                      ${this.isPlayerReady(room) ? 'Not Ready' : 'Ready'}
                    </button>
                    ${this.isCurrentPlayerHost(room) ? '<button class="btn btn-primary" id="start-game">Start Game</button>' : ''}
                  </div>
                </div>
              ` : room.gameType === 'connect4' ? `
                <div class="connect4-game">
                  <div id="connect4-board" class="connect4-board">
                    <!-- Game board will be rendered here -->
                  </div>
                </div>
              ` : `
                <div class="game-placeholder">
                  <p>Game interface for ${room.gameType} coming soon!</p>
                </div>
              `}
            </div>

            <div class="room-sidebar">
              <div class="room-chat">
                <h4>Room Chat</h4>
                <div class="chat-messages" id="chat-messages">
                  <div class="system-message">Welcome to ${room.name}!</div>
                </div>
                <div class="chat-input">
                  <input type="text" id="chat-input" placeholder="Type a message...">
                  <button id="send-chat">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Set up room event handlers
      this.setupRoomEventHandlers();
      
      // If game is already playing, render the game
      if (room.status === 'playing' && room.gameType === 'connect4') {
        this.renderConnect4Game();
      }
    }
  }

  private setupRoomEventHandlers(): void {
    const leaveButton = document.getElementById('leave-room');
    const readyToggle = document.getElementById('ready-toggle');
    const startGame = document.getElementById('start-game');
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const sendChat = document.getElementById('send-chat');

    leaveButton?.addEventListener('click', () => {
      if (confirm('Are you sure you want to leave this room?')) {
        this.gameHub.leaveRoom();
        this.showLobby();
      }
    });

    readyToggle?.addEventListener('click', async () => {
      const room = await this.gameHub.getCurrentRoom();
      const isReady = this.isPlayerReady(room);
      this.gameHub.setReady(!isReady);
      setTimeout(async () => await this.showGameRoom(room?.id || ''), 100);
    });

    startGame?.addEventListener('click', () => {
      // Start game logic would go here
      console.log('Starting game...');
    });

    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendChatMessage(chatInput.value);
        chatInput.value = '';
      }
    });

    sendChat?.addEventListener('click', () => {
      if (chatInput.value.trim()) {
        this.sendChatMessage(chatInput.value);
        chatInput.value = '';
      }
    });
  }

  private renderConnect4Game(): void {
    // This would implement the Connect4 game UI
    console.log('Rendering Connect4 game...');
  }

  private isPlayerReady(room: any): boolean {
    const currentPlayer = this.gameHub.getCurrentPlayer();
    const player = room?.players.find((p: any) => p.id === currentPlayer?.id);
    return player?.isReady || false;
  }

  private isCurrentPlayerHost(room: any): boolean {
    const currentPlayer = this.gameHub.getCurrentPlayer();
    const player = room?.players.find((p: any) => p.id === currentPlayer?.id);
    return player?.isHost || false;
  }

  private sendChatMessage(message: string): void {
    const chatMessages = document.getElementById('chat-messages');
    const currentPlayer = this.gameHub.getCurrentPlayer();
    
    if (chatMessages && currentPlayer) {
      const messageElement = document.createElement('div');
      messageElement.className = 'chat-message';
      messageElement.innerHTML = `
        <span class="message-author">${currentPlayer.name}:</span>
        <span class="message-text">${message}</span>
      `;
      chatMessages.appendChild(messageElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  private updateConnectionStatus(connected: boolean): void {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    if (statusIndicator && statusText) {
      if (connected) {
        statusIndicator.className = 'status-indicator connected';
        statusText.textContent = 'Connected to Discord';
      } else {
        statusIndicator.className = 'status-indicator demo';
        statusText.textContent = 'Demo Mode';
      }
    }
  }

  private updatePlayerInfo(player: any): void {
    const playerName = document.getElementById('player-name');
    const playerAvatar = document.getElementById('player-avatar');
    
    if (playerName) {
      playerName.textContent = player.name;
    }
    
    if (playerAvatar && player.avatar) {
      playerAvatar.innerHTML = `<img src="${player.avatar}" alt="${player.name}" class="avatar-img">`;
    }
  }

  private updateLobbyStats(): void {
    const stats = this.gameHub.getLobbyStats();
    
    const playersCount = document.getElementById('players-count');
    const gamesCount = document.getElementById('games-count');
    
    if (playersCount) playersCount.textContent = stats.totalPlayers.toString();
    if (gamesCount) gamesCount.textContent = stats.gamesInProgress.toString();
    
    // Update stats every 5 seconds
    setTimeout(() => this.updateLobbyStats(), 5000);
  }

  private handleLobbyMessage(message: any): void {
    console.log('Lobby message:', message);
    
    switch (message.type) {
      case 'game_created':
      case 'player_joined':
      case 'player_left':
        this.refreshRooms();
        break;
      case 'game_started':
        // TODO: Handle game start
        break;
    }
  }

  private showError(message: string): void {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="error-screen">
          <div class="error-content">
            <h2>❌ Error</h2>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
          </div>
        </div>
      `;
    }
  }

  private formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new DiscordGameApp();
  app.initialize();
});

// Make it available globally for debugging
(window as any).gameApp = DiscordGameApp;
