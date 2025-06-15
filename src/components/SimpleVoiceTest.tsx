// components/SimpleVoiceTest.tsx
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

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

interface SimpleVoiceTestProps {
  onVoiceCommand: (command: string) => void;
}

export const SimpleVoiceTest: React.FC<SimpleVoiceTestProps> = ({ onVoiceCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [lastFixedCommand, setLastFixedCommand] = useState('');
  const [isSupported, setIsSupported] = useState(false);
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
      const rawCommand = event.results[0][0].transcript.toLowerCase().trim();
      const fixedCommand = rawCommand
        .replace(/\bage\b/gi, 'h')
        .replace(/\beach\b/gi, 'h')
        .replace(/\bnight\b/gi, 'knight')
        .replace(/\bporn\b/gi, 'pawn');
      
      setLastCommand(rawCommand);
      setLastFixedCommand(fixedCommand);
      onVoiceCommand(fixedCommand);
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onVoiceCommand]);

  const handleClick = () => {
    if (!isSupported) return;
    
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
      
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
    <div style={{ 
      padding: '20px', 
      border: '2px solid #e2e8f0', 
      borderRadius: '12px',
      margin: '20px 0',
      backgroundColor: '#f8fafc',
      color: '#1f2937',
    }}>
      <h3>🎤 Voice Commands</h3>
      
      <VoiceButtonContainer 
        isListening={isListening} 
        disabled={false}
        onClick={handleClick}
      >
        <VoiceIcon isListening={isListening}>
          {isListening ? '🔴' : '🎤'}
        </VoiceIcon>
        {isListening ? 'Listening...' : 'Voice Command'}
      </VoiceButtonContainer>

      {lastCommand && (
        <div style={{ marginTop: '15px' }}>
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: '#fef2f2', 
            marginBottom: '5px', 
            borderRadius: '6px', 
            fontSize: '14px' 
          }}>
            <strong>Heard:</strong> "{lastCommand}"
          </div>
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '6px', 
            fontSize: '14px' 
          }}>
            <strong>Processed:</strong> "{lastFixedCommand}"
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '15px', 
        fontSize: '12px', 
        color: '#64748b', 
        lineHeight: '1.4' 
      }}>
        <strong>Examples:</strong><br />
        • "e4", "d3", "h4" (pawn moves)<br />
        • "knight to f3", "queen to h5"<br />
        • "knight takes c6", "e takes d5"<br />
        • "castle kingside", "undo"
      </div>
    </div>
  );
};