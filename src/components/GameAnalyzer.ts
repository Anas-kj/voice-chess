// components/GameAnalyzer.ts
import { Chess } from 'chess.js';
import type  { EvaluatedPosition } from '../types/position';
import { Classification } from '../types/Classification';

export class GameAnalyzer {
    
    /**
     * Create initial position
     */
    static createInitialPosition(fen: string): EvaluatedPosition {
        return {
            fen: fen,
            move: {
                san: "",
                uci: ""
            },
            evaluation: 0
        };
    }

    /**
     * Create evaluated position from a move
     */
    static createEvaluatedPosition(
        fen: string,
        move: { san: string; from: string; to: string; promotion?: string },
        evaluation: number
    ): EvaluatedPosition {
        const uci = move.from + move.to + (move.promotion || '');
        
        return {
            fen: fen,
            move: {
                san: move.san,
                uci: uci
            },
            evaluation: evaluation
        };
    }

    /**
     * Get simple evaluation from position
     */
    static getBotEvaluation(fen: string): number {
        const game = new Chess(fen);
        
        if (game.isCheckmate()) {
            return game.turn() === 'w' ? -1000 : 1000;
        }
        
        if (game.isDraw()) {
            return 0;
        }

        // Simple material count
        return this.calculateMaterialBalance(game);
    }

    /**
     * Simple material balance calculation
     */
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

    /**
     * Analyze and classify moves (simplified)
     */
    static analyzeGame(positions: EvaluatedPosition[]): void {
        for (let i = 1; i < positions.length; i++) {
            const currentPos = positions[i];
            const prevPos = positions[i - 1];
            
            const evalDiff = Math.abs(currentPos.evaluation - prevPos.evaluation);
            
            // Simple classification based on evaluation change
            if (evalDiff <= 10) {
                currentPos.classification = Classification.BEST;
            } else if (evalDiff <= 25) {
                currentPos.classification = Classification.EXCELLENT;
            } else if (evalDiff <= 50) {
                currentPos.classification = Classification.GOOD;
            } else if (evalDiff <= 100) {
                currentPos.classification = Classification.INACCURACY;
            } else if (evalDiff <= 200) {
                currentPos.classification = Classification.MISTAKE;
            } else {
                currentPos.classification = Classification.BLUNDER;
            }
        }
    }
}