import { useAuth as useMochaAuth } from '@getmocha/users-service/react';
import { useState, useEffect } from 'react';

// Enhanced auth hook that handles both Mocha OAuth and custom email/password auth
export function useAuth() {
  const mochaAuth = useMochaAuth();
  const [customUser, setCustomUser] = useState<any>(null);
  const [isLoadingCustom, setIsLoadingCustom] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check for custom session on mount
  useEffect(() => {
    const checkCustomSession = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced to 5 second timeout
        
        const response = await fetch('/api/users/me', {
          credentials: 'include',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const userData = await response.json();
          setCustomUser(userData);
        } else if (response.status >= 500) {
          console.error('Server error during session check:', response.status, response.statusText);
          // Don't set user on server errors, but don't throw either
        } else if (response.status === 401) {
          // User not authenticated, which is normal
          // Silent - no logging needed for normal unauthenticated state
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn('Session check timeout - continuing without authentication');
        } else {
          console.error('Session check error:', error.message);
        }
        // Don't throw errors during session check, just log them
      } finally {
        setIsLoadingCustom(false);
      }
    };

    // Only check custom session if Mocha auth doesn't have a user
    if (!mochaAuth.user && !mochaAuth.isFetching) {
      checkCustomSession();
    } else {
      setIsLoadingCustom(false);
    }
  }, [mochaAuth.user, mochaAuth.isFetching]);

  // Enhanced login redirect with timeout and error handling
  const redirectToLogin = async () => {
    if (isRedirecting) return; // Prevent multiple clicks
    
    setIsRedirecting(true);
    
    try {
      // Set a shorter timeout for better UX
      const timeout = setTimeout(() => {
        setIsRedirecting(false);
        console.warn('Login timeout - redirecting to login page');
        window.location.href = '/login';
      }, 3000); // Reduced to 3 second timeout
      
      if (mochaAuth.redirectToLogin) {
        await Promise.race([
          mochaAuth.redirectToLogin(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          )
        ]);
        clearTimeout(timeout);
      } else {
        clearTimeout(timeout);
        throw new Error('Mocha auth not available');
      }
    } catch (error: any) {
      console.error('Login redirect error:', error);
      setIsRedirecting(false);
      
      // Show user-friendly error message before redirecting
      if (error.message.includes('Timeout')) {
        console.log('Authentication taking too long, redirecting to manual login');
      }
      
      // Always redirect to login page on error
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  };

  // Custom logout function
  const logout = async () => {
    // Try both logout methods
    try {
      await fetch('/api/logout', { credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear custom user state
    setCustomUser(null);
    
    // Redirect to home page
    window.location.href = '/';
  };

  // Return combined auth state
  return {
    user: mochaAuth.user || customUser,
    isFetching: mochaAuth.isFetching || isLoadingCustom,
    redirectToLogin,
    isRedirecting,
    exchangeCodeForSessionToken: mochaAuth.exchangeCodeForSessionToken,
    logout,
  };
}
