import React, { useState, useEffect } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { database } from '../firebase';
import styles from '../styles/BillsPage.module.css';
import BillDetailPopup from './BillDetailPopup';
import { FaSearch } from 'react-icons/fa';

const BillsPage = () => {
    const [bills, setBills] = useState([]);
    const [services, setServices] = useState({});
    const [users, setUsers] = useState({});
    const [selectedBill, setSelectedBill] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingBill, setEditingBill] = useState(null);
    const [tempStatus, setTempStatus] = useState(null);
    const userRole = localStorage.getItem('userRole');
    const currentUserId = localStorage.getItem('userId');

    useEffect(() => {
        const unsubscribes = [];

        const usersRef = ref(database, 'Users');
        const unsubUsers = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                setUsers(snapshot.val());
            }
        });
        unsubscribes.push(unsubUsers);

        const servicesRef = ref(database, 'Services');
        const unsubServices = onValue(servicesRef, (snapshot) => {
            if (snapshot.exists()) {
                const servicesData = snapshot.val();
                setServices(servicesData);
            }
        });
        unsubscribes.push(unsubServices);

        const billsRef = ref(database, 'Bills');
        const unsubBills = onValue(billsRef, (snapshot) => {
            if (snapshot.exists()) {
                const billsData = snapshot.val();
                const billsArray = Object.entries(billsData).map(([id, data]) => ({
                    id,
                    ...data,
                    buyerInfo: users[data.userId] || {},
                    sellerInfo: users[data.sellerId] || {}
                }));

                const filteredBills = userRole === 'Admin'
                    ? billsArray
                    : billsArray.filter(bill => bill.sellerId === currentUserId);

                setBills(filteredBills);
            } else {
                setBills([]);
            }
        });
        unsubscribes.push(unsubBills);

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [currentUserId, userRole, users]);

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
            case 0:
                return 'Chờ xử lý';
            case 1:
                return 'Hoàn thành';
            case 2:
                return 'Đã hủy';
            default:
                return 'Không xác định';
        }
    };

    const updateServiceSoldCount = async (billItems) => {
        try {
            if (!billItems) return;

            const servicesRef = ref(database, 'Services');
            const servicesSnapshot = await get(servicesRef);
            
            if (servicesSnapshot.exists()) {
                const servicesData = servicesSnapshot.val();
                
                // Duyệt qua từng item trong bill
                for (const [serviceId, quantity] of Object.entries(billItems)) {
                    // Tìm service trong flat structure
                    if (servicesData[serviceId]) {
                        const currentSold = servicesData[serviceId].sold || 0;
                        const newSoldCount = currentSold + parseInt(quantity);
                        
                        // Cập nhật sold count
                        const serviceUpdateRef = ref(database, `Services/${serviceId}`);
                        await update(serviceUpdateRef, {
                            sold: newSoldCount
                        });
                        
                        console.log(`Updated service ${serviceId} sold count: ${currentSold} + ${quantity} = ${newSoldCount}`);
                    }
                }
            }
        } catch (error) {
            console.error("Error updating service sold count:", error);
        }
    };

    const handleStatusChange = async (billId) => {
        try {
            const bill = bills.find(b => b.id === billId);
            const newStatus = parseInt(tempStatus);
            const oldStatus = bill.status;
            const billRef = ref(database, `Bills/${billId}`);
            await update(billRef, {
                status: newStatus
            });

            if (oldStatus !== 1 && newStatus === 1) {
                console.log('Bill completed, updating service sold counts...');
                await updateServiceSoldCount(bill.items);
            }

            setEditingBill(null);
            setTempStatus(null);
            
            alert("Cập nhật trạng thái thành công!");
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Cập nhật trạng thái thất bại!");
        }
    };

    const handleCancelEdit = () => {
        setEditingBill(null);
        setTempStatus(null);
    };

    const formatAddress = (bill) => {
        if (bill.address) {
            return bill.address || 'N/A';
        }
    };

    const filteredBills = bills.filter(bill =>
        bill.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Quản lý Bills</h1>

            <div className={styles.toolBar}>
                <div className={styles.searchBar}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm mã đơn hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Mã đơn hàng</th>
                            <th>Ngày đặt</th>
                            <th>Người mua</th>
                            <th>Người bán</th>
                            <th>Địa chỉ</th>
                            <th>Phương thức TT</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBills.map((bill) => (
                            <tr key={bill.id}>
                                <td>{bill.id}</td>
                                <td>{formatDate(bill.orderDate)}</td>
                                <td>{bill.buyerInfo.name || 'N/A'}</td>
                                <td>{bill.sellerInfo.name || 'N/A'}</td>
                                <td className={styles.addressCell}>
                                    {formatAddress(bill)}
                                </td>
                                <td>{bill.paymentMethod === 'cod' ? 'Tiền mặt' : bill.paymentMethod}</td>
                                <td>{bill.totalAmount.toLocaleString('vi-VN')} VNĐ</td>
                                <td>
                                    {editingBill === bill.id ? (
                                        <div className={styles.editStatusContainer}>
                                            <select
                                                value={tempStatus ?? bill.status}
                                                onChange={(e) => setTempStatus(e.target.value)}
                                                className={styles.statusSelect}
                                            >
                                                <option value={0}>Chờ xử lý</option>
                                                <option value={1}>Hoàn thành</option>
                                                <option value={2}>Đã hủy</option>
                                            </select>
                                            <div className={styles.editActions}>
                                                <button
                                                    className={styles.saveButton}
                                                    onClick={() => handleStatusChange(bill.id)}
                                                >
                                                    Lưu
                                                </button>
                                                <button
                                                    className={styles.cancelButton}
                                                    onClick={handleCancelEdit}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className={`${styles.status} ${styles[`status${bill.status}`]}`}>
                                            {getStatusText(bill.status)}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <div className={styles.actionButtons}>
                                        <button
                                            className={styles.viewButton}
                                            onClick={() => setSelectedBill(bill)}
                                        >
                                            Xem chi tiết
                                        </button>
                                        {bill.status !== 1 && (
                                            <button
                                                className={styles.editButton}
                                                onClick={() => setEditingBill(bill.id)}
                                            >
                                                Sửa
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedBill && (
                <BillDetailPopup
                    bill={{
                        ...selectedBill,
                        serviceDetails: services
                    }}
                    onClose={() => setSelectedBill(null)}
                />
            )}
        </div>
    );
};

export default BillsPage;