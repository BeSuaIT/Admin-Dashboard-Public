import { useState } from 'react';
import { database, storage } from '../firebase';
import { ref as dbRef, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from '../styles/AddDistrictPopup.module.css';

const AddDistrictPopup = ({ cityId, cityName, onClose }) => {
  const [districtName, setDistrictName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  const generateDistrictId = () => {
    // Lấy 5 số cuối của timestamp
    const timestamp = Date.now().toString().slice(-5);
    
    // Format: DIST-TIMESTAMP
    // Ví dụ: DIST-78945, DIST-12345
    return `DIST-${timestamp}`;
  };

  const checkDuplicateName = async (name) => {
    try {
      const cityRef = dbRef(database, `Cities/${cityId}`);
      const snapshot = await get(cityRef);
      
      if (snapshot.exists()) {
        const cityData = snapshot.val();
        const districts = cityData.Districts || {};
        
        const duplicateDistrict = Object.values(districts).find(
          district => district.name && district.name.toLowerCase() === name.toLowerCase()
        );
        
        return duplicateDistrict ? true : false;
      }
      return false;
    } catch (error) {
      console.error('Error checking duplicate name:', error);
      return false;
    }
  };

  const handleNameChange = async (e) => {
    const newName = e.target.value;
    setDistrictName(newName);
    
    setNameError('');
    
    if (newName.trim().length > 0) {
      setTimeout(async () => {
        const isDuplicate = await checkDuplicateName(newName.trim());
        if (isDuplicate) {
          setNameError('Tên quận/huyện này đã tồn tại trong thành phố. Vui lòng chọn tên khác.');
        }
      }, 500);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!districtName.trim() || !selectedImage) return;

    if (nameError) {
      alert('Vui lòng sửa lỗi tên quận/huyện trước khi tiếp tục');
      return;
    }

    const isDuplicate = await checkDuplicateName(districtName.trim());
    if (isDuplicate) {
      setNameError('Tên quận/huyện này đã tồn tại trong thành phố. Vui lòng chọn tên khác.');
      return;
    }

    setIsSubmitting(true);
    try {
      const districtId = generateDistrictId();
      const imageRef = storageRef(storage, `Districts/${districtId}_${selectedImage.name}`);
      const snapshot = await uploadBytes(imageRef, selectedImage);
      const imageUrl = await getDownloadURL(snapshot.ref);
      const districtRef = dbRef(database, `Cities/${cityId}/Districts/${districtId}`);
      await set(districtRef, {
        name: districtName.trim(),
        id_district: districtId,
        img_district: imageUrl
      });

      alert(`Quận/huyện "${districtName}" đã được tạo`);
      onClose();
    } catch (error) {
      console.error('Error adding district:', error);
      alert('Có lỗi khi thêm quận/huyện');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.formContainer}>
        <h2>Thêm quận/huyện mới cho {cityName}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tên quận/huyện: <span className={styles.required}>*</span></label>
            <input
              type="text"
              value={districtName}
              onChange={handleNameChange}
              placeholder="Nhập tên quận/huyện (VD: Quận 1, Cầu Giấy)"
              required
              className={nameError ? styles.inputError : ''}
            />
            {nameError && (
              <div className={styles.errorMessage}>
                ❌ {nameError}
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label>Ảnh quận/huyện:</label>
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              required
            />
            {selectedImage && (
              <div className={styles.imagePreview}>
                <p>✅ Đã chọn: {selectedImage.name}</p>
              </div>
            )}
          </div>
          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={isSubmitting || !districtName.trim() || !selectedImage || nameError}
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

export default AddDistrictPopup;