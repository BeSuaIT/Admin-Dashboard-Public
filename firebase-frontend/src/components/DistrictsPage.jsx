import { useState, useEffect, useCallback } from 'react';
import { database, storage } from '../firebase';
import { ref as dbRef, onValue, update, get } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import styles from '../styles/DistrictsPage.module.css';
import AddCityPopup from './AddCityPopup';
import AddDistrictPopup from './AddDistrictPopup';
import EditCityPopup from './EditCityPopup';
import EditDistrictPopup from './EditDistrictPopup';

const DistrictsPage = () => {
  const [cities, setCities] = useState({});
  const [selectedCity, setSelectedCity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCity, setShowAddCity] = useState(false);
  const [showAddDistrict, setShowAddDistrict] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingCity, setEditingCity] = useState(null);
  const [editingDistrict, setEditingDistrict] = useState(null);

  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const citiesRef = dbRef(database, 'Cities');
    const unsubscribe = onValue(citiesRef, (snapshot) => {
      if (snapshot.exists()) {
        const citiesData = snapshot.val();

        Object.keys(citiesData).forEach(cityId => {
          if (citiesData[cityId].Districts) {
            if (!Array.isArray(citiesData[cityId].Districts)) {
              citiesData[cityId].Districts = Object.values(citiesData[cityId].Districts);
            }
          } else {
            citiesData[cityId].Districts = [];
          }
        });

        setCities(citiesData);
      } else {
        setCities({});
        setSelectedCity(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [refreshKey]);

  useEffect(() => {
    if (cities && Object.keys(cities).length > 0) {
      if (!selectedCity || !cities[selectedCity]) {
        setSelectedCity(Object.keys(cities)[0]);
      }
    }
  }, [cities, selectedCity]);

const handleDeleteCity = async (cityId) => {
  if (!window.confirm('Bạn có chắc muốn xóa thành phố này? Tất cả quận/huyện thuộc thành phố này sẽ bị xóa.')) {
    return;
  }

  try {
    const cityRef = dbRef(database, `Cities/${cityId}`);
    const snapshot = await get(cityRef);
    
    if (snapshot.exists()) {
      const cityData = snapshot.val();
      const districts = cityData.Districts || {};
      console.log('Districts to delete:', Object.keys(districts));

      for (const [districtKey, district] of Object.entries(districts)) {
        if (district && district.img_district) {
          try {
            const imagePath = district.img_district.split('Districts%2F')[1].split('?')[0];
            const imageRef = storageRef(storage, `Districts/${imagePath}`);
            await deleteObject(imageRef);
            console.log(`Deleted image for district ${districtKey}`);
          } catch (error) {
            console.log(`Error deleting image for district ${districtKey}:`, error);
          }
        }
      }

      const rootRef = dbRef(database);
      await update(rootRef, {
        [`Cities/${cityId}`]: null
      });

      console.log(`Successfully deleted city ${cityId}`);
      alert('Đã xóa thành phố và tất cả quận/huyện thành công!');
      
      refreshData();
    } else {
      alert('Không tìm thấy thành phố này!');
    }
  } catch (error) {
    console.error('Error deleting city:', error);
    alert('Có lỗi khi xóa thành phố: ' + error.message);
  }
};

const handleDeleteDistrict = async (district, cityId) => {
  if (!window.confirm('Bạn có chắc muốn xóa quận/huyện này?')) {
    return;
  }

  try {
    if (district.img_district) {
      try {
        const imagePath = district.img_district.split('Districts%2F')[1].split('?')[0];
        const imageRef = storageRef(storage, `Districts/${imagePath}`);
        await deleteObject(imageRef);
        console.log(`Deleted image: Districts/${imagePath}`);
      } catch (error) {
        console.log('Error deleting district image:', error);
      }
    }

    const districtKey = district.id_district;
    console.log(`Deleting district: Cities/${cityId}/Districts/${districtKey}`);
    
    await update(dbRef(database), {
      [`Cities/${cityId}/Districts/${districtKey}`]: null
    });

    console.log(`Successfully deleted district ${districtKey} from city ${cityId}`);
    alert('Đã xóa quận/huyện thành công!');
    
    refreshData();
    
  } catch (error) {
    console.error('Error deleting district:', error);
    alert(`Có lỗi khi xóa quận/huyện: ${error.message}`);
  }
};

  if (isLoading) {
    return <div className={styles.loading}>Đang tải dữ liệu...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Quản lý Quận/Huyện</h1>
          <div className={styles.actionButtons}>
            <button 
              className={styles.addButton}
              onClick={() => setShowAddCity(true)}
            >
              Thêm thành phố
            </button>
            {selectedCity && (
              <button 
                className={styles.addButton}
                onClick={() => setShowAddDistrict(true)}
              >
                Thêm quận/huyện
              </button>
            )}
          </div>
        </div>
        <div className={styles.cityTabs}>
          {Object.entries(cities).map(([cityId, cityData]) => (
            <div key={cityId} className={styles.cityTabContainer}>
              <button
                className={`${styles.cityTab} ${selectedCity === cityId ? styles.active : ''}`}
                onClick={() => setSelectedCity(cityId)}
              >
                {cityData.name}
              </button>
              <div className={styles.cityActions}>
                <button
                  onClick={() => setEditingCity({ id: cityId, ...cityData })}
                  className={styles.editButton}
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDeleteCity(cityId)}
                  className={styles.deleteButton}
                >
                  ✖
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCity && cities[selectedCity]?.Districts && (
        <div className={styles.districtsGrid}>
          {cities[selectedCity].Districts.length > 0 ? (
            cities[selectedCity].Districts.map((district) => (
              <div key={district.id_district || district.id_wards} className={styles.districtCard}>
                <div className={styles.imageContainer}>
                  <img
                    src={district.img_district}
                    alt={district.name}
                    className={styles.districtImage}
                  />
                </div>
                <div className={styles.districtInfo}>
                  <h3>{district.name}</h3>
                  <p className={styles.districtId}>
                    ID: {district.id_district || district.id_wards}
                  </p>
                  <div className={styles.districtActions}>
                    <button
                      onClick={() => setEditingDistrict(district)}
                      className={styles.editButton}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteDistrict(district, selectedCity)}
                      className={styles.deleteButton}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noData}>Chưa có quận/huyện nào</p>
          )}
        </div>
      )}

      {showAddCity && (
        <AddCityPopup 
          onClose={() => {
            setShowAddCity(false);
            refreshData();
          }} 
        />
      )}

      {showAddDistrict && selectedCity && (
        <AddDistrictPopup 
          cityId={selectedCity}
          cityName={cities[selectedCity].name}
          onClose={() => {
            setShowAddDistrict(false);
            refreshData();
          }}
        />
      )}

      {editingCity && (
        <EditCityPopup
          city={editingCity}
          cityId={editingCity.id}
          onClose={() => {
            setEditingCity(null);
            refreshData();
          }}
        />
      )}

      {editingDistrict && (
        <EditDistrictPopup
          district={editingDistrict}
          cityId={selectedCity}
          onClose={() => {
            setEditingDistrict(null);
            refreshData();
          }}
        />
      )}
    </div>
    </div>
  );
};

export default DistrictsPage;