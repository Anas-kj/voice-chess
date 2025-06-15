// components/VoiceButton.tsx
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Chess } from 'chess.js';
import { parseVoiceCommand } from '../utils/MoveParser';
import { 
  announceMove, 
  announceIllegalMove,
  announceNotUnderstood,
} from '../utils/voiceFeedback';

const VoiceButtonContainer = styled.button<{ isListening: boolean; disabled: boolean }>`
  padding: 12px 24px;
  border-radius: 12px;
  border: 2px solid ${props => props.isListening ? '#ef4444' : '#3b82f6'};
  background-color: ${props => props.isListening ? '#fef2f2' : '#dbeafe'};
  color: ${props => props.isListening ? '#dc2626' : '#1d4ed8'};
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};
  width: 100%;
  margin-bottom: 10px;
  
  &:hover {
    background-color: ${props => !props.disabled && (props.isListening ? '#fee2e2' : '#bfdbfe')};
  }
  
  &:active {
    transform: ${props => !props.disabled && 'scale(0.98)'};
  }
`;

const VoiceIcon = styled.span<{ isListening: boolean }>`
  margin-right: 8px;
  animation: ${props => props.isListening ? 'pulse 1.5s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

interface VoiceButtonProps {
  game: Chess;
  onMove: (move: any) => boolean;
  isPlayerTurn: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  game,
  onMove,
  isPlayerTurn
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase().trim();
      setLastCommand(command);
      handleVoiceCommand(command);
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleVoiceCommand = (command: string) => {
    if (!isPlayerTurn) return;
    
    const result = parseVoiceCommand(command, game);
    
    if (result.type === 'move') {
      const success = onMove(result.move!);
      if (success) {
        announceMove(result.description!);
      } else {
        announceIllegalMove();
      }
    } else if (result.type === 'illegal') {
      announceIllegalMove();
    } else if (result.type === 'unknown') {
      announceNotUnderstood(command);
    }
  };

  const handleClick = () => {
    if (!isPlayerTurn || !isSupported) return;
    
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, 5000);
    }
  };

  if (!isSupported) {
    return (
      <VoiceButtonContainer isListening={false} disabled={true}>
        <VoiceIcon isListening={false}>🚫</VoiceIcon>
        Voice not supported
      </VoiceButtonContainer>
    );
  }

  return (
    <div>
      <VoiceButtonContainer 
        isListening={isListening} 
        disabled={!isPlayerTurn}
        onClick={handleClick}
      >
        <VoiceIcon isListening={isListening}>
          {isListening ? '🔴' : '🎤'}
        </VoiceIcon>
        {isListening ? 'Listening...' : 'Voice Command'}
      </VoiceButtonContainer>
      
      {lastCommand && (
        <div style={{ 
          fontSize: '12px', 
          color: '#64748b', 
          marginBottom: '10px',
          padding: '4px 8px',
          backgroundColor: '#f8fafc',
          borderRadius: '4px'
        }}>
          Last: "{lastCommand}"
        </div>
      )}
    </div>
  );
};