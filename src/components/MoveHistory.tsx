// components/MoveHistory.tsx
import React from 'react';
import styled from 'styled-components';
import type { EvaluatedPosition } from '../types/position';
import { Classification } from '../types/Classification';

const Container = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  max-height: 400px;
  overflow-y: auto;
`;

const Header = styled.div`
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  font-weight: bold;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MoveItem = styled.div<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  background-color: ${props => props.isActive ? '#e3f2fd' : 'white'};
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f5f5;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const MoveNumber = styled.span`
  font-weight: bold;
  color: #666;
  margin-right: 12px;
  flex-shrink: 0;
`;

const MovePair = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
`;

const MoveWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MoveSan = styled.span`
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #333;
`;

const ClassificationIcon = styled.img`
  width: 20px;
  height: 20px;
  object-fit: contain;
`;

const EmptyState = styled.div`
  padding: 30px;
  text-align: center;
  color: #666;
  font-style: italic;
`;


function getClassificationLabel(classification: Classification): string {
  const labels: Record<Classification, string> = {
    [Classification.BRILLIANT]: 'Brilliant',
    [Classification.GREAT]: 'Great',
    [Classification.BEST]: 'Best',
    [Classification.EXCELLENT]: 'Excellent',
    [Classification.GOOD]: 'Good',
    [Classification.INACCURACY]: 'Inaccuracy',
    [Classification.MISTAKE]: 'Mistake',
    [Classification.BLUNDER]: 'Blunder',
    [Classification.BOOK]: 'Book',
    [Classification.FORCED]: 'Forced'
  };
  return labels[classification] || classification;
}

interface MoveHistoryProps {
  positions: EvaluatedPosition[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ 
  positions, 
  currentMoveIndex, 
  onMoveClick 
}) => {
  const movePositions = positions.slice(1); // Skip initial position

  if (movePositions.length === 0) {
    return (
      <Container>
        <Header>Move Analysis</Header>
        <EmptyState>
          No moves to analyze yet. Start playing to see move classifications!
        </EmptyState>
      </Container>
    );
  }

  // Group moves by pairs (white move + black move)
  const movePairs = [];
  for (let i = 0; i < movePositions.length; i += 2) {
    const whiteMove = movePositions[i];
    const blackMove = movePositions[i + 1];
    movePairs.push({ whiteMove, blackMove, moveNumber: Math.floor(i / 2) + 1 });
  }

  return (
    <Container>
      <Header>
        <span>Move Analysis</span>
        <span>{movePositions.length} moves</span>
      </Header>
      
      {movePairs.map(({ whiteMove, blackMove, moveNumber }, pairIndex) => (
        <MoveItem
          key={pairIndex}
          isActive={currentMoveIndex === pairIndex * 2 + 1 || currentMoveIndex === pairIndex * 2 + 2}
          onClick={() => onMoveClick(blackMove ? pairIndex * 2 + 2 : pairIndex * 2 + 1)}
        >
          <MoveNumber>{moveNumber}.</MoveNumber>
          
          <MovePair>
            {/* White Move */}
            <MoveWithIcon>
              {whiteMove.classification && (
                <ClassificationIcon 
                  src={`/media/${whiteMove.classification}.png`}
                  alt={whiteMove.classification}
                />
              )}
              <MoveSan>{whiteMove.move.san}</MoveSan>
            </MoveWithIcon>
            
            {/* Black Move */}
            {blackMove && (
              <MoveWithIcon>
                {blackMove.classification && (
                  <ClassificationIcon 
                    src={`/media/${blackMove.classification}.png`}
                    alt={blackMove.classification}
                  />
                )}
                <MoveSan>{blackMove.move.san}</MoveSan>
              </MoveWithIcon>
            )}
          </MovePair>
        </MoveItem>
      ))}
    </Container>
  );
};