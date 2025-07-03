import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import styles from "../styles/ServiceDetailPage.module.css";
import EditServicePopup from './EditServicePopup';

const ServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoomImage, setZoomImage] = useState(null);
  const [owner, setOwner] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    const fetchServiceAndOwner = async () => {
      try {
        let serviceData;
        if (location.state?.serviceData) {
          serviceData = location.state.serviceData;
          setService(serviceData);
        } else {
          const serviceRef = ref(database, `Services/${id}`);
          const snapshot = await get(serviceRef);
          
          if (snapshot.exists()) {
            serviceData = { id, ...snapshot.val() };
            setService(serviceData);
          }
        }

        if (serviceData?.id_seller) {
          const ownerRef = ref(database, `Users/${serviceData.id_seller}`);
          const ownerSnapshot = await get(ownerRef);
          if (ownerSnapshot.exists()) {
            setOwner(ownerSnapshot.val());
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchServiceAndOwner();
  }, [id, location.state]);

  const handleEditSuccess = async () => {
    const serviceRef = ref(database, `Services/${id}`);
    const snapshot = await get(serviceRef);
    if (snapshot.exists()) {
      setService({ id, ...snapshot.val() });
    }
    setShowEditForm(false);
  };

  const getServiceImages = (service) => {
    if (!service.images) return [];
    
    return Object.entries(service.images).map(([key, url]) => ({
      url: url,
      alt: `${service.title} - ${key}`
    }));
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (!service) return <div className={styles.error}>Không tìm thấy dịch vụ</div>;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/dashboard/services')}
          >
            Quay lại
          </button>
          <h1 className={styles.title}>{service.title}</h1>
          <button 
            className={styles.editButton}
            onClick={() => setShowEditForm(true)}
          >
            Chỉnh sửa
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.imageContainer}>
            {getServiceImages(service).map((image, index) => (
              <img
                key={index}
                src={image.url}
                alt={image.alt}
                className={styles.serviceImage}
                onClick={() => setZoomImage(image.url)}
              />
            ))}
          </div>

          <div className={styles.infoContainer}>
            <div className={styles.typeSection}>
              <span className={styles.typeLabel}>🏷️ Danh mục dịch vụ:</span>
              <span className={styles.typeValue}>
                {service.category}
              </span>
            </div>

            <div className={styles.ownerSection}>
              <span className={styles.ownerLabel}>👤 Người đăng:</span>
              <span className={styles.ownerInfo}>
                {owner?.name || "Unknown"}
                {owner?.email && (
                  <span className={styles.ownerEmail}>
                    ({owner.email})
                  </span>
                )}
              </span>
            </div>

            <div className={styles.priceSection}>
              <span className={styles.priceLabel}>Giá:</span>
              <span className={styles.priceValue}>
                {service.price ? `${service.price.toLocaleString()} VND` : "Chưa cập nhật"}
              </span>
            </div>

            <div className={styles.soldSection}>
              <span className={styles.soldLabel}>Số lượng đã bán:</span>
              <span className={styles.soldValue}>{service.sold || 0}</span>
            </div>
            
            <div className={styles.descriptionSection}>
              <h3>Mô tả dịch vụ:</h3>
              <p className={styles.description}>
                {service.description || "Chưa có mô tả"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {zoomImage && (
        <div 
          className={styles.zoomOverlay} 
          onClick={() => setZoomImage(null)}
        >
          <div 
            className={styles.zoomContainer} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className={styles.closeZoom}
              onClick={() => setZoomImage(null)}
            >
              ✖
            </button>
            <img 
              src={zoomImage} 
              alt="Zoomed" 
              className={styles.zoomImage} 
            />
          </div>
        </div>
      )}

      {showEditForm && (
        <EditServicePopup
          service={service}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default ServiceDetailPage;
