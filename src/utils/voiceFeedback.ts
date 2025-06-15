// utils/voiceFeedback.ts
export const speakText = (text: string): void => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.log('Speech synthesis not supported');
      return;
    }
  
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    utterance.lang = 'en-US';
    
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  };
  
  export const announceMove = (description: string): void => {
    speakText(`Moved ${description}`);
  };
  
  export const announceUndo = (): void => {
    speakText('Move undone');
  };
  
  export const announceIllegalMove = (): void => {
    speakText('Illegal move');
  };
  
  export const announceNotUnderstood = (command: string): void => {
    speakText(`I don't understand: ${command}`);
  };
  
  export const announceGameStatus = (status: string): void => {
    speakText(status);
  };