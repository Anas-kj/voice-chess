// types/Position.ts
import { Classification } from "./Classification";

interface Move {
    san: string;
    uci: string;
}

export interface Position {
    fen: string;
    move?: Move;
}

export interface EvaluatedPosition extends Position {
    move: Move;
    evaluation: number; // Simple centipawn evaluation
    classification?: Classification;
}