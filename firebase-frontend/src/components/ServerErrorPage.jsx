import { useNavigate } from 'react-router-dom';
import styles from '../styles/ErrorPages.module.css';

const ServerErrorPage = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <h1 className={styles.errorCode}>500</h1>
        <h2 className={styles.errorTitle}>Lỗi máy chủ</h2>
        <p className={styles.errorMessage}>
          Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau hoặc liên hệ với quản trị viên.
        </p>
        <div className={styles.errorActions}>
          <button 
            className={styles.primaryButton}
            onClick={handleRefresh}
          >
            Tải lại trang
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={() => navigate('/dashboard')}
          >
            Về trang chính
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerErrorPage;