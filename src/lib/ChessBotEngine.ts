// ChessBotEngine.ts
import { Chess } from 'chess.js';

export interface BotMove {
  from: string;
  to: string;
  promotion?: string;
}

export class ChessBotEngine {
  private readonly PIECE_VALUES = {
    p: 1,   // pawn
    n: 3,   // knight
    b: 3,   // bishop
    r: 5,   // rook
    q: 9,   // queen
    k: 0    // king
  };

  // Position bonus tables for better positional play
  private readonly PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [2, -2, -3,  0,  0, -3, -2,  2],
  [0,  0,  0, -3, -3,  0,  0,  0],
  [2,  2,  3,  6,  6,  3,  2,  2],
  [3,  3,  6, 12, 12,  6,  3,  3],
  [9,  9, 12, 18, 18, 12,  9,  9],
  [27,27,27,27,27,27,27,27],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

private readonly KNIGHT_TABLE = [
  [-30, -25, -20, -20, -20, -20, -25, -30],
  [-25, -12,   0,   0,   0,   0, -12, -25],
  [-20,   3,   6,   9,   9,   6,   3, -20],
  [-20,   3,   9,  12,  12,   9,   3, -20],
  [-20,   3,   9,  12,  12,   9,   3, -20],
  [-20,   3,   6,   9,   9,   6,   3, -20],
  [-25, -12,   0,   3,   3,   0, -12, -25],
  [-30, -25, -20, -20, -20, -20, -25, -30]
];

private readonly BISHOP_TABLE = [
  [-12, -6, -6, -6, -6, -6, -6, -12],
  [-6,   3,  0,  0,  0,  0,  3,  -6],
  [-6,   6,  6,  6,  6,  6,  6,  -6],
  [-6,   0,  6,  9,  9,  6,  0,  -6],
  [-6,   3,  6,  9,  9,  6,  3,  -6],
  [-6,   0,  6,  6,  6,  6,  0,  -6],
  [-6,   0,  0,  0,  0,  0,  0,  -6],
  [-12, -6, -6, -6, -6, -6, -6, -12]
];

private readonly ROOK_TABLE = [
  [0,  0,  0,  4,  4,  0,  0,  0],
  [-4,  0,  0,  0,  0,  0,  0, -4],
  [-4,  0,  0,  0,  0,  0,  0, -4],
  [-4,  0,  0,  0,  0,  0,  0, -4],
  [-4,  0,  0,  0,  0,  0,  0, -4],
  [-4,  0,  0,  0,  0,  0,  0, -4],
  [4, 15, 15, 15, 15, 15, 15,  4],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

private readonly QUEEN_TABLE = [
  [-10, -5, -5, -2, -2, -5, -5, -10],
  [-5,   0,  2,  0,  0,  0,  0,  -5],
  [-5,   2,  2,  2,  2,  2,  0,  -5],
  [-2,   0,  2,  5,  5,  2,  0,  -2],
  [-2,   0,  2,  5,  5,  2,  0,  -2],
  [-5,   0,  2,  2,  2,  2,  0,  -5],
  [-5,   0,  0,  0,  0,  0,  0,  -5],
  [-10, -5, -5, -2, -2, -5, -5, -10]
];

private readonly KING_TABLE = [
  [-40, -32, -24, -16, -16, -24, -32, -40],
  [-24, -16, -8,   0,   0,  -8, -16, -24],
  [-24, -8,  16,  24,  24, 16,  -8, -24],
  [-24, -8,  24,  32,  32, 24,  -8, -24],
  [-24, -8,  24,  32,  32, 24,  -8, -24],
  [-24, -8,  16,  24,  24, 16,  -8, -24],
  [-24, -24, 0,   0,   0,  0,  -24, -24],
  [-40, -24, -24, -24, -24, -24, -24, -40]
];


  // Simple position history to avoid repetition
  private positionHistory: string[] = [];

  /**
   * Get the best move for the current position using minimax with alpha-beta pruning
   */
  public getBestMove(game: Chess, depth: number = 3): BotMove | null {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    // Store current position
    this.positionHistory.push(game.fen());

    let bestMove: BotMove | null = null;
    let bestValue = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    // First, check if any move leads to immediate checkmate
    for (const move of moves) {
      const gameCopy = new Chess(game.fen());
      gameCopy.move(move);
      
      if (gameCopy.isCheckmate()) {
        // Found checkmate! Return immediately
        this.positionHistory.pop();
        return {
          from: move.from,
          to: move.to,
          promotion: move.promotion
        };
      }
    }

    // If no immediate checkmate, proceed with normal search
    for (const move of moves) {
      const gameCopy = new Chess(game.fen());
      gameCopy.move(move);
      
      const value = this.minimax(gameCopy, depth - 1, alpha, beta, false, 1);
      
      if (value > bestValue) {
        bestValue = value;
        bestMove = {
          from: move.from,
          to: move.to,
          promotion: move.promotion
        };
      }
      
      alpha = Math.max(alpha, value);
    }

    // Clean up position history
    this.positionHistory.pop();
    return bestMove;
  }

  /**
   * Minimax algorithm with alpha-beta pruning
   */
  private minimax(game: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean, plyFromRoot: number = 0): number {
    // Check for immediate checkmate first
    if (game.isCheckmate()) {
      // Return mate score adjusted by distance - closer mates are better
      return isMaximizing ? -(100000 - plyFromRoot) : (100000 - plyFromRoot);
    }

    if (depth === 0 || game.isGameOver()) {
      return this.evaluatePosition(game);
    }

    const moves = game.moves({ verbose: true });

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const gameCopy = new Chess(game.fen());
            gameCopy.move(move);
            const evaluation = this.minimax(gameCopy, depth - 1, alpha, beta, false, plyFromRoot + 1);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break; // Alpha-beta pruning
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const gameCopy = new Chess(game.fen());
            gameCopy.move(move);
            const evaluation = this.minimax(gameCopy, depth - 1, alpha, beta, true, plyFromRoot + 1);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break; // Alpha-beta pruning
        }
        return minEval;
    }
  }

  /**
   * Evaluate the current position
   */
  private evaluatePosition(game: Chess): number {
    if (game.isCheckmate()) {
      return game.turn() === 'w' ? -100000 : 100000; // Higher mate score for better detection
    }
    
    if (game.isDraw() || game.isStalemate()) {
      return 0;
    }

    // Check for threefold repetition to discourage it
    const currentPos = game.fen().split(' ')[0]; // Only position part
    let repetitions = 0;
    for (const pos of this.positionHistory) {
      if (pos.split(' ')[0] === currentPos) {
        repetitions++;
      }
    }
    
    // Heavily penalize repetitions
    if (repetitions >= 2) {
      return game.turn() === 'w' ? -5000 : 5000;
    }

    let score = 0;
    const board = game.board();

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = this.getPieceValue(piece, i, j);
          score += piece.color === 'b' ? value : -value;
        }
      }
    }

    // Add tiny random factor to break ties and avoid identical evaluations
    score += (Math.random() - 0.5) * 0.1;

    return score;
  }

  /**
   * Get piece value including positional bonus
   */
  private getPieceValue(piece: any, row: number, col: number): number {
    const baseValue = this.PIECE_VALUES[piece.type as keyof typeof this.PIECE_VALUES] * 100;
    let positionalValue = 0;

    // Flip row for black pieces since tables are from white's perspective
    const tableRow = piece.color === 'b' ? row : 7 - row;

    switch (piece.type) {
      case 'p':
        positionalValue = this.PAWN_TABLE[tableRow][col];
        break;
      case 'n':
        positionalValue = this.KNIGHT_TABLE[tableRow][col];
        break;
      case 'b':
        positionalValue = this.BISHOP_TABLE[tableRow][col];
        break;
      case 'r':
        positionalValue = this.ROOK_TABLE[tableRow][col];
        break;
      case 'k':
        positionalValue = this.KING_TABLE[tableRow][col];
        break;
      default:
        positionalValue = 0;
    }

    return baseValue + positionalValue;
  }

  /**
   * Get a quick move for faster gameplay (lower depth)
   */
  public getQuickMove(game: Chess): BotMove | null {
    return this.getBestMove(game, 2);
  }

  /**
   * Get a strong move for challenging gameplay (higher depth)
   */
  public getStrongMove(game: Chess): BotMove | null {
    return this.getBestMove(game, 4);
  }
}
