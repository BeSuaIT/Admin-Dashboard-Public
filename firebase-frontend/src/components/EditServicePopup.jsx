import React, { useState, useRef } from 'react';
import { storage, database } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, update, get } from 'firebase/database';
import styles from '../styles/EditServicePopup.module.css';

const EditServicePopup = ({ service, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: service.title,
    price: service.price,
    description: service.description,
    category: service.category || 'Cho thuê nội thất',
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [titleError, setTitleError] = useState('');
  const fileInputRef = useRef();
  
  const serviceCategories = [
    { key: "Cho thuê nội thất", label: "Cho thuê nội thất", prefix: "CNT" },
    { key: "Tư vấn thiết kế phòng", label: "Tư vấn thiết kế phòng", prefix: "TVTK" },
    { key: "Sửa chữa điện nước", label: "Sửa chữa điện nước", prefix: "SCDN" },
    { key: "Giặt là", label: "Giặt là", prefix: "GL" },
    { key: "Đổi bình nước", label: "Đổi bình nước", prefix: "DBN" },
    { key: "Đổi bình ga", label: "Đổi bình ga", prefix: "DBG" },
  ];

  const checkDuplicateTitle = async (title) => {
    try {
      const servicesRef = dbRef(database, 'Services');
      const snapshot = await get(servicesRef);
      
      if (snapshot.exists()) {
        const services = snapshot.val();
        
        const duplicateService = Object.entries(services).find(
          ([serviceId, serviceData]) => 
            serviceId !== service.id && // Loại trừ service hiện tại
            serviceData.title && 
            serviceData.title.toLowerCase() === title.toLowerCase()
        );
        
        return duplicateService ? true : false;
      }
      return false;
    } catch (error) {
      console.error('Error checking duplicate title:', error);
      return false;
    }
  };

  const handleTitleChange = async (e) => {
    const newTitle = e.target.value;
    setFormData({ ...formData, title: newTitle });
    
    setTitleError('');
    
    if (newTitle.trim().length > 0 && newTitle.trim() !== service.title) {
      setTimeout(async () => {
        const isDuplicate = await checkDuplicateTitle(newTitle.trim());
        if (isDuplicate) {
          setTitleError('Tiêu đề này đã tồn tại. Vui lòng chọn tiêu đề khác.');
        }
      }, 500); // Delay 500ms để không gọi API quá nhiều
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);

    const newPreviews = selectedFiles.map(file => ({
      url: URL.createObjectURL(file),
      file: file
    }));
    setPreviews(newPreviews);
  };

  const removeImage = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index].url);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const deleteOldImages = async () => {
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
          console.error('Error deleting image:', error);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (titleError) {
      alert('Vui lòng sửa lỗi tiêu đề trước khi tiếp tục');
      return;
    }
    
    if (formData.title.trim() !== service.title) {
      const isDuplicate = await checkDuplicateTitle(formData.title.trim());
      if (isDuplicate) {
        setTitleError('Tiêu đề này đã tồn tại. Vui lòng chọn tiêu đề khác.');
        return;
      }
    }
    
    setIsLoading(true);

    try {
      const serviceRef = dbRef(database, `Services/${service.id}`);
      
      if (files.length > 0) {
        await deleteOldImages();
        const imageUrls = {};
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileName = `${i}_${file.name}`;
          const imageRef = storageRef(storage, `Services/${service.id}/${fileName}`);
          await uploadBytes(imageRef, file);
          const url = await getDownloadURL(imageRef);
          imageUrls[`img${i + 1}`] = url;
        }

        await update(serviceRef, {
          title: formData.title.trim(),
          price: Number(formData.price),
          description: formData.description,
          category: formData.category,
          images: imageUrls,
        });
      } else {
        await update(serviceRef, {
          title: formData.title.trim(),
          price: Number(formData.price),
          description: formData.description,
          category: formData.category,
        });
      }

      previews.forEach(preview => URL.revokeObjectURL(preview.url));
      alert('Cập nhật dịch vụ thành công!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Có lỗi xảy ra khi cập nhật dịch vụ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h2>Chỉnh sửa dịch vụ</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tiêu đề:</label>
            <input
              type="text"
              value={formData.title}
              onChange={handleTitleChange}
              required
              className={titleError ? styles.inputError : ''}
            />
            {titleError && (
              <div className={styles.errorMessage}>
                ❌ {titleError}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Danh mục dịch vụ:</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={styles.selectInput}
              required
            >
              {serviceCategories.map(category => (
                <option key={category.key} value={category.key}>
                  {category.label} ({category.prefix})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Giá (VND):</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
              min="0"
              step="1000"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mô tả:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              rows={4}
              placeholder="Nhập mô tả chi tiết về dịch vụ của bạn..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>Hình ảnh mới (tùy chọn):</label>
            <p className={styles.imageNote}>
              💡 Chỉ chọn ảnh mới nếu bạn muốn thay đổi. Bỏ trống để giữ ảnh cũ.
            </p>
            <div className={styles.fileInputWrapper}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className={styles.fileInput}
                id="fileInput"
              />
              <label htmlFor="fileInput" className={styles.fileInputLabel}>
                {files.length === 0 ? 'Chọn ảnh mới' : `${files.length} ảnh được chọn`}
              </label>
            </div>
            {previews.length > 0 && (
              <div className={styles.previewGrid}>
                {previews.map((preview, index) => (
                  <div key={index} className={styles.previewItem}>
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className={styles.previewImage}
                    />
                    <button
                      type="button"
                      className={styles.removeImage}
                      onClick={() => removeImage(index)}
                      title="Xóa ảnh"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.buttonGroup}>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading || titleError}
            >
              {isLoading ? 'Đang xử lý...' : 'Cập nhật dịch vụ'}
            </button>
            <button 
              type="button" 
              className={styles.cancelButton} 
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditServicePopup;