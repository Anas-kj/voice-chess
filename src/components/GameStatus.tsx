// components/GameStatus.tsx
import React from 'react';
import styled from 'styled-components';

const StatusContainer = styled.div`
  padding: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
  border-left: 4px solid #007bff;
  font-weight: 500;
  color: #333;
`;

const ThinkingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #007bff;
  font-weight: 600;
  margin-top: 10px;
`;

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface GameStatusProps {
  statusMessage: string;
  isThinking: boolean;
}

export const GameStatus: React.FC<GameStatusProps> = ({ statusMessage, isThinking }) => {
  return (
    <div>
      <StatusContainer>
        {statusMessage}
      </StatusContainer>
      
      {isThinking && (
        <ThinkingIndicator>
          <Spinner />
          🤔 Bot is calculating the best move...
        </ThinkingIndicator>
      )}
    </div>
  );
};