import { EventEmitter } from './EventEmitter';
import { GameRoom, Player, GameConfig, LobbyMessage } from './types';
import { BaseGame } from './BaseGame';
import { SupabaseService } from '@services/SupabaseService';
import { nanoid } from 'nanoid';

interface GameConstructor {
  new (gameId: string, players: Player[]): BaseGame;
}

export class Lobby extends EventEmitter {
  private rooms: Map<string, GameRoom>;
  private games: Map<string, BaseGame>;
  private players: Map<string, Player>;
  private gameRegistry: Map<string, { constructor: GameConstructor; config: GameConfig }>;
  private supabaseService: SupabaseService | null;

  constructor(supabaseService?: SupabaseService) {
    super();
    this.rooms = new Map();
    this.games = new Map();
    this.players = new Map();
    this.gameRegistry = new Map();
    this.supabaseService = supabaseService || null;
    
    // Set up Supabase event handlers if available
    if (this.supabaseService) {
      this.setupSupabaseEventHandlers();
    }
  }

  private setupSupabaseEventHandlers(): void {
    if (!this.supabaseService) return;

    // Listen for room updates from other clients
    this.supabaseService.on('roomUpdate', (payload) => {
      this.handleRoomUpdate(payload);
    });

    // Listen for player updates from other clients
    this.supabaseService.on('playerUpdate', (payload) => {
      this.handlePlayerUpdate(payload);
    });

    console.log('📡 Supabase event handlers set up');
  }

  private handleRoomUpdate(payload: any): void {
    // Handle real-time room updates from other clients
    console.log('🏠 Room update received:', payload);
    
    switch (payload.eventType) {
      case 'INSERT':
        // New room created by another client
        this.broadcast({
          type: 'game_created',
          data: { room: payload.new },
          timestamp: new Date()
        });
        break;
      case 'DELETE':
        // Room deleted by another client
        this.broadcast({
          type: 'game_deleted',
          data: { roomId: payload.old.id },
          timestamp: new Date()
        });
        break;
    }
  }

  private handlePlayerUpdate(payload: any): void {
    // Handle real-time player updates from other clients
    console.log('👤 Player update received:', payload);
    
    this.broadcast({
      type: 'player_update',
      data: payload,
      timestamp: new Date()
    });
  }

  // Register a new game type
  registerGame(config: GameConfig, gameConstructor: GameConstructor): void {
    this.gameRegistry.set(config.id, { constructor: gameConstructor, config });
    console.log(`🎮 Registered game: ${config.displayName}`);
  }

  // Get all available game types
  getAvailableGames(): GameConfig[] {
    return Array.from(this.gameRegistry.values()).map(g => g.config);
  }

  // Add a player to the lobby
  addPlayer(player: Player): void {
    this.players.set(player.id, player);
    this.broadcast({
      type: 'player_joined',
      data: { player },
      timestamp: new Date(),
      sender: player.id
    });
    
    console.log(`👤 Player joined lobby: ${player.name}`);
  }

  // Remove a player from the lobby
  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Remove from any rooms they're in
    for (const room of this.rooms.values()) {
      this.leaveRoom(playerId, room.id);
    }

    this.players.delete(playerId);
    this.broadcast({
      type: 'player_left',
      data: { playerId, playerName: player.name },
      timestamp: new Date()
    });
    
    console.log(`👤 Player left lobby: ${player.name}`);
  }

  // Create a new game room
  async createRoom(hostId: string, gameType: string, roomName?: string): Promise<string | null> {
    const gameInfo = this.gameRegistry.get(gameType);
    if (!gameInfo) {
      console.error(`❌ Unknown game type: ${gameType}`);
      return null;
    }

    const host = this.players.get(hostId);
    if (!host) {
      console.error(`❌ Player not found: ${hostId}`);
      return null;
    }

    const roomId = nanoid(8);
    const room: GameRoom = {
      id: roomId,
      name: roomName || `${host.name}'s ${gameInfo.config.displayName}`,
      gameType,
      players: [{ ...host, isHost: true, isReady: true }],
      maxPlayers: gameInfo.config.maxPlayers,
      status: 'waiting',
      isPrivate: false,
      created: new Date(),
      lastActivity: new Date()
    };

    // Save to Supabase if available, otherwise local storage
    if (this.supabaseService && this.supabaseService.isConnected()) {
      const success = await this.supabaseService.createRoom(room);
      if (!success) {
        console.error('❌ Failed to create room in Supabase');
        return null;
      }
    } else {
      // Fallback to local storage
      this.rooms.set(roomId, room);
      
      this.broadcast({
        type: 'game_created',
        data: { room },
        timestamp: new Date(),
        sender: hostId
      });
    }

    console.log(`🎮 Created room: ${room.name} (${roomId})`);
    return roomId;
  }

  // Join a game room
  async joinRoom(playerId: string, roomId: string): Promise<boolean> {
    const player = this.players.get(playerId);

    if (!player) {
      console.error(`❌ Player not found: ${playerId}`);
      return false;
    }

    // Get room info from Supabase or local storage
    let room: GameRoom | null = null;
    
    if (this.supabaseService && this.supabaseService.isConnected()) {
      room = await this.supabaseService.getRoom(roomId);
      if (!room) {
        console.log(`❌ Room ${roomId} not found`);
        return false;
      }
      
      // Validate room status
      if (room.status !== 'waiting') {
        console.log(`❌ Cannot join room ${roomId} - game already started`);
        return false;
      }

      if (room.players.length >= room.maxPlayers) {
        console.log(`❌ Cannot join room ${roomId} - room is full`);
        return false;
      }

      if (room.players.some(p => p.id === playerId)) {
        console.log(`❌ Player ${playerId} already in room ${roomId}`);
        return false;
      }

      // Join room in Supabase
      const success = await this.supabaseService.joinRoom(roomId, { ...player, isHost: false, isReady: false });
      if (!success) {
        console.error('❌ Failed to join room in Supabase');
        return false;
      }
    } else {
      // Fallback to local storage
      room = this.rooms.get(roomId) || null;
      if (!room || !player) {
        return false;
      }

      if (room.status !== 'waiting') {
        console.log(`❌ Cannot join room ${roomId} - game already started`);
        return false;
      }

      if (room.players.length >= room.maxPlayers) {
        console.log(`❌ Cannot join room ${roomId} - room is full`);
        return false;
      }

      if (room.players.some(p => p.id === playerId)) {
        console.log(`❌ Player ${playerId} already in room ${roomId}`);
        return false;
      }

      room.players.push({ ...player, isHost: false, isReady: false });
      room.lastActivity = new Date();

      this.broadcast({
        type: 'player_joined',
        data: { room, player },
        timestamp: new Date(),
        sender: playerId
      });
    }

    console.log(`👤 ${player.name} joined room: ${room.name}`);
    return true;
  }

  // Leave a game room
  leaveRoom(playerId: string, roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return false;

    const leavingPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    room.lastActivity = new Date();

    // If the host leaves, assign new host
    if (leavingPlayer.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
    }

    // If no players left, delete the room
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      console.log(`🗑️  Deleted empty room: ${room.name}`);
    }

    this.broadcast({
      type: 'player_left',
      data: { room, playerId, playerName: leavingPlayer.name },
      timestamp: new Date()
    });

    console.log(`👤 ${leavingPlayer.name} left room: ${room.name}`);
    return true;
  }

  // Set player ready status
  setPlayerReady(playerId: string, roomId: string, ready: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;

    player.isReady = ready;
    room.lastActivity = new Date();

    this.broadcast({
      type: 'player_left', // We'll use this for ready status updates too
      data: { room, playerId, ready },
      timestamp: new Date()
    });

    // Check if all players are ready to start
    if (this.canStartGame(roomId)) {
      this.startGame(roomId);
    }

    return true;
  }

  // Start a game
  startGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const gameInfo = this.gameRegistry.get(room.gameType);
    if (!gameInfo) return false;

    if (!this.canStartGame(roomId)) {
      console.log(`❌ Cannot start game in room ${roomId} - not all players ready`);
      return false;
    }

    // Create the game instance
    const game = new gameInfo.constructor(roomId, room.players);
    
    // Set up game event listeners
    game.on('moveMade', (move) => {
      this.broadcast({
        type: 'move_made',
        data: { roomId, move, gameState: game.getState() },
        timestamp: new Date()
      });
    });

    game.on('gameEnded', (result) => {
      room.status = 'finished';
      this.broadcast({
        type: 'game_ended',
        data: { roomId, result },
        timestamp: new Date()
      });
      
      // Clean up after a delay
      setTimeout(() => {
        this.games.delete(roomId);
        this.rooms.delete(roomId);
      }, 30000); // 30 seconds to view results
    });

    this.games.set(roomId, game);
    room.status = 'playing';
    
    if (game.startGame()) {
      this.broadcast({
        type: 'game_started',
        data: { roomId, gameState: game.getState() },
        timestamp: new Date()
      });

      console.log(`🚀 Started game in room: ${room.name}`);
      return true;
    }

    return false;
  }

  // Make a move in a game
  makeMove(playerId: string, roomId: string, moveData: any): boolean {
    const game = this.games.get(roomId);
    if (!game) return false;

    const move = {
      id: nanoid(),
      playerId,
      type: 'game_move',
      data: moveData,
      timestamp: new Date(),
      sequence: 0 // Will be set by the game
    };

    return game.attemptMove(move, playerId);
  }

  // Get all public rooms
  async getPublicRooms(): Promise<GameRoom[]> {
    if (this.supabaseService && this.supabaseService.isConnected()) {
      return await this.supabaseService.getPublicRooms();
    } else {
      // Fallback to local storage
      return Array.from(this.rooms.values())
        .filter(room => !room.isPrivate && room.status === 'waiting')
        .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    }
  }

  // Get room details
  async getRoom(roomId: string): Promise<GameRoom | null> {
    if (this.supabaseService && this.supabaseService.isConnected()) {
      return await this.supabaseService.getRoom(roomId);
    } else {
      // Fallback to local storage
      return this.rooms.get(roomId) || null;
    }
  }

  // Get game instance
  getGame(roomId: string): BaseGame | null {
    return this.games.get(roomId) || null;
  }

  // Get online players
  getOnlinePlayers(): Player[] {
    return Array.from(this.players.values());
  }

  // Check if game can start
  private canStartGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const gameInfo = this.gameRegistry.get(room.gameType);
    if (!gameInfo) return false;

    return room.players.length >= gameInfo.config.minPlayers &&
           room.players.every(p => p.isReady) &&
           room.status === 'waiting';
  }

  // Broadcast message to all players
  private broadcast(message: LobbyMessage): void {
    this.emit('broadcast', message);
  }

  // Get lobby statistics
  getStats(): any {
    return {
      totalPlayers: this.players.size,
      activeRooms: this.rooms.size,
      gamesInProgress: Array.from(this.rooms.values()).filter(r => r.status === 'playing').length,
      registeredGames: this.gameRegistry.size
    };
  }
}
