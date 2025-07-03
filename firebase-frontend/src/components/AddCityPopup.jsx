import { useState } from 'react';
import { database } from '../firebase';
import { ref, set, get } from 'firebase/database';
import styles from '../styles/AddCityPopup.module.css';

const AddCityPopup = ({ onClose }) => {
  const [cityName, setCityName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  const generateCityId = () => {
    // Lấy 5 số cuối của timestamp
    const timestamp = Date.now().toString().slice(-5);
    
    // Format: CITY-TIMESTAMP
    // Ví dụ: CITY-78945, CITY-12345
    return `CITY-${timestamp}`;
  };

  const checkDuplicateName = async (name) => {
    try {
      const citiesRef = ref(database, 'Cities');
      const snapshot = await get(citiesRef);
      
      if (snapshot.exists()) {
        const cities = snapshot.val();
        const duplicateCity = Object.values(cities).find(
          city => city.name && city.name.toLowerCase() === name.toLowerCase()
        );
        return duplicateCity ? true : false;
      }
      return false;
    } catch (error) {
      console.error('Error checking duplicate name:', error);
      return false;
    }
  };

  const handleNameChange = async (e) => {
    const newName = e.target.value;
    setCityName(newName);
    
    setNameError('');
    
    if (newName.trim().length > 0) {
      setTimeout(async () => {
        const isDuplicate = await checkDuplicateName(newName.trim());
        if (isDuplicate) {
          setNameError('Tên thành phố này đã tồn tại. Vui lòng chọn tên khác.');
        }
      }, 500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cityName.trim()) return;

    if (nameError) {
      alert('Vui lòng sửa lỗi tên thành phố trước khi tiếp tục');
      return;
    }

    const isDuplicate = await checkDuplicateName(cityName.trim());
    if (isDuplicate) {
      setNameError('Tên thành phố này đã tồn tại. Vui lòng chọn tên khác.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cityId = generateCityId();
      await set(ref(database, `Cities/${cityId}`), {
        name: cityName.trim(),
        id_city: cityId,
        districts: {} 
      });
      
      alert(`Thành phố "${cityName}" đã được tạo`);
      onClose();
    } catch (error) {
      console.error('Error adding city:', error);
      alert('Có lỗi khi thêm thành phố');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.formContainer}>
        <h2>Thêm thành phố mới</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tên thành phố:</label>
            <input
              type="text"
              value={cityName}
              onChange={handleNameChange}
              placeholder="Nhập tên thành phố (VD: Hồ Chí Minh, Hà Nội)"
              required
              className={nameError ? styles.inputError : ''}
            />
            {nameError && (
              <div className={styles.errorMessage}>
                ❌ {nameError}
              </div>
            )}
          </div>
          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={isSubmitting || nameError}
              className={styles.submitButton}
            >
              {isSubmitting ? 'Đang thêm...' : 'Thêm mới'}
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

export default AddCityPopup;