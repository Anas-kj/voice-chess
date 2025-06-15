// components/BoardContainer.tsx
import React from 'react';
import { Chessboard } from 'react-chessboard';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const DifficultyLabel = styled.div`
  font-weight: bold;
  color: #333;
  font-size: 16px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'difficulty'; active?: boolean }>`
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.variant === 'primary' ? `
    background-color: #28a745;
    color: white;
    &:hover {
      background-color: #218838;
    }
  ` : `
    background-color: ${props.active ? '#007bff' : '#e9ecef'};
    color: ${props.active ? 'white' : '#495057'};
    &:hover {
      background-color: ${props.active ? '#0056b3' : '#dee2e6'};
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

interface BoardContainerProps {
  position: string;
  onPieceDrop: (sourceSquare: string, targetSquare: string) => boolean;
  onRestartGame: () => void;
  difficulty: 'easy' | 'medium' | 'hard';
  onDifficultyChange: (difficulty: 'easy' | 'medium' | 'hard') => void;
  isThinking: boolean;
}

export const BoardContainer: React.FC<BoardContainerProps> = ({
  position,
  onPieceDrop,
  onRestartGame,
  difficulty,
  onDifficultyChange,
  isThinking
}) => {
  const getDifficultyLabel = () => {
    switch (difficulty) {
      case 'easy': return 'Easy (Depth 2)';
      case 'medium': return 'Medium (Depth 3)';
      case 'hard': return 'Hard (Depth 4)';
    }
  };

  return (
    <Container>
      <DifficultyLabel>
        Difficulty: {getDifficultyLabel()}
      </DifficultyLabel>
      
      <Chessboard
        position={position}
        onPieceDrop={onPieceDrop}
        boardWidth={400}
        areArrowsAllowed={false}
        boardOrientation="white"
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
        }}
      />

      <ButtonContainer>
        <Button 
          variant="primary"
          onClick={onRestartGame}
          disabled={isThinking}
        >
          Restart Game
        </Button>
        
        <Button 
          variant="difficulty"
          active={difficulty === 'easy'}
          onClick={() => onDifficultyChange('easy')}
          disabled={isThinking}
        >
          Easy
        </Button>
        
        <Button 
          variant="difficulty"
          active={difficulty === 'medium'}
          onClick={() => onDifficultyChange('medium')}
          disabled={isThinking}
        >
          Medium
        </Button>
        
        <Button 
          variant="difficulty"
          active={difficulty === 'hard'}
          onClick={() => onDifficultyChange('hard')}
          disabled={isThinking}
        >
          Hard
        </Button>
      </ButtonContainer>
    </Container>
  );
};