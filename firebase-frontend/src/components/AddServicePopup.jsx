import { useState, useEffect, useRef } from 'react';
import { storage, database } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as databaseRef, set, get } from 'firebase/database';
import styles from '../styles/AddServicePopup.module.css';

const AddServicePopup = ({ onClose, userId, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    category: 'Cho thuê nội thất',
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [titleError, setTitleError] = useState('');
  const fileInputRef = useRef(null);
  
  const serviceCategories = [
    { key: "Cho thuê nội thất", label: "Cho thuê nội thất", prefix: "CNT" },
    { key: "Tư vấn thiết kế phòng", label: "Tư vấn thiết kế phòng", prefix: "TVTK" },
    { key: "Sửa chữa điện nước", label: "Sửa chữa điện nước", prefix: "SCDN" },
    { key: "Giặt là", label: "Giặt là", prefix: "GL" },
    { key: "Đổi bình nước", label: "Đổi bình nước", prefix: "DBN" },
    { key: "Đổi bình ga", label: "Đổi bình ga", prefix: "DBG" },
  ];

  const generateServiceId = (userId) => {
    const userIdSuffix = userId.slice(-5);
    const timestamp = Date.now().toString().slice(-5);
    const serviceId = `SV-${userIdSuffix}-${timestamp}`;
    return serviceId;
  };

  const checkDuplicateTitle = async (title) => {
    try {
      const servicesRef = databaseRef(database, 'Services');
      const snapshot = await get(servicesRef);
      
      if (snapshot.exists()) {
        const services = snapshot.val();
        
        // Kiểm tra có service nào có title trùng không
        const duplicateService = Object.values(services).find(
          service => service.title && service.title.toLowerCase() === title.toLowerCase()
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
    
    if (newTitle.trim().length > 0) {
      setTimeout(async () => {
        const isDuplicate = await checkDuplicateTitle(newTitle.trim());
        if (isDuplicate) {
          setTitleError('Tiêu đề này đã tồn tại. Vui lòng chọn tiêu đề khác.');
        }
      }, 500); // Delay 500ms để không gọi API quá nhiều
    }
  };

  const getFileInputLabel = (filesCount) => {
    if (filesCount === 0) return 'Chọn ảnh';
    if (filesCount === 1) return files[0].name;
    return `${filesCount} files được chọn`;
  };

  const handleFileChange = (e) => {
    const newSelectedFiles = Array.from(e.target.files);
    const combinedFiles = [...files, ...newSelectedFiles];
    const newPreviews = newSelectedFiles.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name
    }));
    const combinedPreviews = [...previews, ...newPreviews];

    setFiles(combinedFiles);
    setPreviews(combinedPreviews);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    URL.revokeObjectURL(previews[index].url);

    setFiles(newFiles);
    setPreviews(newPreviews);

    if (newFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const currentPreviews = [...previews];
    return () => {
      currentPreviews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ảnh');
      return;
    }
    
    if (titleError) {
      alert('Vui lòng sửa lỗi tiêu đề trước khi tiếp tục');
      return;
    }
    
    const isDuplicate = await checkDuplicateTitle(formData.title.trim());
    if (isDuplicate) {
      setTitleError('Tiêu đề này đã tồn tại. Vui lòng chọn tiêu đề khác.');
      return;
    }
    
    setIsLoading(true);

    try {
      const serviceId = generateServiceId(userId);
      const imagePromises = files.map(async (file, index) => {
        const fileName = `${index}_${file.name}`;
        const imageRef = storageRef(storage, `Services/${serviceId}/${fileName}`);

        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);

        return {
          [`img${index + 1}`]: url
        };
      });

      const uploadedImages = await Promise.all(imagePromises);
      const imageUrls = uploadedImages.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      const serviceRef = databaseRef(database, `Services/${serviceId}`);
      await set(serviceRef, {
        title: formData.title.trim(),
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        id_seller: userId,
        serviceId: serviceId,
        sold: 0,
        createdAt: Date.now(),
        images: imageUrls,
      });

      previews.forEach(preview => URL.revokeObjectURL(preview.url));
      alert(`Dịch vụ đã được tạo thành công`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Có lỗi xảy ra khi thêm dịch vụ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h2>Thêm dịch vụ mới</h2>
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
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              min="0"
              step="1000"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mô tả:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              placeholder="Nhập mô tả chi tiết về dịch vụ của bạn..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>Hình ảnh:</label>
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
                {getFileInputLabel(files.length)}
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
              disabled={isLoading || files.length === 0 || titleError}
            >
              {isLoading ? 'Đang xử lý...' : 'Thêm dịch vụ'}
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

export default AddServicePopup;