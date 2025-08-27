// Core type definitions for the game platform

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isHost?: boolean;
  isReady?: boolean;
}

export interface GameRoom {
  id: string;
  gameType: string;
  players: Player[];
  currentPlayer: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
}

export interface GameState {
  gameId: string;
  currentPlayer: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  winner?: string;
  data: any; // Game-specific data
  moves: GameMove[];
  timestamp: Date;
}

export interface GameMove {
  id: string;
  playerId: string;
  type: string;
  data: any; // Move-specific data
  timestamp: Date;
  sequence: number;
}

export interface GameConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: string; // e.g., "5-10 minutes"
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'board' | 'card' | 'arcade' | 'puzzle';
  thumbnail: string;
  rules?: string;
}

export interface LobbyMessage {
  type: 'player_joined' | 'player_left' | 'game_created' | 'game_started' | 'game_ended' | 'move_made' | 'chat_message' | 'game_deleted' | 'player_update';
  data: any;
  timestamp: Date;
  sender?: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  globalName?: string;
}

export interface GameResult {
  gameId: string;
  gameType: string;
  players: Player[];
  winner?: string;
  duration: number; // milliseconds
  moves: number;
  endReason: 'completed' | 'abandoned' | 'timeout';
  timestamp: Date;
}

