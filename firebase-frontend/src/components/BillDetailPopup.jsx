import { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, get } from 'firebase/database';
import styles from '../styles/BillDetailPopup.module.css';
import { FaTimes } from 'react-icons/fa';

const BillDetailPopup = ({ bill, onClose }) => {
  const [serviceDetails, setServiceDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const serviceDetailsMap = {};
        const serviceIds = Object.keys(bill.items || {});
        for (const serviceId of serviceIds) {
          const serviceRef = ref(database, `Services/${serviceId}`);
          const serviceSnapshot = await get(serviceRef);
          
          if (serviceSnapshot.exists()) {
            serviceDetailsMap[serviceId] = serviceSnapshot.val();
          }
        }
        
        setServiceDetails(serviceDetailsMap);
      } catch (error) {
        console.error('Error fetching service details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [bill]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Chờ xử lý';
      case 1: return 'Đang xử lý';
      case 2: return 'Hoàn thành';
      case 3: return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const formatAddress = () => {
    if (bill.address) {
      return bill.address;
    }
  };

  if (loading) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
          <div className={styles.loading}>
            Đang tải thông tin dịch vụ...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>

        <div className={styles.billHeader}>
          <h2>Chi tiết đơn hàng #{bill.id}</h2>
          <span className={`${styles.status} ${styles[`status${bill.status}`]}`}>
            {getStatusText(bill.status)}
          </span>
        </div>

        <div className={styles.billInfo}>
          <div className={styles.infoGrid}>
            <div className={styles.section}>
              <h3>🛍️ Thông tin đơn hàng</h3>
              <p><strong>Mã đơn hàng:</strong> {bill.id}</p>
              <p><strong>Ngày đặt:</strong> {formatDate(bill.orderDate)}</p>
              <p><strong>Phương thức thanh toán:</strong> {
                bill.paymentMethod === 'cod' ? '💵 Tiền mặt khi giao hàng' : 
                bill.paymentMethod === 'banking' ? '🏦 Chuyển khoản' :
                bill.paymentMethod || 'N/A'
              }</p>
              <p><strong>Tổng tiền:</strong> 
                <span className={styles.totalAmount}>
                  {bill.totalAmount.toLocaleString('vi-VN')} VNĐ
                </span>
              </p>
            </div>

            <div className={styles.section}>
              <h3>👤 Thông tin khách hàng</h3>
              <p><strong>Tên:</strong> {bill.buyerInfo?.name || 'N/A'}</p>
              <p><strong>Số điện thoại:</strong> {bill.buyerInfo?.phone || 'N/A'}</p>
              <p><strong>Email:</strong> {bill.buyerInfo?.email || 'N/A'}</p>
              <p><strong>Địa chỉ giao hàng:</strong> 
                <span className={styles.addressText}>
                  {formatAddress()}
                </span>
              </p>
            </div>

            <div className={styles.section}>
              <h3>🏪 Thông tin người bán</h3>
              <p><strong>Tên:</strong> {bill.sellerInfo?.name || 'N/A'}</p>
              <p><strong>Số điện thoại:</strong> {bill.sellerInfo?.phone || 'N/A'}</p>
              <p><strong>Email:</strong> {bill.sellerInfo?.email || 'N/A'}</p>
              <p><strong>Vai trò:</strong> {bill.sellerInfo?.role || 'N/A'}</p>
            </div>
          </div>

          <div className={styles.section}>
            <h3>📦 Dịch vụ đã đặt</h3>
            {Object.keys(bill.items || {}).length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Tên dịch vụ</th>
                      <th>Mã dịch vụ</th>
                      <th>Danh mục</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(bill.items).map(([serviceId, quantity]) => {
                      const service = serviceDetails[serviceId] || {};
                      const price = service.price || 0;
                      const subtotal = price * quantity;
                      return (
                        <tr key={serviceId}>
                          <td>
                            <span className={styles.serviceTitle}>
                              {service.title || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={styles.serviceId}>
                              {service.serviceId || serviceId}
                            </span>
                          </td>
                          <td>
                            <span className={styles.serviceCategory}>
                              {service.category || 'N/A'}
                            </span>
                          </td>
                          <td className={styles.quantityCell}>
                            <span className={styles.quantity}>
                              {quantity}
                            </span>
                          </td>
                          <td>
                            <span className={styles.price}>
                              {price > 0 ? `${price.toLocaleString('vi-VN')} VNĐ` : 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={styles.subtotal}>
                              {subtotal > 0 ? `${subtotal.toLocaleString('vi-VN')} VNĐ` : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className={styles.totalRow}>
                      <td colSpan="6"><strong>Tổng cộng:</strong></td>
                      <td>
                        <strong className={styles.finalTotal}>
                          {bill.totalAmount.toLocaleString('vi-VN')} VNĐ
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className={styles.noItems}>
                <p>Không có dịch vụ nào trong đơn hàng này</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillDetailPopup;