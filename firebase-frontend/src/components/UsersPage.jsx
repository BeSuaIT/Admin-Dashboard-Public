import { useEffect, useState } from "react";
import { database, storage } from "../firebase";
import { ref, get, update, set, remove } from "firebase/database";
import { ref as storageRef, deleteObject} from "firebase/storage";
import { getAuth, sendPasswordResetEmail} from "firebase/auth";
import styles from "../styles/UsersPage.module.css";
import AddUserPopup from './AddUserPopup';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("email");
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ 
    email: "", 
    name: "", 
    password: "", 
    phone: "",
    role: "Người thuê" 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("all");
  const usersPerPage = 10;
  const auth = getAuth();

  const fetchUsers = async () => {
    try {
      const response = await fetch("YOUR_API");
      const authUsers = await response.json();
  
      const snapshot = await get(ref(database, "Users"));
      const dbUsers = snapshot.exists()
        ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }))
        : [];
  
      const mergedUsers = authUsers.map((authUser) => {
        const dbUser = dbUsers.find((u) => u.email === authUser.email);
        return {
          id: authUser.uid,
          email: authUser.email,
          name: dbUser?.name || "Chưa có tên",
          phone: dbUser?.phone || "Chưa cập nhật",
          role: dbUser?.role || "Người thuê",
          disabled: authUser.disabled,
        };
      });

      setUsers(mergedUsers);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách user:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId, e) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này? Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn!")) {
      return;
    }
    
    const originalButton = e.target;
    originalButton.disabled = true;
    originalButton.textContent = "Đang xóa...";
    
    try {
      console.log("Bắt đầu xóa user và dữ liệu liên quan:", userId);
      
      await deleteUserServices(userId);
      await deleteUserRooms(userId);
      await deleteUserBills(userId);
      await deleteUserContracts(userId);
      await deleteUserMeetingSchedules(userId);
      await deleteUserFromCartsAndUserData(userId);
      await deleteUserLovePostFromRooms(userId);
      await deleteUserImages(userId);
      await remove(ref(database, `Users/${userId}`));
      await fetch(`YOUR_API`, {
        method: "DELETE",
      });

      alert("Đã xóa người dùng và tất cả dữ liệu liên quan thành công!");
      
      setUsers(users.filter((user) => user.id !== userId));
      
    } catch (error) {
      console.error("Lỗi khi xóa user và dữ liệu liên quan:", error);
      alert("Có lỗi xảy ra khi xóa người dùng. Vui lòng thử lại!");
    } finally {
      originalButton.disabled = false;
      originalButton.textContent = "Xóa";
    }
  };

  const deleteUserServices = async (userId) => {
    try {
      const servicesRef = ref(database, "Services");
      const servicesSnapshot = await get(servicesRef);
      
      if (servicesSnapshot.exists()) {
        const services = servicesSnapshot.val();
        const deletePromises = [];
        
        for (const [serviceId, serviceData] of Object.entries(services)) {
          if (serviceData.id_seller === userId) {
            if (serviceData.images) {
              for (const imageUrl of Object.values(serviceData.images)) {
                try {
                  const decodedUrl = decodeURIComponent(imageUrl);
                  const startIndex = decodedUrl.indexOf('/o/') + 3;
                  const endIndex = decodedUrl.indexOf('?');
                  const filePath = decodedUrl.substring(startIndex, endIndex);
                  const imageRef = storageRef(storage, filePath);
                  await deleteObject(imageRef);
                } catch (error) {
                  console.log("Lỗi xóa ảnh service:", error);
                }
              }
            }
            
            deletePromises.push(remove(ref(database, `Services/${serviceId}`)));
          }
        }
        
        await Promise.all(deletePromises);
        console.log("Đã xóa tất cả services của user");
      }
    } catch (error) {
      console.error("Lỗi khi xóa services:", error);
    }
  };

  const deleteUserRooms = async (userId) => {
    try {
      const roomsRef = ref(database, "Rooms");
      const roomsSnapshot = await get(roomsRef);
      
      if (roomsSnapshot.exists()) {
        const rooms = roomsSnapshot.val();
        const deletePromises = [];
        
        for (const [roomId, roomData] of Object.entries(rooms)) {
          if (roomData.ownerID === userId) {
            if (roomData.images && Array.isArray(roomData.images)) {
              for (const imageUrl of roomData.images) {
                try {
                  const decodedUrl = decodeURIComponent(imageUrl);
                  const startIndex = decodedUrl.indexOf('/o/') + 3;
                  const endIndex = decodedUrl.indexOf('?');
                  const filePath = decodedUrl.substring(startIndex, endIndex);
                  const imageRef = storageRef(storage, filePath);
                  await deleteObject(imageRef);
                } catch (error) {
                  console.log("Lỗi xóa ảnh room:", error);
                }
              }
            }
            
            deletePromises.push(remove(ref(database, `Rooms/${roomId}`)));
          }
        }
        
        await Promise.all(deletePromises);
        console.log("Đã xóa tất cả rooms của user");
      }
    } catch (error) {
      console.error("Lỗi khi xóa rooms:", error);
    }
  };

  const deleteUserBills = async (userId) => {
    try {
      const billsRef = ref(database, "Bills");
      const billsSnapshot = await get(billsRef);
      
      if (billsSnapshot.exists()) {
        const bills = billsSnapshot.val();
        const deletePromises = [];
        
        for (const [billId, billData] of Object.entries(bills)) {
          if (billData.userId === userId || billData.sellerId === userId) {
            deletePromises.push(remove(ref(database, `Bills/${billId}`)));
          }
        }
        
        await Promise.all(deletePromises);
        console.log("Đã xóa tất cả bills của user");
      }
    } catch (error) {
      console.error("Lỗi khi xóa bills:", error);
    }
  };

  const deleteUserContracts = async (userId) => {
    try {
      const contractsRef = ref(database, "Contracts");
      const contractsSnapshot = await get(contractsRef);
      
      if (contractsSnapshot.exists()) {
        const contracts = contractsSnapshot.val();
        const deletePromises = [];
        
        for (const [contractId, contractData] of Object.entries(contracts)) {
          if (contractData.landlordId === userId || contractData.tenantId === userId) {
            try {
              if (contractData.cccdFrontImage) {
                const decodedUrl = decodeURIComponent(contractData.cccdFrontImage);
                const startIndex = decodedUrl.indexOf('/o/') + 3;
                const endIndex = decodedUrl.indexOf('?');
                const filePath = decodedUrl.substring(startIndex, endIndex);
                const frontImageRef = storageRef(storage, filePath);
                await deleteObject(frontImageRef);
              }
              
              if (contractData.cccdBackImage) {
                const decodedUrl = decodeURIComponent(contractData.cccdBackImage);
                const startIndex = decodedUrl.indexOf('/o/') + 3;
                const endIndex = decodedUrl.indexOf('?');
                const filePath = decodedUrl.substring(startIndex, endIndex);
                const backImageRef = storageRef(storage, filePath);
                await deleteObject(backImageRef);
              }
            } catch (error) {
              console.log("Lỗi xóa ảnh contract:", error);
            }
            
            deletePromises.push(remove(ref(database, `Contracts/${contractId}`)));
          }
        }
        
        await Promise.all(deletePromises);
        console.log("Đã xóa tất cả contracts của user");
      }
    } catch (error) {
      console.error("Lỗi khi xóa contracts:", error);
    }
  };

  const deleteUserMeetingSchedules = async (userId) => {
    try {
      const meetingRef = ref(database, "MeetingSchedules");
      const meetingSnapshot = await get(meetingRef);
      
      if (meetingSnapshot.exists()) {
        const meetings = meetingSnapshot.val();
        const deletePromises = [];
        
        for (const [meetingId, meetingData] of Object.entries(meetings)) {
          if (meetingData.idFrom === userId || meetingData.idTo === userId) {
            deletePromises.push(remove(ref(database, `MeetingSchedules/${meetingId}`)));
          }
        }
        
        await Promise.all(deletePromises);
        console.log("Đã xóa tất cả meeting schedules của user");
      }
    } catch (error) {
      console.error("Lỗi khi xóa meeting schedules:", error);
    }
  };

  const deleteUserFromCartsAndUserData = async (userId) => {
    try {
      const deletePromises = [];
      const cartsRef = ref(database, "Carts");
      const cartsSnapshot = await get(cartsRef);
      
      if (cartsSnapshot.exists()) {
        const carts = cartsSnapshot.val();
        for (const [cartId, cartData] of Object.entries(carts)) {
          if (cartData.buyerId === userId || cartData.sellerId === userId) {
            deletePromises.push(remove(ref(database, `Carts/${cartId}`)));
          }
        }
      }
      
      const usersRef = ref(database, "Users");
      const usersSnapshot = await get(usersRef);
      
      if (usersSnapshot.exists()) {
        const users = usersSnapshot.val();
        for (const [otherUserId, userData] of Object.entries(users)) {
          if (otherUserId !== userId) {
            if (userData.followRooms) {
              const roomsRef = ref(database, "Rooms");
              const roomsSnapshot = await get(roomsRef);
              
              if (roomsSnapshot.exists()) {
                const rooms = roomsSnapshot.val();
                for (const [roomId, roomData] of Object.entries(rooms)) {
                  if (roomData.ownerID === userId) {
                    if (userData.followRooms[roomId]) {
                      deletePromises.push(remove(ref(database, `Users/${otherUserId}/followRooms/${roomId}`)));
                    }
                    if (userData.histories && userData.histories[roomId]) {
                      deletePromises.push(remove(ref(database, `Users/${otherUserId}/histories/${roomId}`)));
                    }
                  }
                }
              }
            }
            
            if (userData.followPosts) {
              const postsRef = ref(database, "Posts");
              const postsSnapshot = await get(postsRef);
              
              if (postsSnapshot.exists()) {
                const posts = postsSnapshot.val();
                for (const [postId, postData] of Object.entries(posts)) {
                  if (postData.id_own_post === userId) {
                    if (userData.followPosts[postId]) {
                      deletePromises.push(remove(ref(database, `Users/${otherUserId}/followPosts/${postId}`)));
                    }
                    if (userData.histories && userData.histories[postId]) {
                      deletePromises.push(remove(ref(database, `Users/${otherUserId}/histories/${postId}`)));
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      await Promise.all(deletePromises);
      console.log("Đã xóa user khỏi carts và user data");
    } catch (error) {
      console.error("Lỗi khi xóa user khỏi carts và user data:", error);
    }
  };

  const deleteUserLovePostFromRooms = async (userId) => {
    try {
      const roomsRef = ref(database, "Rooms");
      const roomsSnapshot = await get(roomsRef);
      
      if (roomsSnapshot.exists()) {
        const rooms = roomsSnapshot.val();
        const deletePromises = [];
        
        for (const [roomId, roomData] of Object.entries(rooms)) {
          if (roomData.userLovePost && roomData.userLovePost[userId]) {
            deletePromises.push(remove(ref(database, `Rooms/${roomId}/userLovePost/${userId}`)));
          }
        }
        
        await Promise.all(deletePromises);
        console.log("Đã xóa user khỏi userLovePost của các rooms");
      }
    } catch (error) {
      console.error("Lỗi khi xóa userLovePost:", error);
    }
  };

  const deleteUserImages = async (userId) => {
    try {
      const avatarRef = storageRef(storage, `Avatars/avatar_${userId}.jpg`);
      try {
        await deleteObject(avatarRef);
        console.log("Đã xóa avatar của user");
      } catch (error) {
        console.log("Không có avatar để xóa hoặc đã bị xóa");
      }
    } catch (error) {
      console.error("Lỗi khi xóa ảnh:", error);
    }
  };

  const handleResetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Email đặt lại mật khẩu đã được gửi đến ${email}`);
    } catch (error) {
      console.error("Lỗi khi gửi email đặt lại mật khẩu:", error.message);
    }
  };

  const toggleUserStatus = async (userId, disabled) => {
    try {
      const response = await fetch(`YOUR_API`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !disabled }),
      });
      const data = await response.json();
      alert(data.message);
      setUsers(users.map((user) => (user.id === userId ? { ...user, disabled: !disabled } : user)));
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái user:", error.message);
    }
  };

  const handleAddUser = async () => {
    try {
      const { email, password, name, role, phone } = newUser;
      
      // Validation
      if (!email.trim() || !password.trim() || !name.trim()) {
        alert("Email, tên và mật khẩu là bắt buộc!");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Email không hợp lệ!");
        return;
      }

      if (password.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự!");
        return;
      }

      // Gọi API backend thay vì createUserWithEmailAndPassword
      const response = await fetch("YOUR_API", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          name: name.trim(),
          phone: phone.trim() || "",
          role: role || "Người thuê"
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert("Người dùng mới đã được thêm thành công!");
        
        // Reset form
        setNewUser({ 
          email: "", 
          name: "", 
          password: "", 
          phone: "", 
          role: "Người thuê" 
        });
        setShowAddUserForm(false);
        
        // Refresh danh sách users
        await fetchUsers();
        
      } else {
        throw new Error(result.error || "Có lỗi xảy ra khi tạo người dùng");
      }
      
    } catch (error) {
      console.error("Lỗi khi thêm người dùng:", error);
      alert(`Lỗi: ${error.message}`);
    }
  };

  const handleEditUser = async () => {
    try {
      await update(ref(database, `Users/${editingUser.id}`), {
        name: editingUser.name,
        phone: editingUser.phone,
        role: editingUser.role
      });

      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, name: editingUser.name, phone: editingUser.phone, role: editingUser.role } 
          : user
      ));

      alert("Cập nhật thông tin người dùng thành công!");
      setEditingUser(null);
    } catch (error) {
      console.error("Lỗi khi cập nhật người dùng:", error.message);
    }
  };

  const startEditing = (user) => {
    setEditingUser({ ...user });
  };

  const cancelEditing = () => {
    setEditingUser(null);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user[searchType]?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <div className={styles.pageContent}>
      <div className={styles.card}>
        <div className={styles.headerContainer}>
          <h1 className={styles.title}>Quản lý Users</h1>
          <div>
            <button className={styles.buttonAddUser} onClick={() => setShowAddUserForm(true)}>
              Thêm người dùng
            </button>
            <button className={styles.buttonRefresh} onClick={fetchUsers}>
              Làm mới
            </button>
          </div>
        </div>
        
        {showAddUserForm && (
          <AddUserPopup
            onClose={() => setShowAddUserForm(false)}
            onSubmit={handleAddUser}
            newUser={newUser}
            setNewUser={setNewUser}
          />
        )}
        
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder={`Tìm theo ${searchType === "email" ? "Email" : "Tên tài khoản"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                value="email"
                checked={searchType === "email"}
                onChange={() => setSearchType("email")}
              />
              Tìm theo Email
            </label>
            <label>
              <input
                type="radio"
                value="name"
                checked={searchType === "name"}
                onChange={() => setSearchType("name")}
              />
              Tìm theo Tên tài khoản
            </label>
          </div>
        </div>

        <div className={styles.filterContainer}>
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Chủ trọ">Chủ trọ</option>
            <option value="Seller">Seller</option>
            <option value="Người thuê">Người thuê</option>
          </select>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>STT</th>
              <th>Email</th>
              <th>Tên</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user, index) => (
              <tr key={user.id}>
                <td>{indexOfFirstUser + index + 1}</td>
                <td>{user.email}</td>
                {editingUser && editingUser.id === user.id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editingUser.phone}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Chủ trọ">Chủ trọ</option>
                        <option value="Seller">Seller</option>
                        <option value="Người thuê">Người thuê</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={handleEditUser} className={styles.buttonSave}>Lưu</button>
                      <button onClick={cancelEditing} className={styles.buttonCancel}>Hủy</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{user.name}</td>
                    <td>{user.phone}</td>
                    <td>{user.role}</td>
                    <td>
                      <button onClick={() => handleResetPassword(user.email)} className={styles.buttonReset}>Đặt lại mật khẩu</button>
                      <button onClick={() => startEditing(user)} className={styles.buttonEdit}>Chỉnh sửa</button>
                      <button onClick={() => toggleUserStatus(user.id, user.disabled)} className={styles.buttonToggle}>{user.disabled ? "Kích hoạt" : "Vô hiệu hoá"}</button>
                      <button onClick={(e) => handleDelete(user.id, e)} className={styles.buttonDelete}>Xóa</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.pagination}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>« Trước</button>
          <span>Trang {currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Sau »</button>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;