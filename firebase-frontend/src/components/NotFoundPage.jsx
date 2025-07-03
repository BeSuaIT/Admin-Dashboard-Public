import { useNavigate } from 'react-router-dom';
import styles from '../styles/ErrorPages.module.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.errorTitle}>Trang không tìm thấy</h2>
        <p className={styles.errorMessage}>
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <div className={styles.errorActions}>
          <button 
            className={styles.primaryButton}
            onClick={() => navigate('/dashboard')}
          >
            Về trang chính
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;