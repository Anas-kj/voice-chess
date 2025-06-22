// components/GameAnalyzer.ts - CLEAN & IMPROVED VERSION
import { Chess } from 'chess.js';
import type { EvaluatedPosition } from '../types/position';
import { Classification } from '../types/Classification';

export class GameAnalyzer {
    
    static createInitialPosition(fen: string): EvaluatedPosition {
        return {
            fen: fen,
            move: { san: "", uci: "" },
            evaluation: 0
        };
    }

    static createEvaluatedPosition(
        fen: string,
        move: { san: string; from: string; to: string; promotion?: string },
        evaluation: number
    ): EvaluatedPosition {
        const uci = move.from + move.to + (move.promotion || '');
        return {
            fen: fen,
            move: { san: move.san, uci: uci },
            evaluation: evaluation
        };
    }

    static getBotEvaluation(fen: string): number {
        const game = new Chess(fen);
        
        if (game.isCheckmate()) {
            return game.turn() === 'w' ? -10000 : 10000;
        }
        
        if (game.isDraw()) {
            return 0;
        }

        // Enhanced evaluation: material + hanging pieces + tactical bonuses
        let evaluation = this.calculateMaterialBalance(game);
        evaluation += this.detectHangingPieces(game);
        evaluation += this.detectTacticalBonuses(game);
        
        return evaluation;
    }

    private static detectTacticalBonuses(game: Chess): number {
        let bonus = 0;
        
        // Check if current position has checks
        if (game.inCheck()) {
            // Bonus/penalty for giving check
            bonus += game.turn() === 'w' ? -50 : 50; // Opponent gave check
        }
        
        // Look for forks (pieces attacking multiple valuable targets)
        bonus += this.detectForks(game);
        
        return bonus;
    }
    
    private static detectForks(game: Chess): number {
        let forkBonus = 0;
        const board = game.board();
        const opponentColor = game.turn() === 'w' ? 'b' : 'w';
        
        // Check each opponent piece for fork potential
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (!piece || piece.color === game.turn()) continue;
                
                const square = String.fromCharCode(97 + col) + (8 - row);
                const targets = this.getAttackTargets(game, square, piece);
                
                // If piece attacks 2+ valuable targets, it's likely a fork
                if (targets.length >= 2) {
                    const targetValue = targets.reduce((sum, target) => {
                        const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 1000 };
                        return sum + (pieceValues[target.type as keyof typeof pieceValues] || 0);
                    }, 0);
                    
                    // Bonus for the side that has the forking piece
                    forkBonus += piece.color === 'w' ? targetValue / 10 : -targetValue / 10;
                }
            }
        }
        
        return forkBonus;
    }
    
    private static getAttackTargets(game: Chess, fromSquare: string, piece: any): any[] {
        const targets = [];
        
        // Get all possible moves from this square
        try {
            const moves = game.moves({ square: fromSquare as any, verbose: true });
            
            for (const move of moves) {
                // If it's a capture or check, it's attacking something valuable
                if (move.captured || move.san.includes('+') || move.san.includes('#')) {
                    targets.push({ 
                        square: move.to, 
                        type: move.captured || 'k' // King if it's check
                    });
                }
            }
        } catch (e) {
            // Ignore errors
        }
        
        return targets;
    }

    private static calculateMaterialBalance(game: Chess): number {
        const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
        let balance = 0;
        
        const board = game.board();
        for (let row of board) {
            for (let piece of row) {
                if (piece) {
                    const value = pieceValues[piece.type as keyof typeof pieceValues];
                    balance += piece.color === 'w' ? value : -value;
                }
            }
        }
        
        return balance;
    }

    private static detectHangingPieces(game: Chess): number {
        const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
        let penalty = 0;
        
        const board = game.board();
        const currentTurn = game.turn();
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (!piece) continue;
                
                const square = String.fromCharCode(97 + col) + (8 - row);
                
                // Check if piece can be captured by the current player
                if (this.canCapture(game, square, currentTurn) && !this.isDefended(game, square, piece.color)) {
                    const value = pieceValues[piece.type as keyof typeof pieceValues];
                    
                    // Reduce penalty for pieces in enemy territory (might be worth the sacrifice)
                    let adjustedValue = value;
                    if ((piece.color === 'b' && row >= 5) || (piece.color === 'w' && row <= 2)) {
                        adjustedValue = value * 0.6; // Reduce penalty for aggressive pieces
                    }
                    
                    penalty += piece.color === 'w' ? -adjustedValue : adjustedValue;
                }
            }
        }
        
        return penalty;
    }
    
    private static canCapture(game: Chess, targetSquare: string, byColor: string): boolean {
        if (game.turn() !== byColor) return false;
        
        const moves = game.moves({ verbose: true });
        return moves.some(move => move.to === targetSquare);
    }
    
    private static isDefended(game: Chess, square: string, pieceColor: string): boolean {
        // Create a temporary game with the defender's turn
        const gameCopy = new Chess(game.fen());
        const fenParts = gameCopy.fen().split(' ');
        fenParts[1] = pieceColor; // Set turn to piece owner
        
        try {
            gameCopy.load(fenParts.join(' '));
            const moves = gameCopy.moves({ verbose: true });
            return moves.some(move => move.to === square);
        } catch {
            return false;
        }
    }

    static analyzeGame(positions: EvaluatedPosition[]): void {
        // Skip first position (starting position)  
        for (let i = 1; i < positions.length; i++) {
            const currentPos = positions[i];
            const prevPos = positions[i - 1];
            
            // Determine who moved (white = odd indices, black = even indices)
            const isWhiteMove = i % 2 === 1;
            
            // Calculate raw evaluation change
            const evalChange = currentPos.evaluation - prevPos.evaluation;
            
            // Convert to "how much did this move cost the player who made it"
            // Positive evalLoss = bad move, Negative evalLoss = good move
            let evalLoss: number;
            
            if (isWhiteMove) {
                // White wants higher evaluation
                // If eval goes up (+), that's good for white (negative loss)
                // If eval goes down (-), that's bad for white (positive loss)
                evalLoss = -evalChange;
            } else {
                // Black wants lower evaluation  
                // If eval goes down (-), that's good for black (negative loss)
                // If eval goes up (+), that's bad for black (positive loss)
                evalLoss = evalChange;
            }
            
            // Debug for significant moves
            if (Math.abs(evalChange) > 200) {
                console.log(`Move ${i}: ${isWhiteMove ? 'White' : 'Black'} plays ${currentPos.move.san}`);
                console.log(`  Eval change: ${prevPos.evaluation} → ${currentPos.evaluation} (${evalChange > 0 ? '+' : ''}${evalChange})`);
                console.log(`  Eval loss for player: ${evalLoss} → ${this.classifyMove(evalLoss)}`);
            }
            
            // Classify the move
            currentPos.classification = this.classifyMove(evalLoss);
        }
    }
    
    private static classifyMove(evalLoss: number): Classification {
        // If position improved (negative loss), it's a good move
        if (evalLoss <= 0) {
            return Classification.BEST;
        }
        
        // Simple, clear thresholds
        if (evalLoss <= 25) return Classification.BEST;
        if (evalLoss <= 50) return Classification.EXCELLENT;
        if (evalLoss <= 100) return Classification.GOOD;
        if (evalLoss <= 200) return Classification.INACCURACY;
        if (evalLoss <= 400) return Classification.MISTAKE;
        return Classification.BLUNDER;
    }
}