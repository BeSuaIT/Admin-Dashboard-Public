import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { database, storage} from "../firebase";
import { ref, onValue, set } from "firebase/database";
import { ref as storageRef, deleteObject } from "firebase/storage";
import styles from "../styles/ServicesPage.module.css";
import AddServicePopup from './AddServicePopup';
import { FaSearch } from 'react-icons/fa';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userId');

  const serviceCategories = [
    { key: "all", label: "Tất cả dịch vụ" },
    { key: "Cho thuê nội thất", label: "Cho thuê nội thất" },
    { key: "Tư vấn thiết kế phòng", label: "Tư vấn thiết kế phòng" },
    { key: "Sửa chữa điện nước", label: "Sửa chữa điện nước" },
    { key: "Giặt là", label: "Giặt là" },
    { key: "Đổi bình nước", label: "Đổi bình nước" },
    { key: "Đổi bình ga", label: "Đổi bình ga" },
  ];

  const getFirstImage = (service) => {
    if (service.images && typeof service.images === 'object') {
      const firstImage = Object.values(service.images)[0];
      return firstImage || "/default-service.jpg";
    }
    return "/default-service.jpg";
  };

  useEffect(() => {
    setIsLoading(true);
    
    const usersRef = ref(database, "Users");
    const servicesRef = ref(database, "Services");

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      let usersData = {};
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          usersData[childSnapshot.key] = childSnapshot.val();
        });
      }

      const unsubscribeServices = onValue(servicesRef, (servicesSnapshot) => {
        if (servicesSnapshot.exists()) {
          const servicesData = servicesSnapshot.val();
          const servicesArray = Object.entries(servicesData)
            .map(([serviceId, serviceData]) => ({
              id: serviceId,
              ...serviceData,
              ownerName: usersData[serviceData.id_seller]?.name || "Unknown"
            }))
            .filter(service => service.id_seller === currentUserId);
          
          setServices(servicesArray);
        } else {
          setServices([]);
        }
        setIsLoading(false);
      });

      return unsubscribeServices;
    });

    return () => {
      unsubscribeUsers();
    };
  }, [currentUserId]);

  const displayedServices = services.filter(service => {
    if (selectedCategory !== "all" && service.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const filteredServices = displayedServices.filter((service) =>
    service.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (serviceId) => {
    if (!serviceId) return;

    const isConfirmed = window.confirm("Bạn có chắc chắn muốn xóa dịch vụ này không?");
    if (!isConfirmed) return;

    try {
      const service = services.find(s => s.id === serviceId);
      
      if (service.id_seller !== currentUserId) {
        alert("Bạn không có quyền xóa dịch vụ này!");
        return;
      }
      
      if (service.images) {
        for (const imageUrl of Object.values(service.images)) {
          try {
            const decodedUrl = decodeURIComponent(imageUrl);
            const startIndex = decodedUrl.indexOf('/o/') + 3;
            const endIndex = decodedUrl.indexOf('?');
            const filePath = decodedUrl.substring(startIndex, endIndex);
            const imageRef = storageRef(storage, filePath);
            await deleteObject(imageRef);
          } catch (error) {
            console.error("Error deleting image:", error);
          }
        }
      }

      const serviceRef = ref(database, `Services/${serviceId}`);
      await set(serviceRef, null);

      alert("Xóa dịch vụ thành công!");
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Có lỗi xảy ra khi xóa dịch vụ!");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý dịch vụ của tôi</h1>
        <button 
          className={styles.addButton}
          onClick={() => setShowAddForm(true)}
        >
          Thêm mới
        </button>
      </div>
      
      <div className={styles.toolBar}>
        <div className={styles.searchBar}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm kiếm dịch vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {serviceCategories.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.tab} ${
                selectedCategory === key ? styles.activeTab : ""
              }`}
              onClick={() => setSelectedCategory(key)}
              disabled={isLoading}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.statsContainer}>
          <p className={styles.statsText}>
            Dịch vụ của bạn: {displayedServices.length}
          </p>
          <p className={styles.statsText}>
            Đang hiển thị: {filteredServices.length}
          </p>
        </div>
      </div>

      <div className={styles.servicesContainer}>
        <div className={styles.roomGrid}>
          {isLoading ? (
            <div className={styles.loading}>Đang tải dữ liệu...</div>
          ) : filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <div key={service.id} className={styles.roomCard}>
                <img
                  src={getFirstImage(service)}
                  alt="Service"
                  className={styles.roomImage}
                  onClick={() =>
                    navigate(`/dashboard/services/${service.id}`, {
                      state: {
                        serviceData: service,
                      },
                    })
                  }
                />
                <div className={styles.serviceInfo}>
                  <h2 className={styles.roomTitle}>
                    {service.title || "Chưa có tiêu đề"}
                  </h2>
                  <p className={styles.serviceType}>
                    🏷️ {service.category}
                  </p>
                  <p className={styles.roomPrice}>
                    {service.price ? `${service.price.toLocaleString()} VND` : "Chưa cập nhật"}
                  </p>
                  <p className={styles.ownerName}>
                    👤 {service.ownerName}
                  </p>
                  <p className={styles.serviceStats}>
                    📊 Đã bán: {service.sold || 0}
                  </p>
                  <p className={styles.createdDate}>
                    📅 {service.createdAt ? new Date(service.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </p>
                  
                  <div className={styles.actionButtons}>
                    <button
                      onClick={() =>
                        navigate(`/dashboard/services/${service.id}`, {
                          state: {
                            serviceData: service,
                          },
                        })
                      }
                      className={styles.viewButton}
                    >
                      Xem chi tiết
                    </button>
                    
                    <button
                      onClick={() => handleDelete(service.id)}
                      className={styles.buttonDelete}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noData}>
              <p>
                {selectedCategory === "all" 
                  ? "Bạn chưa có dịch vụ nào" 
                  : `Bạn chưa có dịch vụ nào trong danh mục "${selectedCategory}"`
                }
              </p>
            </div>
          )}
        </div>
      </div>
      {showAddForm && (
        <AddServicePopup 
          onClose={() => setShowAddForm(false)}
          userId={currentUserId}
          onSuccess={() => {
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
};

export default ServicesPage;
