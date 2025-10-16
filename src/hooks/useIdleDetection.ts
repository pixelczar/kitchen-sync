import { useEffect, useState } from 'react';

export const useIdleDetection = (idleTimeMs: number = 300000) => { // Default 5 minutes
  const [isIdle, setIsIdle] = useState(false);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsIdle(true);
      }, idleTimeMs);
    };
    
    // Events to listen for
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });
    
    // Initialize timer
    resetTimer();
    
    // Cleanup
    return () => {
      clearTimeout(timeout);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [idleTimeMs]);
  
  return isIdle;
};

