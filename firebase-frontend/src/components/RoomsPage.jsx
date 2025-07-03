import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { database, storage } from "../firebase";
import { ref, onValue, remove } from "firebase/database";
import { ref as storageRef, deleteObject } from "firebase/storage";
import styles from "../styles/RoomsPage.module.css";

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);

    const usersRef = ref(database, "Users");
    const roomsRef = ref(database, "Rooms");

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = {};
        snapshot.forEach((childSnapshot) => {
          usersData[childSnapshot.key] = childSnapshot.val();
        });
        setUsers(usersData);
      }
    });

    const unsubscribeRooms = onValue(roomsRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomsData = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }));
        setRooms(roomsData);
      } else {
        setRooms([]);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRooms();
    };
  }, []);

  const handleDelete = async (roomId) => {
    const isConfirmed = window.confirm("Bạn có chắc chắn muốn xóa phòng này không?");
    if (!isConfirmed) return;

    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        throw new Error("Không tìm thấy thông tin phòng");
      }

      const imageUrls = room.images || [];

      for (const imageUrl of imageUrls) {
        try {
          if (imageUrl && typeof imageUrl === 'string') {
            const decodedUrl = decodeURIComponent(imageUrl);
            const startIndex = decodedUrl.indexOf('/o/') + 3;
            const endIndex = decodedUrl.indexOf('?');
            const filePath = decodedUrl.substring(startIndex, endIndex);
            const imageRef = storageRef(storage, filePath);
            await deleteObject(imageRef);
          }
        } catch (error) {
          console.error("Error deleting image:", error);
        }
      }

      await remove(ref(database, `Rooms/${roomId}`));

      alert("Xóa phòng thành công!");

    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Có lỗi xảy ra khi xóa phòng!");
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.address?.address_combine?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === "all" || room.roomType === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const roomTypes = [...new Set(rooms.map(room => room.roomType).filter(Boolean))];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Quản lý phòng trọ</h1>
        
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Tìm kiếm theo tên phòng hoặc địa chỉ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isLoading}
        />

        <div className={styles.filterContainer}>
          <select 
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className={styles.filterSelect}
            disabled={isLoading}
          >
            <option value="all">Tất cả loại phòng</option>
            {roomTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className={styles.roomGrid}>
          {isLoading ? (
            <div className={styles.loading}>Đang tải dữ liệu...</div>
          ) : filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <div key={room.id} className={styles.roomCard}>
                <img 
                  src={room.images?.[0] || '/placeholder-image.jpg'} 
                  alt="Room" 
                  className={styles.roomImage} 
                  onClick={() => navigate(`/dashboard/rooms/${room.id}`)} 
                />
                <div className={styles.roomInfo}>
                  <h2 className={styles.roomTitle}>{room.roomTitle}</h2>
                  <p className={styles.roomPrice}>
                    {room.roomPrice?.toLocaleString('vi-VN')} VNĐ/tháng
                  </p>
                  <p className={styles.roomType}>
                    🏠 {room.roomType}
                  </p>
                  <p className={styles.roomAddress}>
                    📍 {room.address?.address_combine || 'Chưa có địa chỉ'}
                  </p>
                  <p className={styles.ownerName}>
                    👤 {users[room.ownerID]?.name || "Unknown"}
                  </p>
                  <p className={styles.roomArea}>
                    📐 {room.roomSize} m²
                  </p>
                  <p className={styles.roomStatus}>
                    🔄 {room.roomStatus === 0 ? 'Còn trống' : 'Đã thuê'}
                  </p>
                  <p className={styles.roomDeposit}>
                    💰 Đặt cọc: {room.roomDeposit?.toLocaleString('vi-VN')} VNĐ
                  </p>
                  <p className={styles.roomPeople}>
                    👥 Tối đa: {room.people_in_room} người
                  </p>
                  <div className={styles.actionButtons}>
                    <button 
                      onClick={() => navigate(`/dashboard/rooms/${room.id}`)}
                      className={styles.buttonView}
                    >
                      Xem chi tiết
                    </button>
                    <button 
                      onClick={() => handleDelete(room.id)} 
                      className={styles.buttonDelete}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noData}>Không có phòng nào</p>
          )}
        </div>

        <div className={styles.statistics}>
          <p>Tổng số phòng: {rooms.length}</p>
          <p>Đang hiển thị: {filteredRooms.length}</p>
        </div>
      </div>
    </div>
  );
};

export default RoomsPage;
