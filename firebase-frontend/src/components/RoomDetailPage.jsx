import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import styles from "../styles/RoomDetailPage.module.css";

const RoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [owner, setOwner] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const roomSnapshot = await get(ref(database, `Rooms/${id}`));
        if (roomSnapshot.exists()) {
          const roomData = roomSnapshot.val();
          setRoom(roomData);
          if (roomData.ownerID) {
            const ownerSnapshot = await get(ref(database, `Users/${roomData.ownerID}`));
            if (ownerSnapshot.exists()) {
              setOwner(ownerSnapshot.val());
            }
          }
        } else {
          console.error("Room not found");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className={styles.container}>
        <button className={styles.buttonBack} onClick={() => navigate(-1)}>Quay lại</button>
        <div className={styles.error}>Không tìm thấy phòng này</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.buttonBack} onClick={() => navigate(-1)}>Quay lại</button>

      <div className={styles.imageGallery}>
        {room.images && room.images.length > 0 ? (
          room.images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Room ${index + 1}`}
              className={styles.detailImage}
              onClick={() => setZoomImage(img)}
            />
          ))
        ) : (
          <div className={styles.noImages}>Không có hình ảnh</div>
        )}
      </div>
        
      <div className={styles.roomCard}>
        <h1 className={styles.title}>{room.roomTitle}</h1>
        <p className={styles.detailPrice}>
          💰 {room.roomPrice?.toLocaleString('vi-VN')} VNĐ/tháng
        </p>
        <p className={styles.detailDeposit}>
          💰 Đặt cọc: {room.roomDeposit?.toLocaleString('vi-VN')} VNĐ
        </p>
        <p className={styles.detailAddress}>
          📍 {room.address?.address_combine || 'Chưa có địa chỉ'}
        </p>
        <p className={styles.detailPhone}>📞 Liên hệ: {room.phone}</p>
        <p className={styles.ownerInfo}>
          👤 Chủ trọ: {owner?.name || "Unknown"}
          {owner?.email && <span className={styles.ownerEmail}> ({owner.email})</span>}
        </p>
        <p className={styles.roomType}>🏠 Loại phòng: {room.roomType}</p>
        <p className={styles.roomStatus}>
          🔄 Trạng thái: {room.roomStatus === 0 ? 'Còn trống' : 'Đã thuê'}
        </p>
        <p className={styles.genderRoom}>
          👫 Giới tính: {room.gender || 'Không yêu cầu'}
        </p>

        <div className={styles.description}>
          <h3>Mô tả</h3>
          <p>{room.description || 'Chưa có mô tả'}</p>
        </div>

        <div className={styles.infoContainer}>
          <h3>Thông tin cơ bản</h3>
          <div className={styles.infoBoxContainer}>
            <div className={styles.infoBox}>
              <p>📏 Diện tích: {room.roomSize} m²</p>
              <p>🏢 Tầng: {room.floor}</p>
              <p>👥 Số người tối đa: {room.people_in_room}</p>
              <p>🚗 Chỗ đậu xe: {room.park_slot}</p>
            </div>
            
            <div className={styles.infoBox}>
              <p>🔌 Giá điện: {room.electricPrice?.toLocaleString('vi-VN')} VNĐ/kWh</p>
              <p>💧 Giá nước: {room.waterPrice?.toLocaleString('vi-VN')} VNĐ/tháng</p>
              <p>🌐 Giá internet: {room.internetPrice?.toLocaleString('vi-VN')} VNĐ/tháng</p>
            </div>
          </div>
        </div>

        {room.Utilities && room.Utilities.length > 0 && (
          <div className={styles.section}>
            <h3>Tiện ích</h3>
            <div className={styles.iconGrid}>
              {room.Utilities.map((item, index) => (
                <div key={index} className={styles.iconItem}>
                  {item.img && <img src={item.img} alt={item.name} />}
                  <p>{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {room.Furniture && room.Furniture.length > 0 && (
          <div className={styles.section}>
            <h3>Nội thất</h3>
            <div className={styles.iconGrid}>
              {room.Furniture.map((item, index) => (
                <div key={index} className={styles.iconItem}>
                  {item.img && <img src={item.img} alt={item.name} />}
                  <p>{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {room.userLovePost && Object.keys(room.userLovePost).length > 0 && (
          <div className={styles.section}>
            <h3>Số người yêu thích phòng này</h3>
            <p>❤️ {Object.keys(room.userLovePost).length} người đã yêu thích</p>
          </div>
        )}

        <div className={styles.additionalInfo}>
          <h3>Thông tin thêm</h3>
          <p>📅 Ngày đăng: {room.timestamp ? new Date(room.timestamp).toLocaleDateString('vi-VN') : 'Không rõ'}</p>
          <p>🆔 ID phòng: {room.roomID}</p>
          <p>🔄 Trạng thái: {room.status_room === 0 ? 'Còn trống' : 'Đã thuê'}</p>
        </div>
      </div>

      {zoomImage && (
        <div className={styles.zoomOverlay} onClick={() => setZoomImage(null)}>
          <div className={styles.zoomContainer} onClick={(e) => e.stopPropagation()}>
            <img src={zoomImage} alt="Zoomed" className={styles.zoomImage} />
            <button className={styles.closeZoom} onClick={() => setZoomImage(null)}>✖</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetailPage;
