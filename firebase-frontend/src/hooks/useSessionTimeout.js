import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const useSessionTimeout = ({ 
  timeout = 10 * 60 * 1000, // 10 phút
  warningTime = 5 * 60 * 1000, // Cảnh báo trước 5 phút
  onLogout,
  onWarning 
}) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const logout = useCallback(() => {
    // Clear timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Clear localStorage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('lastActivity');

    // Call custom logout function if provided
    if (onLogout) {
      onLogout();
    }

    // Navigate to login
    navigate('/', { replace: true });
  }, [navigate, onLogout]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem('lastActivity', now.toString());

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Set warning timer
    warningRef.current = setTimeout(() => {
      if (onWarning) {
        onWarning();
      } else {
        // Default warning
        const shouldContinue = window.confirm(
          'Phiên đăng nhập của bạn sắp hết hạn. Bạn có muốn tiếp tục không?'
        );
        
        if (shouldContinue) {
          // Reset timer again if user chooses to continue
          resetTimer();
        } else {
          logout();
        }
      }
    }, timeout - warningTime);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeout);
  }, [timeout, warningTime, onWarning, logout]);

  const checkActivity = useCallback(() => {
    const lastActivity = localStorage.getItem('lastActivity');
    const now = Date.now();

    if (lastActivity) {
      const timeSinceLastActivity = now - parseInt(lastActivity);
      
      if (timeSinceLastActivity >= timeout) {
        logout();
        return;
      }
      
      // If there's recent activity from another tab, reset timer
      if (timeSinceLastActivity < (lastActivityRef.current - now + 5000)) {
        resetTimer();
      }
    }
  }, [timeout, logout, resetTimer]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return;
    }

    // Check for existing activity
    checkActivity();

    // Events to track user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check activity periodically (for multiple tabs)
    const activityCheckInterval = setInterval(checkActivity, 60000); // Check every minute

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      clearInterval(activityCheckInterval);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [handleActivity, checkActivity, resetTimer]);

  return { resetTimer, logout };
};

export default useSessionTimeout;