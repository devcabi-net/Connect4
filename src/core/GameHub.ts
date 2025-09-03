import { EventEmitter } from './EventEmitter';
import { DiscordService } from '@services/DiscordService';
import { Player, GameRoom } from './types';

export class GameHub extends EventEmitter {
  private discordService: DiscordService;
  private currentPlayer: Player | null = null;
  private currentRoom: string | null = null;

  constructor() {
    super();
    
    // Initialize Discord service
    this.discordService = new DiscordService({
      clientId: import.meta.env.VITE_DISCORD_CLIENT_ID || '1407945986424307713',
      scopes: ['identify', 'guilds', 'rpc.activities.write'],
      forceDiscordMode: import.meta.env.VITE_FORCE_DISCORD_MODE === 'true'
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    console.log('🎯 GameHub setting up event handlers');
    
    // Discord events
    this.discordService.on('connected', (user) => {
      console.log('🎯 GameHub received connected event from DiscordService:', user);
      this.currentPlayer = {
        id: user.id,
        name: user.globalName || user.username,
        avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined
      };
      console.log('🎯 GameHub emitting playerConnected event:', this.currentPlayer);
      this.emit('playerConnected', this.currentPlayer);
    });

    this.discordService.on('disconnected', () => {
      console.log('🎯 GameHub received disconnected event from DiscordService');
      this.currentPlayer = null;
      this.emit('playerDisconnected');
    });
    
    // Debug: Check if events are properly bound
    console.log('🎯 GameHub event handlers set up. Discord service listeners:', {
      hasConnectedListener: this.discordService.listenerCount('connected'),
      hasDisconnectedListener: this.discordService.listenerCount('disconnected')
    });
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Initializing Game Hub...');
      console.log('Environment Check:', {
        discordClientId: import.meta.env.VITE_DISCORD_CLIENT_ID ? 'Set' : 'Not Set',
        forceDiscordMode: import.meta.env.VITE_FORCE_DISCORD_MODE
      });
      
      // Initialize Discord connection with timeout
      console.log('🎮 Initializing Discord service...');
      const discordInitPromise = this.discordService.initialize();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Discord initialization timeout')), 12000)
      );
      
      let discordConnected = false;
      try {
        discordConnected = await Promise.race([discordInitPromise, timeoutPromise]) as boolean;
      } catch (timeoutError) {
        console.warn('⚠️ Discord initialization timed out, continuing with demo mode');
        discordConnected = false;
      }
      
      console.log(`✅ Game Hub initialized (Discord: ${discordConnected ? 'Connected' : 'Demo Mode'})`);
      this.emit('initialized', { 
        discordConnected, 
        backendConnected: false,
        isMultiplayer: false 
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Game Hub:', error);
      this.emit('error', error);
      return false;
    }
  }

  // Game management methods
  async createRoom(gameType: string): Promise<boolean> {
    if (!this.currentPlayer) return false;
    
    try {
      const roomId = Math.random().toString(36).substr(2, 8).toUpperCase();
      const room: GameRoom = {
        id: roomId,
        gameType,
        players: [this.currentPlayer],
        currentPlayer: this.currentPlayer.id,
        status: 'waiting',
        createdAt: new Date().toISOString()
      };
      
      this.currentRoom = roomId;
      this.emit('roomJoined', room);
      this.discordService.updateActivity(`Playing ${gameType}`, 'In game');
      return true;
    } catch (error) {
      console.error('Failed to create room:', error);
      return false;
    }
  }

  async joinRoom(roomId: string): Promise<boolean> {
    if (!this.currentPlayer) return false;
    
    try {
      // For now, create a mock room since we're not using Supabase in Discord Activities
      const room: GameRoom = {
        id: roomId,
        gameType: 'connect4',
        players: [this.currentPlayer],
        currentPlayer: this.currentPlayer.id,
        status: 'waiting',
        createdAt: new Date().toISOString()
      };
      
      this.currentRoom = roomId;
      this.emit('roomJoined', room);
      this.discordService.updateActivity('Playing Connect 4', 'In game');
      return true;
    } catch (error) {
      console.error('Failed to join room:', error);
      return false;
    }
  }

  leaveRoom(): boolean {
    if (!this.currentPlayer || !this.currentRoom) return false;
    
    this.currentRoom = null;
    this.emit('roomLeft');
    this.discordService.updateActivity('In lobby', 'Looking for games');
    return true;
  }

  sendGameAction(action: any): boolean {
    if (!this.currentPlayer || !this.currentRoom) return false;
    
    console.log('🎮 Game action:', action);
    
    // Handle different action types
    switch (action.type) {
      case 'drop':
        // Handle Connect 4 drop
        console.log(`Dropping piece in column ${action.column}`);
        return true;
      case 'newGame':
        // Handle new game request
        console.log('Starting new game');
        return true;
      default:
        console.warn('Unknown action type:', action.type);
        return false;
    }
  }

  // Information getters
  getCurrentPlayer(): Player | null {
    return this.currentPlayer;
  }

  isInRoom(): boolean {
    return this.currentRoom !== null;
  }

  getDiscordService(): DiscordService {
    return this.discordService;
  }

  // Cleanup
  destroy(): void {
    this.discordService.disconnect();
    this.removeAllListeners();
    
    console.log('🧹 Game Hub destroyed');
  }
}
