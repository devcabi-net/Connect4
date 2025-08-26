import { EventEmitter } from './EventEmitter';
import { Lobby } from './Lobby';
import { DiscordService } from '@services/DiscordService';
import { SupabaseService } from '@services/SupabaseService';
import { Player, GameConfig, GameRoom } from './types';
import { Connect4Game } from '@games/Connect4Game';

export class GameHub extends EventEmitter {
  private lobby: Lobby;
  private discordService: DiscordService;
  private supabaseService: SupabaseService;
  private currentPlayer: Player | null = null;
  private currentRoom: string | null = null;

  constructor() {
    super();
    
    // Initialize services
    this.supabaseService = new SupabaseService();
    this.lobby = new Lobby(this.supabaseService);
    
    // Initialize Discord service
    this.discordService = new DiscordService({
      clientId: import.meta.env.VITE_DISCORD_CLIENT_ID || '1407945986424307713',
      scopes: ['identify', 'guilds'],
      forceDiscordMode: import.meta.env.VITE_FORCE_DISCORD_MODE === 'true'
    });

    this.setupEventHandlers();
    this.registerGames();
  }

  private setupEventHandlers(): void {
    // Discord events
    this.discordService.on('connected', (user) => {
      this.currentPlayer = {
        id: user.id,
        name: user.globalName || user.username,
        avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined
      };
      
      this.lobby.addPlayer(this.currentPlayer);
      this.emit('playerConnected', this.currentPlayer);
    });

    this.discordService.on('disconnected', () => {
      if (this.currentPlayer) {
        this.lobby.removePlayer(this.currentPlayer.id);
      }
      this.currentPlayer = null;
      this.emit('playerDisconnected');
    });

    // Lobby events
    this.lobby.on('broadcast', (message) => {
      this.emit('lobbyMessage', message);
    });
  }

  private registerGames(): void {
    // Register Connect 4
    this.lobby.registerGame(new Connect4Game('temp', []).getConfig(), Connect4Game);
    
    // Future games can be registered here:
    // this.lobby.registerGame(new MancalaGame('temp', []).getConfig(), MancalaGame);
    // this.lobby.registerGame(new PongGame('temp', []).getConfig(), PongGame);
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Initializing Game Hub...');
      console.log('Environment Check:', {
        discordClientId: import.meta.env.VITE_DISCORD_CLIENT_ID ? 'Set' : 'Not Set',
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set',
        forceDiscordMode: import.meta.env.VITE_FORCE_DISCORD_MODE
      });
      
      // Initialize Supabase (multiplayer backend)
      console.log('🔗 Initializing Supabase backend...');
      const supabaseConnected = await this.supabaseService.initialize();
      
      // Initialize Discord connection
      console.log('🎮 Initializing Discord service...');
      const discordConnected = await this.discordService.initialize();
      
      console.log(`✅ Game Hub initialized (Discord: ${discordConnected ? 'Connected' : 'Demo Mode'}, Backend: ${supabaseConnected ? 'Supabase' : 'Local Only'})`);
      this.emit('initialized', { 
        discordConnected, 
        backendConnected: supabaseConnected,
        isMultiplayer: supabaseConnected 
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Game Hub:', error);
      this.emit('error', error);
      return false;
    }
  }

  // Game management methods
  getAvailableGames(): GameConfig[] {
    return this.lobby.getAvailableGames();
  }

  async getPublicRooms(): Promise<GameRoom[]> {
    return await this.lobby.getPublicRooms();
  }

  async createRoom(gameType: string, roomName?: string): Promise<string | null> {
    if (!this.currentPlayer) return null;
    
    const roomId = await this.lobby.createRoom(this.currentPlayer.id, gameType, roomName);
    if (roomId) {
      this.currentRoom = roomId;
      this.discordService.updateActivity(`Creating ${gameType} game`, 'Setting up room');
    }
    
    return roomId;
  }

  async joinRoom(roomId: string): Promise<boolean> {
    if (!this.currentPlayer) return false;
    
    const success = await this.lobby.joinRoom(this.currentPlayer.id, roomId);
    if (success) {
      this.currentRoom = roomId;
      const room = await this.lobby.getRoom(roomId);
      if (room) {
        this.discordService.updateActivity(`Joining ${room.gameType} game`, 'Waiting for game to start');
      }
    }
    
    return success;
  }

  leaveRoom(): boolean {
    if (!this.currentPlayer || !this.currentRoom) return false;
    
    const success = this.lobby.leaveRoom(this.currentPlayer.id, this.currentRoom);
    if (success) {
      this.currentRoom = null;
      this.discordService.updateActivity('In lobby', 'Looking for games');
    }
    
    return success;
  }

  setReady(ready: boolean): boolean {
    if (!this.currentPlayer || !this.currentRoom) return false;
    return this.lobby.setPlayerReady(this.currentPlayer.id, this.currentRoom, ready);
  }

  makeMove(moveData: any): boolean {
    if (!this.currentPlayer || !this.currentRoom) return false;
    return this.lobby.makeMove(this.currentPlayer.id, this.currentRoom, moveData);
  }

  // Information getters
  getCurrentPlayer(): Player | null {
    return this.currentPlayer;
  }

  async getCurrentRoom(): Promise<GameRoom | null> {
    return this.currentRoom ? await this.lobby.getRoom(this.currentRoom) : null;
  }

  getCurrentGame(): any {
    return this.currentRoom ? this.lobby.getGame(this.currentRoom) : null;
  }

  isInRoom(): boolean {
    return this.currentRoom !== null;
  }

  getDiscordService(): DiscordService {
    return this.discordService;
  }

  getLobbyStats(): any {
    return this.lobby.getStats();
  }

  // Cleanup
  destroy(): void {
    if (this.currentPlayer) {
      this.lobby.removePlayer(this.currentPlayer.id);
    }
    
    this.discordService.disconnect();
    this.removeAllListeners();
    
    console.log('🧹 Game Hub destroyed');
  }
}
