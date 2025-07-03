import { useState } from 'react';
import { database, storage } from '../firebase';
import { ref as dbRef, update, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import styles from '../styles/EditDistrictPopup.module.css';

const EditDistrictPopup = ({ district, cityId, onClose }) => {
  const [districtName, setDistrictName] = useState(district.name);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  const checkDuplicateName = async (name) => {
    try {
      const cityRef = dbRef(database, `Cities/${cityId}`);
      const snapshot = await get(cityRef);
      
      if (snapshot.exists()) {
        const cityData = snapshot.val();
        const districts = cityData.Districts || {};
        
        const duplicateDistrict = Object.entries(districts).find(
          ([districtKey, districtData]) => 
            districtKey !== (district.id_district || district.id) && 
            districtData.name && 
            districtData.name.toLowerCase() === name.toLowerCase()
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
    
    if (newName.trim().length > 0 && newName.trim() !== district.name) {
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
    if (!districtName.trim()) return;

    if (nameError) {
      alert('Vui lòng sửa lỗi tên quận/huyện trước khi tiếp tục');
      return;
    }

    if (districtName.trim() !== district.name) {
      const isDuplicate = await checkDuplicateName(districtName.trim());
      if (isDuplicate) {
        setNameError('Tên quận/huyện này đã tồn tại trong thành phố. Vui lòng chọn tên khác.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let imageUrl = district.img_district;
      if (selectedImage) {
        if (district.img_district) {
          try {
            const decodedUrl = decodeURIComponent(district.img_district);
            const startIndex = decodedUrl.indexOf('/o/') + 3;
            const endIndex = decodedUrl.indexOf('?');
            const filePath = decodedUrl.substring(startIndex, endIndex);
            const oldImageRef = storageRef(storage, filePath);
            await deleteObject(oldImageRef);
          } catch (error) {
            console.log('Error deleting old image:', error);
          }
        }
        
        const districtId = district.id_district || district.id;
        const newImageRef = storageRef(storage, `Districts/${districtId}_${selectedImage.name}`);
        const snapshot = await uploadBytes(newImageRef, selectedImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const districtId = district.id_district || district.id;
      await update(dbRef(database, `Cities/${cityId}/Districts/${districtId}`), {
        name: districtName.trim(),
        img_district: imageUrl
      });

      alert(`Cập nhật quận/huyện "${districtName}" thành công!`);
      onClose();
    } catch (error) {
      console.error('Error updating district:', error);
      alert('Có lỗi khi cập nhật quận/huyện: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.formContainer}>
        <h2>Chỉnh sửa quận/huyện</h2>
        <div className={styles.districtInfo}>
          <p><strong>ID quận/huyện:</strong> {district.id_district || district.id}</p>
          <p><strong>Tên hiện tại:</strong> {district.name}</p>
          <div className={styles.currentImage}>
            <p><strong>Ảnh hiện tại:</strong></p>
            <img 
              src={district.img_district} 
              alt={district.name}
              className={styles.previewImage}
              onError={(e) => {
                e.target.src = '/default-district.jpg';
              }}
            />
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tên quận/huyện mới:</label>
            <input
              type="text"
              value={districtName}
              onChange={handleNameChange}
              placeholder="Nhập tên quận/huyện mới"
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
            <label>Ảnh quận/huyện mới (tùy chọn):</label>
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
            />
            {selectedImage && (
              <div className={styles.newImagePreview}>
                <p>✅ Ảnh mới đã chọn: {selectedImage.name}</p>
              </div>
            )}
            <small className={styles.note}>
              💡 Để trống nếu không muốn thay đổi ảnh
            </small>
          </div>
          <div className={styles.formActions}>
            <button 
              type="submit" 
              disabled={isSubmitting || !districtName.trim() || nameError}
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

export default EditDistrictPopup;