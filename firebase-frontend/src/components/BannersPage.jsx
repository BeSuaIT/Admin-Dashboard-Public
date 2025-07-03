import { useState, useEffect, useRef } from 'react';
import { storage } from '../firebase';
import { ref as storageRef, listAll, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from '../styles/BannersPage.module.css';

const BannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const bannersRef = storageRef(storage, 'HomeImageSlider');
      const result = await listAll(bannersRef);

      const bannersData = await Promise.all(
        result.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            name: item.name,
            url: url,
            fullPath: item.fullPath
          };
        })
      );

      setBanners(bannersData);
    } catch (error) {
      console.error('Error fetching banners:', error);
      alert('Có lỗi khi tải danh sách banner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const imageRef = storageRef(storage, `HomeImageSlider/${file.name}`);
        await uploadBytes(imageRef, file);
      }
      await fetchBanners();
      alert('Tải lên thành công!');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Có lỗi khi tải lên ảnh');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (banner) => {
    const isConfirmed = window.confirm('Bạn có chắc chắn muốn xóa banner này không?');
    if (!isConfirmed) return;

    try {
      const imageRef = storageRef(storage, banner.fullPath);
      await deleteObject(imageRef);
      await fetchBanners();
      alert('Xóa thành công!');
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Có lỗi khi xóa banner');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1>Quản lý Banners</h1>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                ▣
              </button>
              <button
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                ≡
              </button>
            </div>
          </div>
          <div className={styles.uploadSection}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className={styles.fileInput}
              disabled={isUploading}
            />
            <button
              className={styles.uploadButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Đang tải lên...' : 'Thêm banner mới'}
            </button>
          </div>
        </div>

        <div className={viewMode === 'grid' ? styles.bannerGrid : styles.bannerList}>
          {isLoading ? (
            <div className={styles.loading}>Đang tải dữ liệu...</div>
          ) : banners.length > 0 ? (
            banners.map((banner) => (
              <div
                key={banner.name}
                className={viewMode === 'grid' ? styles.bannerCard : styles.bannerRow}
                onClick={() => setZoomImage(banner.url)}
              >
                <img
                  src={banner.url}
                  alt={banner.name}
                  className={viewMode === 'grid' ? styles.bannerImage : styles.listImage}
                />
                {viewMode === 'list' && (
                  <div className={styles.bannerInfo}>
                    <span className={styles.bannerName}>{banner.name}</span>
                  </div>
                )}
                <div className={styles.bannerOverlay}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(banner);
                    }}
                    className={styles.deleteButton}
                    title="Xóa banner"
                  >
                    ✖
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noData}>Chưa có banner nào</p>
          )}
        </div>

        {zoomImage && (
          <div
            className={styles.zoomOverlay}
            onClick={() => setZoomImage(null)}
          >
            <div
              className={styles.zoomContainer}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.closeZoom}
                onClick={() => setZoomImage(null)}
              >
                ✖
              </button>
              <img
                src={zoomImage}
                alt="Zoomed banner"
                className={styles.zoomImage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BannersPage;