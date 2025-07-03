import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { database } from "../firebase";
import styles from "../styles/DashboardLayout.module.css";
import { FaUsers, FaBed, FaCogs, FaSignOutAlt, FaImages, FaFileInvoiceDollar, FaMapMarkerAlt } from 'react-icons/fa';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = ref(database, `Users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUserInfo({
            email: user.email,
            name: userData.name || "User",
            uid: user.uid
          });
          setUserRole(userData.role);
          localStorage.setItem('userRole', userData.role);
          localStorage.setItem('userId', user.uid);
        }
      } else {
        setUserInfo(null);
        setUserRole(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('adminToken');
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const renderNavLinks = () => {
    if (userRole === 'Admin') {
      return (
        <>
          <NavLink 
            to="/dashboard/users" 
            className={({ isActive }) => 
              `${styles.navLink} ${isActive ? styles.activeLink : ''}`
            }
          >
            <FaUsers className={styles.icon} />
            <span>Quản lý Users</span>
          </NavLink>
          <NavLink 
            to="/dashboard/rooms" 
            className={({ isActive }) => 
              `${styles.navLink} ${isActive ? styles.activeLink : ''}`
            }
          >
            <FaBed className={styles.icon} />
            <span>Quản lý Rooms</span>
          </NavLink>
          <NavLink 
            to="/dashboard/banners" 
            className={({ isActive }) => 
              `${styles.navLink} ${isActive ? styles.activeLink : ''}`
            }
          >
            <FaImages className={styles.icon} />
            <span>Quản lý Banners</span>
          </NavLink>
          <NavLink 
            to="/dashboard/districts" 
            className={({ isActive }) => 
              `${styles.navLink} ${isActive ? styles.activeLink : ''}`
            }
          >
            <FaMapMarkerAlt className={styles.icon} />
            <span>Quản lý Districts</span>
          </NavLink>
        </>
      );
    }

    if (userRole === 'Seller') {
      return (
        <>
          <NavLink 
            to="/dashboard/services" 
            className={({ isActive }) => 
              `${styles.navLink} ${isActive ? styles.activeLink : ''}`
            }
          >
            <FaCogs className={styles.icon} />
            <span>Quản lý Services</span>
          </NavLink>
          <NavLink 
            to="/dashboard/bills" 
            className={({ isActive }) => 
              `${styles.navLink} ${isActive ? styles.activeLink : ''}`
            }
          >
            <FaFileInvoiceDollar className={styles.icon} />
            <span>Quản lý Bills</span>
          </NavLink>
        </>
      );
    }

    return null;
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('adminToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <h2>Admin Panel</h2>
        </div>
        
        {userInfo && (
          <div className={styles.sidebarUserInfo}>
            <div className={styles.userAvatar}>
              {userInfo.name.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{userInfo.name}</span>
              <span className={styles.userEmail}>{userInfo.email}</span>
            </div>
          </div>
        )}

        <nav className={styles.nav}>
          {renderNavLinks()}
        </nav>
        
        <button className={`${styles.navLink} ${styles.logout}`} onClick={handleLogout}>
          <FaSignOutAlt className={styles.icon} />
          <span>Đăng xuất</span>
        </button>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.contentArea}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;