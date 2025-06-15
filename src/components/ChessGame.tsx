// ChessGame.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import styled from 'styled-components';
import { ChessBotEngine } from '../lib/ChessBotEngine';
import type { BotMove } from '../lib/ChessBotEngine';
import { GameAnalyzer } from './GameAnalyzer';
import type { EvaluatedPosition } from '../types/position';
import { BoardContainer } from './BoardContainer';
import { AnalysisPanel } from './AnalysisPanel';
import { SimpleVoiceTest } from '../components/SimpleVoiceTest';
import { parseVoiceCommand } from '../utils/MoveParser';
import { 
  announceMove, 
  announceUndo, 
  announceIllegalMove,
  announceNotUnderstood,
  announceGameStatus 
} from '../utils/voiceFeedback';

const GameContainer = styled.div`
  display: flex;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  gap: 30px;
  min-height: 100vh;
  align-items: flex-start;
  justify-content: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const LeftSection = styled.div`
  flex: 1;
  max-width: 50%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const RightSection = styled.div`
  flex: 1;
  max-width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const VoiceContainer = styled.div`
  margin-bottom: 20px;
`;

const ChessGame = () => {
  const [game, setGame] = useState(new Chess());
  const [statusMessage, setStatusMessage] = useState('White to move. You are playing as White.');
  const [isThinking, setIsThinking] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [gamePositions, setGamePositions] = useState<EvaluatedPosition[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  
  const botEngine = useRef(new ChessBotEngine());

  // Initialize with starting position
  useEffect(() => {
    const initialPosition = GameAnalyzer.createInitialPosition(new Chess().fen());
    setGamePositions([initialPosition]);
  }, []);

  // 🎤 VOICE COMMAND HANDLER
  const handleVoiceCommand = (command: string) => {
    console.log('🎯 Processing voice command:', command);
    
    // Only process commands during player's turn
    if (game.turn() !== 'w' || game.isGameOver() || isThinking) {
      console.log('❌ Not player turn or game over');
      announceError('Not your turn');
      return;
    }
    
    const result = parseVoiceCommand(command, game);
    console.log('📝 Parsed result:', result);
    
    if (result.type === 'move') {
      const success = makeMove(result.move!);
      if (success) {
        console.log('✅ Move successful:', result.description);
        setStatusMessage(`Voice: "${command}" - ${result.description}`);
        announceMove(result.description!);
      } else {
        console.log('❌ Move failed');
        setStatusMessage(`Illegal move: ${command}`);
        announceIllegalMove();
      }
    } else if (result.type === 'undo') {
      handleUndo();
      console.log('↩️ Undo requested');
    } else if (result.type === 'illegal') {
      console.log('❌ Illegal chess move:', result.message);
      setStatusMessage(`Error: ${result.message}`);
      announceIllegalMove();
    } else if (result.type === 'unknown') {
      console.log('❓ Unknown command:', result.message);
      setStatusMessage(`Error: ${result.message}`);
      announceNotUnderstood(command);
    }
  };

  const makeMove = (move: any) => {
    const gameCopy = new Chess(game.fen());
    try {
      const moveResult = gameCopy.move(move);
      setGame(gameCopy);
      
      // Add to move history
      if (moveResult) {
        setMoveHistory(prev => [...prev, moveResult.san]);
      }
      
      // Add position to analysis
      addMoveToAnalysis(gameCopy.fen(), moveResult);
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleUndo = () => {
    if (moveHistory.length === 0) {
      setStatusMessage('No moves to undo');
      announceError('No moves to undo');
      return;
    }
    
    // Remove last two moves (player + bot) or just one if it's player's turn
    const movesToRemove = game.turn() === 'w' ? 2 : 1;
    const newHistory = moveHistory.slice(0, -movesToRemove);
    const newPositions = gamePositions.slice(0, -(movesToRemove));
    
    // Reconstruct game from history
    const newGame = new Chess();
    newHistory.forEach(move => {
      newGame.move(move);
    });
    
    setGame(newGame);
    setMoveHistory(newHistory);
    setGamePositions(newPositions);
    setCurrentMoveIndex(newPositions.length - 1);
    setStatusMessage('Move undone. Your turn.');
    announceUndo();
  };

  const addMoveToAnalysis = (fen: string, moveResult: any) => {
    // Get evaluation from bot engine
    const evaluation = GameAnalyzer.getBotEvaluation(fen);
    
    // Create evaluated position
    const evaluatedPosition = GameAnalyzer.createEvaluatedPosition(
      fen,
      moveResult,
      evaluation
    );

    setGamePositions(prev => {
      const newPositions = [...prev, evaluatedPosition];
      
      // Analyze the game
      const report = GameAnalyzer.analyzeGame(newPositions);
      
      // Update current move index to the latest move
      setCurrentMoveIndex(newPositions.length - 1);
      
      return newPositions;
    });
  };

  const makeBotMove = useCallback(async () => {
    if (game.turn() !== 'b' || game.isGameOver()) return;

    setIsThinking(true);
    setStatusMessage('Bot is thinking...');

    // Add a small delay to show the thinking message
    setTimeout(() => {
      let botMove: BotMove | null = null;
      
      switch (botDifficulty) {
        case 'easy':
          botMove = botEngine.current.getBestMove(game, 2);
          break;
        case 'medium':
          botMove = botEngine.current.getBestMove(game, 3);
          break;
        case 'hard':
          botMove = botEngine.current.getBestMove(game, 4);
          break;
      }

      if (botMove) {
        const success = makeMove(botMove);
        if (success) {
          const newGame = new Chess(game.fen());
          newGame.move(botMove);
          setGame(newGame);
          
          // Update status message with voice feedback
          if (newGame.isCheckmate()) {
            setStatusMessage('Checkmate! Bot wins!');
            announceGameStatus('Checkmate! Bot wins!');
          } else if (newGame.isCheck()) {
            setStatusMessage('Check! Your turn.');
            announceGameStatus('Check! Your turn.');
          } else if (newGame.isDraw()) {
            setStatusMessage('Game is a draw!');
            announceGameStatus('Game is a draw!');
          } else {
            setStatusMessage('Your turn.');
            announceGameStatus('Your turn.');
          }
        }
      }
      
      setIsThinking(false);
    }, 500);
  }, [game, botDifficulty]);

  const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
    // Only allow moves when it's white's turn and game is not over
    if (game.turn() !== 'w' || game.isGameOver() || isThinking) {
      return false;
    }

    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // Always promote to queen for simplicity
    });

    if (move) {
      // Update status message after player move with voice feedback
      const currentGame = new Chess(game.fen());
      currentGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (currentGame.isCheckmate()) {
        setStatusMessage('Checkmate! You win!');
        announceGameStatus('Checkmate! You win!');
      } else if (currentGame.isCheck()) {
        setStatusMessage('Check! Bot\'s turn.');
        announceGameStatus('Check! Bot\'s turn.');
      } else if (currentGame.isDraw()) {
        setStatusMessage('Game is a draw!');
        announceGameStatus('Game is a draw!');
      } else {
        setStatusMessage('Bot\'s turn...');
        announceGameStatus('Bot\'s turn.');
      }
    }

    return move;
  };

  const restartGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setMoveHistory([]);
    setStatusMessage('Game restarted! White to move. You are playing as White.');
    setIsThinking(false);
    
    // Reset analysis
    const initialPosition = GameAnalyzer.createInitialPosition(newGame.fen());
    setGamePositions([initialPosition]);
    setCurrentMoveIndex(0);
  };

  const handleDifficultyChange = (newDifficulty: 'easy' | 'medium' | 'hard') => {
    setBotDifficulty(newDifficulty);
  };

  const handleMoveClick = (moveIndex: number) => {
    setCurrentMoveIndex(moveIndex);
    
    // Update the board to show the position at this move
    if (gamePositions[moveIndex]) {
      const gameAtMove = new Chess(gamePositions[moveIndex].fen);
      setGame(gameAtMove);
    }
  };

  // Effect to trigger bot move when it's black's turn
  useEffect(() => {
    if (game.turn() === 'b' && !game.isGameOver() && !isThinking) {
      makeBotMove();
    }
  }, [game, makeBotMove, isThinking]);

  return (
    <GameContainer>
      <LeftSection>
        <BoardContainer
          position={game.fen()}
          onPieceDrop={onPieceDrop}
          onRestartGame={restartGame}
          difficulty={botDifficulty}
          onDifficultyChange={handleDifficultyChange}
          isThinking={isThinking}
        />
      </LeftSection>
      
      <RightSection>
        {/* 🎤 Voice Commands - Add above AnalysisPanel */}
        <VoiceContainer>
          <SimpleVoiceTest onVoiceCommand={handleVoiceCommand} />
        </VoiceContainer>
        
        <AnalysisPanel
          statusMessage={statusMessage}
          isThinking={isThinking}
          positions={gamePositions}
          currentMoveIndex={currentMoveIndex}
          onMoveClick={handleMoveClick}
        />
      </RightSection>
    </GameContainer>
  );
};

export default ChessGame;

function announceError(arg0: string) {
  throw new Error('Function not implemented.');
}
