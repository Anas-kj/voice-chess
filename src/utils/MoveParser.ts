// utils/simpleMoveParser.ts
import { Chess } from 'chess.js';

interface ParseResult {
  type: 'move' | 'undo' | 'illegal' | 'unknown';
  move?: string;
  description?: string;
  message?: string;
}

// Simple alias system to fix common speech recognition errors
const fixCommonErrors = (command: string): string => {
  const aliases: { [key: string]: string } = {
    'age': 'h', 'each': 'h', 'hotel': 'h', 'stage': 'h',
    'night': 'knight', 'porn': 'pawn',
    'too': 'to', 'take': 'takes', 'capture': 'takes',
  };

  let fixedCommand = command;
  Object.entries(aliases).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    fixedCommand = fixedCommand.replace(regex, correct);
  });
  return fixedCommand;
};

export const parseVoiceCommand = (command: string, game: Chess): ParseResult => {
  const cmd = fixCommonErrors(command.toLowerCase().trim());

  // Undo command
  if (cmd === 'undo' || cmd === 'undo move') {
    return { type: 'undo' };
  }

  // Castling
  if (cmd.includes('castle')) {
    if (cmd.includes('king') || cmd.includes('short')) {
      return { type: 'move', move: 'O-O', description: 'castled kingside' };
    }
    if (cmd.includes('queen') || cmd.includes('long')) {
      return { type: 'move', move: 'O-O-O', description: 'castled queenside' };
    }
  }

  // Simple pawn moves (e.g., "e4", "d3")
  const pawnMatch = cmd.match(/^([a-h][1-8])$/);
  if (pawnMatch) {
    const square = pawnMatch[1];
    const move = findLegalPawnMove(game, square);
    if (move) {
      return { type: 'move', move: move, description: `pawn to ${square}` };
    } else {
      return { type: 'illegal', message: `No pawn can move to ${square}` };
    }
  }

  // Piece moves (e.g., "knight to f3")
  const pieceMatch = cmd.match(/(knight|bishop|rook|queen|king|pawn)(?:\s+to)?\s+([a-h][1-8])/);
  if (pieceMatch) {
    const piece = pieceMatch[1];
    const square = pieceMatch[2];
    const move = findLegalPieceMove(game, piece, square);
    if (move) {
      return { type: 'move', move: move, description: `${piece} to ${square}` };
    } else {
      return { type: 'illegal', message: `No ${piece} can move to ${square}` };
    }
  }

  // Captures (e.g., "knight takes c6")
  const captureMatch = cmd.match(/(knight|bishop|rook|queen|king|pawn|[a-h])(?:\s+)takes\s+([a-h][1-8])/);
  if (captureMatch) {
    const piece = captureMatch[1];
    const square = captureMatch[2];
    
    let move: string | null = null;
    let description: string;
    
    if (piece.length === 1) {
      move = findLegalPawnCapture(game, piece, square);
      description = `pawn takes ${square}`;
    } else {
      move = findLegalPieceCapture(game, piece, square);
      description = `${piece} takes ${square}`;
    }
    
    if (move) {
      return { type: 'move', move: move, description: description };
    } else {
      return { type: 'illegal', message: `No ${piece} can capture ${square}` };
    }
  }

  return { type: 'unknown', message: `Unrecognized command: ${command}` };
};

// Helper functions
const findLegalPawnMove = (game: Chess, targetSquare: string): string | null => {
  const moves = game.moves({ verbose: true });
  const pawnMoves = moves.filter(move => 
    move.to === targetSquare && move.piece === 'p' && !move.captured
  );
  return pawnMoves.length > 0 ? pawnMoves[0].san : null;
};

const findLegalPieceMove = (game: Chess, piece: string, targetSquare: string): string | null => {
  const moves = game.moves({ verbose: true });
  const pieceType = getPieceType(piece);
  const pieceMoves = moves.filter(move => 
    move.to === targetSquare && move.piece === pieceType
  );
  return pieceMoves.length > 0 ? pieceMoves[0].san : null;
};

const findLegalPawnCapture = (game: Chess, file: string, targetSquare: string): string | null => {
  const moves = game.moves({ verbose: true });
  const pawnCaptures = moves.filter(move => 
    move.to === targetSquare && move.piece === 'p' &&
    move.from[0] === file && move.captured
  );
  return pawnCaptures.length > 0 ? pawnCaptures[0].san : null;
};

const findLegalPieceCapture = (game: Chess, piece: string, targetSquare: string): string | null => {
  const moves = game.moves({ verbose: true });
  const pieceType = getPieceType(piece);
  const pieceCaptures = moves.filter(move => 
    move.to === targetSquare && move.piece === pieceType && move.captured
  );
  return pieceCaptures.length > 0 ? pieceCaptures[0].san : null;
};

const getPieceType = (piece: string): string => {
  const pieceTypes: { [key: string]: string } = {
    'knight': 'n', 'bishop': 'b', 'rook': 'r', 
    'queen': 'q', 'king': 'k', 'pawn': 'p'
  };
  return pieceTypes[piece] || '';
};