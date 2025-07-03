import { useNavigate } from 'react-router-dom';
import styles from '../styles/ErrorPages.module.css';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    navigate('/');
  };

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <h1 className={styles.errorCode}>403</h1>
        <h2 className={styles.errorTitle}>Truy cập bị từ chối</h2>
        <p className={styles.errorMessage}>
          Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ admin để được cấp quyền.
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
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;