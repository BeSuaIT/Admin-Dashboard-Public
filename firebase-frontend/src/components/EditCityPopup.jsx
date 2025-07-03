import { useState } from 'react';
import { database } from '../firebase';
import { ref as dbRef, update, get } from 'firebase/database';
import styles from '../styles/EditCityPopup.module.css';

const EditCityPopup = ({ city, cityId, onClose }) => {
  const [cityName, setCityName] = useState(city.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  const checkDuplicateName = async (name) => {
    try {
      const citiesRef = dbRef(database, 'Cities');
      const snapshot = await get(citiesRef);
      
      if (snapshot.exists()) {
        const cities = snapshot.val();
        const duplicateCity = Object.entries(cities).find(
          ([id, cityData]) => 
            id !== cityId && 
            cityData.name && 
            cityData.name.toLowerCase() === name.toLowerCase()
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
    
    if (newName.trim().length > 0 && newName.trim() !== city.name) {
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

    if (cityName.trim() !== city.name) {
      const isDuplicate = await checkDuplicateName(cityName.trim());
      if (isDuplicate) {
        setNameError('Tên thành phố này đã tồn tại. Vui lòng chọn tên khác.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await update(dbRef(database, `Cities/${cityId}`), {
        name: cityName.trim()
      });

      alert(`Cập nhật thành phố "${cityName}" thành công!`);
      onClose();
    } catch (error) {
      console.error('Error updating city:', error);
      alert('Có lỗi khi cập nhật thành phố: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.formContainer}>
        <h2>Chỉnh sửa thành phố</h2>
        <div className={styles.cityInfo}>
          <p><strong>ID thành phố:</strong> {cityId}</p>
          <p><strong>Tên hiện tại:</strong> {city.name}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tên thành phố mới:</label>
            <input
              type="text"
              value={cityName}
              onChange={handleNameChange}
              placeholder="Nhập tên thành phố mới"
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
              disabled={isSubmitting || !cityName.trim() || nameError}
              className={styles.submitButton}
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
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

export default EditCityPopup;