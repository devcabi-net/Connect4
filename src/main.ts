import { GameHub } from '@core/GameHub';
import { ActivityUI } from '@ui/ActivityUI';
import { Player } from '@core/types';
import './ui/activity.css';

// Modern Discord Activity App
class DiscordConnect4App {
  private gameHub: GameHub;
  private ui: ActivityUI;
  private currentPlayer: Player | null = null;
  private currentView: 'loading' | 'welcome' | 'lobby' | 'game' = 'loading';
  private currentRoom: any = null;

  constructor() {
    this.gameHub = new GameHub();
    this.ui = new ActivityUI('app');
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Game Hub Events
    this.gameHub.on('initialized', (data) => {
      console.log('🎮 Game Hub initialized:', data);
      if (data.discordConnected) {
        // Will trigger playerConnected event
      } else {
        this.ui.showError('Failed to connect to Discord. Please reload the activity.', false);
      }
    });

    this.gameHub.on('playerConnected', (player) => {
      console.log('👤 Player connected:', player);
      this.currentPlayer = player;
      this.showWelcomeScreen();
    });

    this.gameHub.on('playerDisconnected', () => {
      console.log('👤 Player disconnected');
      this.ui.showError('Disconnected from Discord', true);
    });

    this.gameHub.on('roomJoined', (room) => {
      console.log('🏠 Room joined:', room);
      this.currentRoom = room;
      this.showGameRoom();
    });

    this.gameHub.on('roomLeft', () => {
      console.log('🏠 Room left');
      this.currentRoom = null;
      this.showWelcomeScreen();
    });

    this.gameHub.on('gameStateChanged', (gameState) => {
      console.log('🎮 Game state changed:', gameState);
      if (this.currentView === 'game' && this.currentRoom) {
        this.showGameRoom();
      }
    });

    this.gameHub.on('error', (error) => {
      console.error('❌ Game hub error:', error);
      this.ui.showError('Something went wrong. Please try again.', true);
    });

    // UI Events
    this.setupUIEventHandlers();
  }

  private setupUIEventHandlers(): void {
    // Welcome screen events
    document.addEventListener('create-game', () => this.handleCreateGame());
    document.addEventListener('show-lobby', () => this.handleShowLobby());
    
    // Lobby events
    document.addEventListener('create-room', () => this.handleCreateRoom());
    document.addEventListener('refresh-lobby', () => this.handleRefreshLobby());
    
    // Game events
    document.addEventListener('make-move', (e: any) => this.handleMakeMove(e.detail.column));
    document.addEventListener('leave-room', () => this.handleLeaveRoom());
    document.addEventListener('new-game', () => this.handleNewGame());
    
    // Error retry events
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'retry-btn') {
        this.initialize();
      } else if (target.id === 'home-btn') {
        this.showWelcomeScreen();
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Starting Discord Connect 4 Activity...');
      this.ui.showLoadingScreen();
      
      await this.gameHub.initialize();
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.ui.showError('Failed to start the activity. Please reload.', false);
    }
  }

  private showWelcomeScreen(): void {
    if (!this.currentPlayer) {
      console.warn('No current player available');
      return;
    }
    
    this.currentView = 'welcome';
    this.ui.showWelcomeScreen(this.currentPlayer);
  }

  private showLobby(rooms: any[] = []): void {
    if (!this.currentPlayer) {
      console.warn('No current player available');
      return;
    }
    
    this.currentView = 'lobby';
    this.ui.showGameLobby(rooms, this.currentPlayer);
  }

  private showGameRoom(): void {
    if (!this.currentPlayer || !this.currentRoom) {
      console.warn('Missing player or room data');
      return;
    }
    
    this.currentView = 'game';
    const game = this.gameHub.getCurrentGame();
    this.ui.showGameRoom(this.currentRoom, game, this.currentPlayer);
  }

  // Event Handlers
  private async handleCreateGame(): Promise<void> {
    try {
      if (!this.currentPlayer) return;
      
      console.log('🎮 Creating new game...');
      const roomId = this.generateRoomId();
      const success = await this.gameHub.createRoom(roomId);
      
      if (success) {
        console.log('✅ Room created:', roomId);
        // Room joined event will be triggered automatically
      }
    } catch (error) {
      console.error('❌ Failed to create game:', error);
      this.ui.showError('Failed to create game. Please try again.', true);
    }
  }

  private handleShowLobby(): void {
    // For now, show empty lobby since Supabase is disabled in Discord Activities
    this.showLobby([]);
  }

  private async handleCreateRoom(): Promise<void> {
    // Same as create game
    await this.handleCreateGame();
  }

  private handleRefreshLobby(): void {
    // Refresh lobby - for now just re-show empty lobby
    this.showLobby([]);
  }

  private async handleMakeMove(column: number): Promise<void> {
    try {
      if (!this.currentPlayer) return;
      
      console.log(`🎯 Making move at column ${column}`);
      const success = await this.gameHub.makeMove({
        playerId: this.currentPlayer.id,
        data: { column }
      });
      
      if (success) {
        console.log('✅ Move made successfully');
        // Game state will update automatically
      } else {
        console.warn('❌ Invalid move');
      }
    } catch (error) {
      console.error('❌ Failed to make move:', error);
    }
  }

  private async handleLeaveRoom(): Promise<void> {
    try {
      console.log('🚪 Leaving room...');
      await this.gameHub.leaveRoom();
      // Will trigger roomLeft event
    } catch (error) {
      console.error('❌ Failed to leave room:', error);
      // Still show welcome screen as fallback
      this.showWelcomeScreen();
    }
  }

  private async handleNewGame(): Promise<void> {
    try {
      console.log('🔄 Starting new game...');
      // For now, just leave the room and create a new one
      await this.handleLeaveRoom();
      await this.handleCreateGame();
    } catch (error) {
      console.error('❌ Failed to start new game:', error);
    }
  }

  // Utility Methods
  private generateRoomId(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Initializing Discord Connect 4 Activity...');
  const app = new DiscordConnect4App();
  app.initialize();
});
