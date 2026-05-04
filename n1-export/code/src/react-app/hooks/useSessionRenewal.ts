import { useEffect, useRef } from 'react';
import { useApi } from './useApi';

export function useSessionRenewal() {
  const { renewSession } = useApi();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    // Track user activity
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Add activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Set up session renewal interval (every 10 minutes)
    intervalRef.current = setInterval(async () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // Only renew if user has been active in the last 14 minutes
      // This gives 1 minute buffer before the 15-minute expiration
      if (timeSinceLastActivity < 14 * 60 * 1000) {
        try {
          await renewSession();
        } catch (error) {
          // If renewal fails, user might be logged out
          console.warn('Session renewal failed:', error);
        }
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [renewSession]);

  return null;
}
