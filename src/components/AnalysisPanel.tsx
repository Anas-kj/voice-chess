// components/AnalysisPanel.tsx
import React from 'react';
import styled from 'styled-components';
import { GameStatus } from './GameStatus';
import { MoveHistory } from './MoveHistory';
import type { EvaluatedPosition } from '../types/position';

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 400px;
`;

const Title = styled.h2`
  color: #333;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
`;

interface AnalysisPanelProps {
  statusMessage: string;
  isThinking: boolean;
  positions: EvaluatedPosition[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  statusMessage,
  isThinking,
  positions,
  currentMoveIndex,
  onMoveClick
}) => {
  return (
    <Container>
      <Title>Game Analysis</Title>
      
      <GameStatus 
        statusMessage={statusMessage}
        isThinking={isThinking}
      />
      
      <MoveHistory
        positions={positions}
        currentMoveIndex={currentMoveIndex}
        onMoveClick={onMoveClick}
      />
    </Container>
  );
};