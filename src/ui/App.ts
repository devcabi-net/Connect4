import { EventEmitter } from '@core/EventEmitter';
import { Player, GameRoom } from '@core/types';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { GameScreen } from './screens/GameScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { ErrorScreen } from './screens/ErrorScreen';

export class App extends EventEmitter {
  private container: HTMLElement;
  private currentScreen: 'loading' | 'welcome' | 'lobby' | 'game' | 'error' = 'loading';
  private currentPlayer: Player | null = null;
  private currentRoom: GameRoom | null = null;
  // Screen components
  private loadingScreen!: LoadingScreen;
  private welcomeScreen!: WelcomeScreen;
  private lobbyScreen!: LobbyScreen;
  private gameScreen!: GameScreen;
  private errorScreen!: ErrorScreen;

  constructor(containerId: string) {
    super();
    this.container = document.getElementById(containerId) || document.body;
    this.initializeScreens();
  }

  private initializeScreens(): void {
    this.loadingScreen = new LoadingScreen();
    this.welcomeScreen = new WelcomeScreen();
    this.lobbyScreen = new LobbyScreen();
    this.gameScreen = new GameScreen();
    this.errorScreen = new ErrorScreen();

    // Set up screen event listeners
    this.setupScreenEvents();
  }

  private setupScreenEvents(): void {
    // Welcome screen events
    this.welcomeScreen.on('createGame', (gameType) => {
      this.emit('createGame', gameType);
    });

    this.welcomeScreen.on('showLobby', () => {
      this.showLobby();
    });

    // Lobby screen events
    this.lobbyScreen.on('createGame', (gameType) => {
      this.emit('createGame', gameType);
    });

    this.lobbyScreen.on('joinGame', (roomId) => {
      this.emit('joinGame', roomId);
    });

    // Game screen events
    this.gameScreen.on('gameAction', (action) => {
      this.emit('gameAction', action);
    });

    this.gameScreen.on('leaveGame', () => {
      this.emit('leaveGame');
    });

    // Error screen events
    this.errorScreen.on('retry', () => {
      this.emit('retry');
    });
  }

  show(): void {
    this.showLoading();
  }

  showLoading(): void {
    this.currentScreen = 'loading';
    this.render();
  }

  setPlayer(player: Player | null): void {
    console.log('🎯 App.setPlayer called with:', player);
    this.currentPlayer = player;
    if (player) {
      console.log('🎯 Showing welcome screen for player:', player.name);
      this.showWelcome();
    } else {
      console.log('🎯 Player disconnected, showing error');
      this.showError('Player disconnected');
    }
  }

  showWelcome(): void {
    console.log('🎯 showWelcome called, currentPlayer:', this.currentPlayer);
    if (!this.currentPlayer) {
      console.log('🎯 No current player, returning early');
      return;
    }
    console.log('🎯 Setting screen to welcome and rendering');
    this.currentScreen = 'welcome';
    this.render();
  }

  showLobby(): void {
    if (!this.currentPlayer) return;
    this.currentScreen = 'lobby';
    this.render();
  }

  showGame(room: GameRoom): void {
    if (!this.currentPlayer) return;
    this.currentRoom = room;
    this.currentScreen = 'game';
    this.render();
  }

  showError(message: string): void {
    this.currentScreen = 'error';
    this.errorScreen.setMessage(message);
    this.render();
  }



  handleLobbyMessage(message: any): void {
    if (this.currentScreen === 'lobby') {
      this.lobbyScreen.handleMessage(message);
    }
  }

  private render(): void {
    // Clear container
    this.container.innerHTML = '';

    // Render current screen
    switch (this.currentScreen) {
      case 'loading':
        this.container.appendChild(this.loadingScreen.render());
        break;
      case 'welcome':
        this.container.appendChild(this.welcomeScreen.render(this.currentPlayer!));
        break;
      case 'lobby':
        this.container.appendChild(this.lobbyScreen.render(this.currentPlayer!));
        break;
      case 'game':
        this.container.appendChild(this.gameScreen.render(this.currentRoom!, this.currentPlayer!));
        break;
      case 'error':
        this.container.appendChild(this.errorScreen.render());
        break;
    }
  }
}
