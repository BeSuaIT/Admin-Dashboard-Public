import React from "react";
import styles from "../styles/AddUserPopup.module.css";

const AddUserPopup = ({ onClose, onSubmit, newUser, setNewUser }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h2>Thêm người dùng mới</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className={styles.formGroup}>
            <label>Email:</label>
            <input
              type="email"
              required
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label>Tên:</label>
            <input
              type="text"
              required
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Mật khẩu:</label>
            <input
              type="password"
              required
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label>Số điện thoại:</label>
            <input
              type="tel"
              value={newUser.phone}
              onChange={(e) =>
                setNewUser({ ...newUser, phone: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label>Vai trò:</label>
            <select
              value={newUser.role}
              onChange={(e) =>
                setNewUser({ ...newUser, role: e.target.value })
              }
            >
              <option value="Admin">Admin</option>
              <option value="Chủ trọ">Chủ trọ</option>
              <option value="Seller">Seller</option>
              <option value="Người thuê">Người thuê</option>
            </select>
          </div>
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.submitButton}>
              Thêm người dùng
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserPopup;
