import React, { createContext, useContext, useState } from 'react';
import useSessionTimeout from '../hooks/useSessionTimeout';
import SessionWarningModal from './SessionWarningModal';

const SessionTimeoutContext = createContext();

export const useSessionTimeoutContext = () => {
  const context = useContext(SessionTimeoutContext);
  if (!context) {
    throw new Error('useSessionTimeoutContext must be used within SessionTimeoutProvider');
  }
  return context;
};

const SessionTimeoutProvider = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const handleWarning = () => {
    setShowWarning(true);
    setTimeLeft(300); // 5 phút = 300 giây
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowWarning(false);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogout = () => {
    console.log('Đăng xuất do hết thời gian session');
    alert('Phiên đăng nhập đã hết hạn. Bạn sẽ được chuyển về trang đăng nhập.');
  };

  const { resetTimer, logout } = useSessionTimeout({
    timeout: 30 * 60 * 1000, // 30 phút
    warningTime: 5 * 60 * 1000, // Cảnh báo trước 5 phút
    onLogout: handleLogout,
    onWarning: handleWarning
  });

  const handleContinueSession = () => {
    setShowWarning(false);
    resetTimer();
  };

  const handleEndSession = () => {
    setShowWarning(false);
    logout();
  };

  const contextValue = {
    resetTimer,
    logout
  };

  return (
    <SessionTimeoutContext.Provider value={contextValue}>
      {children}
      
      {showWarning && (
        <SessionWarningModal
          timeLeft={timeLeft}
          onContinue={handleContinueSession}
          onLogout={handleEndSession}
        />
      )}
    </SessionTimeoutContext.Provider>
  );
};

export default SessionTimeoutProvider;