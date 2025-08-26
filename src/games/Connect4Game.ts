import { BaseGame } from '@core/BaseGame';
import { GameConfig, GameMove } from '@core/types';

interface Connect4Cell {
  row: number;
  col: number;
  player: number;
}

interface Connect4GameData {
  board: number[][];
  rows: number;
  cols: number;
  lastMove?: Connect4Cell;
  winningCells: Connect4Cell[];
  moveCount: number;
}

interface Connect4Move {
  column: number;
}

export class Connect4Game extends BaseGame {
  private static readonly EMPTY = 0;
  private static readonly ROWS = 6;
  private static readonly COLS = 7;
  private static readonly CONNECT_COUNT = 4;

  getConfig(): GameConfig {
    return {
      id: 'connect4',
      name: 'connect4',
      displayName: 'Connect 4',
      description: 'Drop pieces to connect 4 in a row - horizontally, vertically, or diagonally!',
      minPlayers: 2,
      maxPlayers: 2,
      estimatedDuration: '5-10 minutes',
      difficulty: 'easy',
      category: 'board',
      thumbnail: '🔴',
      rules: `
# Connect 4 Rules

## Objective
Be the first player to connect 4 of your pieces in a row - horizontally, vertically, or diagonally.

## How to Play
1. Players take turns dropping colored pieces into columns
2. Pieces fall to the lowest available position in the chosen column
3. First player to get 4 pieces in a row wins!
4. If the board fills up with no winner, it's a draw

## Strategy Tips
- Block your opponent's potential winning moves
- Try to create multiple winning threats at once
- Control the center columns for more opportunities
      `.trim()
    };
  }

  initializeGameData(): Connect4GameData {
    const board: number[][] = [];
    for (let row = 0; row < Connect4Game.ROWS; row++) {
      board[row] = [];
      for (let col = 0; col < Connect4Game.COLS; col++) {
        board[row][col] = Connect4Game.EMPTY;
      }
    }

    return {
      board,
      rows: Connect4Game.ROWS,
      cols: Connect4Game.COLS,
      winningCells: [],
      moveCount: 0
    };
  }

  isValidMove(move: GameMove, _playerId: string): boolean {
    const moveData = move.data as Connect4Move;
    
    // Validate column range
    if (moveData.column < 0 || moveData.column >= Connect4Game.COLS) {
      return false;
    }

    // Check if column is not full
    const gameData = this.gameState.data as Connect4GameData;
    return gameData.board[0][moveData.column] === Connect4Game.EMPTY;
  }

  makeMove(move: GameMove): boolean {
    const moveData = move.data as Connect4Move;
    const gameData = this.gameState.data as Connect4GameData;
    const playerIndex = this.getPlayerIndex(move.playerId);
    
    if (playerIndex === -1) return false;

    // Find the lowest available row in the column
    let targetRow = -1;
    for (let row = Connect4Game.ROWS - 1; row >= 0; row--) {
      if (gameData.board[row][moveData.column] === Connect4Game.EMPTY) {
        targetRow = row;
        break;
      }
    }

    if (targetRow === -1) return false;

    // Place the piece
    const playerNumber = playerIndex + 1; // Convert to 1-based
    gameData.board[targetRow][moveData.column] = playerNumber;
    gameData.lastMove = {
      row: targetRow,
      col: moveData.column,
      player: playerNumber
    };
    gameData.moveCount++;

    this.gameState.data = gameData;
    return true;
  }

  checkGameEnd(): { isGameOver: boolean; winner?: string; reason?: string } {
    const gameData = this.gameState.data as Connect4GameData;
    
    if (!gameData.lastMove) {
      return { isGameOver: false };
    }

    // Check for win from the last move position
    const winResult = this.checkWinFromPosition(
      gameData.lastMove.row,
      gameData.lastMove.col,
      gameData.lastMove.player,
      gameData.board
    );

    if (winResult.hasWin) {
      gameData.winningCells = winResult.winningCells;
      const playerIndex = gameData.lastMove.player - 1; // Convert to 0-based
      const winner = this.players[playerIndex];
      
      return {
        isGameOver: true,
        winner: winner.id,
        reason: `Connected ${Connect4Game.CONNECT_COUNT} pieces!`
      };
    }

    // Check for draw (board full)
    if (this.isBoardFull(gameData.board)) {
      return {
        isGameOver: true,
        reason: 'Board is full - it\'s a draw!'
      };
    }

    return { isGameOver: false };
  }

  getGameStateForPlayer(playerId: string): any {
    const gameData = this.gameState.data as Connect4GameData;
    const playerIndex = this.getPlayerIndex(playerId);
    
    return {
      board: gameData.board.map(row => [...row]), // Deep copy
      isYourTurn: this.isPlayerTurn(playerId),
      playerNumber: playerIndex + 1,
      currentPlayer: this.getCurrentPlayer()?.name || '',
      moveCount: gameData.moveCount,
      lastMove: gameData.lastMove,
      winningCells: gameData.winningCells,
      availableColumns: this.getAvailableColumns(gameData.board)
    };
  }

  serialize(): string {
    return JSON.stringify({
      gameState: this.gameState,
      moves: this.moves,
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      isStarted: this.isStarted,
      isFinished: this.isFinished
    });
  }

  deserialize(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.gameState = parsed.gameState;
      this.moves = parsed.moves;
      this.players = parsed.players;
      this.currentPlayerIndex = parsed.currentPlayerIndex;
      this.isStarted = parsed.isStarted;
      this.isFinished = parsed.isFinished;
      return true;
    } catch (error) {
      console.error('Failed to deserialize Connect4 game:', error);
      return false;
    }
  }

  // Connect4-specific helper methods

  private getPlayerIndex(playerId: string): number {
    return this.players.findIndex(p => p.id === playerId);
  }

  private checkWinFromPosition(
    row: number,
    col: number,
    player: number,
    board: number[][]
  ): { hasWin: boolean; winningCells: Connect4Cell[] } {
    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal down-right
      [1, -1]   // Diagonal down-left
    ];

    for (const [deltaRow, deltaCol] of directions) {
      const cells = this.checkDirection(row, col, deltaRow, deltaCol, player, board);
      if (cells.length >= Connect4Game.CONNECT_COUNT) {
        return { hasWin: true, winningCells: cells };
      }
    }

    return { hasWin: false, winningCells: [] };
  }

  private checkDirection(
    startRow: number,
    startCol: number,
    deltaRow: number,
    deltaCol: number,
    player: number,
    board: number[][]
  ): Connect4Cell[] {
    const cells: Connect4Cell[] = [{ row: startRow, col: startCol, player }];

    // Check positive direction
    let row = startRow + deltaRow;
    let col = startCol + deltaCol;
    while (this.isValidPosition(row, col) && board[row][col] === player) {
      cells.push({ row, col, player });
      row += deltaRow;
      col += deltaCol;
    }

    // Check negative direction
    row = startRow - deltaRow;
    col = startCol - deltaCol;
    while (this.isValidPosition(row, col) && board[row][col] === player) {
      cells.unshift({ row, col, player });
      row -= deltaRow;
      col -= deltaCol;
    }

    return cells;
  }

  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < Connect4Game.ROWS && 
           col >= 0 && col < Connect4Game.COLS;
  }

  private isBoardFull(board: number[][]): boolean {
    for (let col = 0; col < Connect4Game.COLS; col++) {
      if (board[0][col] === Connect4Game.EMPTY) {
        return false;
      }
    }
    return true;
  }

  private getAvailableColumns(board: number[][]): number[] {
    const available: number[] = [];
    for (let col = 0; col < Connect4Game.COLS; col++) {
      if (board[0][col] === Connect4Game.EMPTY) {
        available.push(col);
      }
    }
    return available;
  }

  // Public methods for UI integration

  public getBoardState(): number[][] {
    const gameData = this.gameState.data as Connect4GameData;
    return gameData.board.map(row => [...row]);
  }

  public getWinningCells(): Connect4Cell[] {
    const gameData = this.gameState.data as Connect4GameData;
    return [...gameData.winningCells];
  }

  public getAvailableMoves(): number[] {
    const gameData = this.gameState.data as Connect4GameData;
    return this.getAvailableColumns(gameData.board);
  }

  public getMoveCount(): number {
    const gameData = this.gameState.data as Connect4GameData;
    return gameData.moveCount;
  }

  public getLastMove(): Connect4Cell | undefined {
    const gameData = this.gameState.data as Connect4GameData;
    return gameData.lastMove;
  }
}
