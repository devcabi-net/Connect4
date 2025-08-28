import { GameHub } from '@core/GameHub';
import { App } from '@ui/App';
import './styles/global.css';

// Modern Discord Activity App
class DiscordGameHub {
  private gameHub: GameHub;
  private app: App;

  constructor() {
    this.gameHub = new GameHub();
    this.app = new App('app');
    this.setupEventHandlers(); // Set up event handlers BEFORE initialization
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Discord Game Hub...');
      
      // Initialize the game hub
      const success = await this.gameHub.initialize();
      
      if (success) {
        console.log('✅ Game Hub initialized successfully');
        this.app.show();
        
        // If no player is connected after initialization, create a demo player
        setTimeout(() => {
          const currentPlayer = this.gameHub.getCurrentPlayer();
          if (!currentPlayer) {
            console.log('🔧 No player connected, creating demo player');
            const demoPlayer = {
              id: `demo_${Math.random().toString(36).substr(2, 9)}`,
              name: `DemoUser${Math.floor(Math.random() * 1000)}`,
              avatar: undefined
            };
            this.app.setPlayer(demoPlayer);
          }
        }, 2000); // Increased timeout to 2 seconds
        

        
        // Additional fallback: If still on loading screen after 5 seconds, force demo mode
        setTimeout(() => {
          const currentPlayer = this.gameHub.getCurrentPlayer();
          if (!currentPlayer) {
            console.log('🔧 Force fallback: Creating demo player after timeout');
            const demoPlayer = {
              id: `demo_${Math.random().toString(36).substr(2, 9)}`,
              name: `DemoUser${Math.floor(Math.random() * 1000)}`,
              avatar: undefined
            };
            this.app.setPlayer(demoPlayer);
          }
        }, 5000);
      } else {
        console.error('❌ Failed to initialize Game Hub');
        this.app.showError('Failed to initialize. Please reload the activity.');
      }
    } catch (error) {
      console.error('❌ Initialization error:', error);
      this.app.showError('An error occurred during initialization.');
    }
  }

  private setupEventHandlers(): void {
    
    // Game Hub Events
    this.gameHub.on('initialized', (data) => {
      console.log('🎮 Game Hub ready:', data);
    });

              this.gameHub.on('playerConnected', (player) => {
            console.log('👤 Player connected:', player.name);
            this.app.setPlayer(player);
          });

    this.gameHub.on('playerDisconnected', () => {
      console.log('👤 Player disconnected');
      this.app.setPlayer(null);
    });

    this.gameHub.on('roomJoined', (room) => {
      console.log('🏠 Room joined:', room);
      this.app.showGame(room);
    });

    this.gameHub.on('roomLeft', () => {
      console.log('🏠 Room left');
      this.app.showLobby();
    });

    this.gameHub.on('lobbyMessage', (message) => {
      console.log('💬 Lobby message:', message);
      this.app.handleLobbyMessage(message);
    });

    this.gameHub.on('error', (error) => {
      console.error('❌ Game Hub error:', error);
      this.app.showError('A connection error occurred.');
    });

    // App Events
    this.app.on('createGame', (gameType) => {
      console.log('🎮 Creating game:', gameType);
      this.gameHub.createRoom(gameType);
    });

    this.app.on('joinGame', (roomId) => {
      console.log('🎮 Joining game:', roomId);
      this.gameHub.joinRoom(roomId);
    });

    this.app.on('leaveGame', () => {
      console.log('🎮 Leaving game');
      this.gameHub.leaveRoom();
    });

    this.app.on('gameAction', (action) => {
      console.log('🎮 Game action:', action);
      this.gameHub.sendGameAction(action);
    });
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new DiscordGameHub();
});
