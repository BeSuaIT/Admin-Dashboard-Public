import React from 'react';
import styles from '../styles/ErrorPages.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <h1 className={styles.errorCode}>Oops!</h1>
            <h2 className={styles.errorTitle}>Đã xảy ra lỗi không mong muốn</h2>
            <p className={styles.errorMessage}>
              Ứng dụng đã gặp phải một lỗi không mong muốn. Chúng tôi xin lỗi về sự bất tiện này.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className={styles.errorDetails}>
                <summary>Chi tiết lỗi (chỉ hiển thị trong môi trường phát triển)</summary>
                <pre className={styles.errorStack}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className={styles.errorActions}>
              <button 
                className={styles.primaryButton}
                onClick={this.handleRefresh}
              >
                Tải lại trang
              </button>
              <button 
                className={styles.secondaryButton}
                onClick={this.handleGoHome}
              >
                Về trang chính
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;