import React from 'react';
import styles from '../styles/SessionWarningModal.module.css';

const SessionWarningModal = ({ timeLeft, onContinue, onLogout }) => {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>⚠️ Cảnh báo phiên đăng nhập</h2>
        </div>
        
        <div className={styles.content}>
          <p>Phiên đăng nhập của bạn sắp hết hạn do không có hoạt động.</p>
          <p>Thời gian còn lại: <span className={styles.timer}>{formatTime(timeLeft)}</span></p>
          <p>Bạn có muốn tiếp tục sử dụng không?</p>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.continueButton}
            onClick={onContinue}
          >
            Tiếp tục
          </button>
          <button 
            className={styles.logoutButton}
            onClick={onLogout}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;