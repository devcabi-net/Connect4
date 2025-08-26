import { GameState, GameMove, Player, GameConfig } from './types';
import { EventEmitter } from './EventEmitter';

export abstract class BaseGame extends EventEmitter {
  protected gameId: string;
  protected players: Player[];
  protected currentPlayerIndex: number;
  protected gameState: GameState;
  protected moves: GameMove[];
  protected isStarted: boolean;
  protected isFinished: boolean;
  
  constructor(gameId: string, players: Player[]) {
    super();
    this.gameId = gameId;
    this.players = players;
    this.currentPlayerIndex = 0;
    this.moves = [];
    this.isStarted = false;
    this.isFinished = false;
    
    this.gameState = {
      gameId,
      currentPlayer: players[0]?.id || '',
      players,
      status: 'waiting',
      data: this.initializeGameData(),
      moves: [],
      timestamp: new Date()
    };
  }

  // Abstract methods that each game must implement
  abstract getConfig(): GameConfig;
  abstract initializeGameData(): any;
  abstract isValidMove(move: GameMove, playerId: string): boolean;
  abstract makeMove(move: GameMove): boolean;
  abstract checkGameEnd(): { isGameOver: boolean; winner?: string; reason?: string };
  abstract getGameStateForPlayer(playerId: string): any;
  abstract serialize(): string;
  abstract deserialize(data: string): boolean;

  // Common game methods
  startGame(): boolean {
    if (this.players.length < this.getConfig().minPlayers) {
      return false;
    }
    
    this.isStarted = true;
    this.gameState.status = 'playing';
    this.gameState.timestamp = new Date();
    
    this.emit('gameStarted', this.gameState);
    return true;
  }

  addPlayer(player: Player): boolean {
    if (this.players.length >= this.getConfig().maxPlayers) {
      return false;
    }
    
    if (this.isStarted) {
      return false;
    }
    
    this.players.push(player);
    this.gameState.players = [...this.players];
    
    this.emit('playerJoined', player);
    return true;
  }

  removePlayer(playerId: string): boolean {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return false;
    }
    
    const removedPlayer = this.players.splice(playerIndex, 1)[0];
    this.gameState.players = [...this.players];
    
    // Adjust current player index if needed
    if (this.currentPlayerIndex >= playerIndex) {
      this.currentPlayerIndex = Math.max(0, this.currentPlayerIndex - 1);
    }
    
    this.emit('playerLeft', removedPlayer);
    
    // Check if game should end due to insufficient players
    if (this.isStarted && this.players.length < this.getConfig().minPlayers) {
      this.endGame('abandoned');
    }
    
    return true;
  }

  attemptMove(move: GameMove, playerId: string): boolean {
    // Validate basic conditions
    if (!this.isStarted || this.isFinished) {
      return false;
    }
    
    if (this.gameState.currentPlayer !== playerId) {
      return false;
    }
    
    if (!this.isValidMove(move, playerId)) {
      return false;
    }
    
    // Make the move
    const success = this.makeMove(move);
    if (!success) {
      return false;
    }
    
    // Add move to history
    move.sequence = this.moves.length;
    move.timestamp = new Date();
    this.moves.push(move);
    this.gameState.moves = [...this.moves];
    
    // Check for game end
    const endResult = this.checkGameEnd();
    if (endResult.isGameOver) {
      this.endGame('completed', endResult.winner, endResult.reason);
    } else {
      // Move to next player
      this.nextPlayer();
    }
    
    // Update game state
    this.gameState.timestamp = new Date();
    this.emit('moveMade', move);
    
    return true;
  }

  protected nextPlayer(): void {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.gameState.currentPlayer = this.players[this.currentPlayerIndex].id;
  }

  protected endGame(reason: 'completed' | 'abandoned' | 'timeout', winner?: string, details?: string): void {
    this.isFinished = true;
    this.gameState.status = 'finished';
    this.gameState.winner = winner;
    this.gameState.timestamp = new Date();
    
    this.emit('gameEnded', {
      gameId: this.gameId,
      winner,
      reason,
      details,
      gameState: this.gameState
    });
  }

  getState(): GameState {
    return { ...this.gameState };
  }

  getPlayers(): Player[] {
    return [...this.players];
  }

  getCurrentPlayer(): Player | null {
    return this.players[this.currentPlayerIndex] || null;
  }

  getMoves(): GameMove[] {
    return [...this.moves];
  }

  isPlayerTurn(playerId: string): boolean {
    return this.gameState.currentPlayer === playerId;
  }

  getGameId(): string {
    return this.gameId;
  }

  hasPlayer(playerId: string): boolean {
    return this.players.some(p => p.id === playerId);
  }

  canStart(): boolean {
    return !this.isStarted && 
           this.players.length >= this.getConfig().minPlayers &&
           this.players.length <= this.getConfig().maxPlayers;
  }
}
