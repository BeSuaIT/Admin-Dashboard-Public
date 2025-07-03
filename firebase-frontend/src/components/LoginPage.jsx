import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, database } from "../firebase";
import { ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import styles from "../styles/LoginPage.module.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = ref(database, `Users/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const userRole = userData.role;

        if (userRole === 'Admin' || userRole === 'Seller') {
          localStorage.setItem('adminToken', userCredential.user.accessToken);
          localStorage.setItem('userRole', userRole);
          localStorage.setItem('userId', user.uid);
          navigate("/dashboard");
        } else {
          alert("Bạn không có quyền truy cập!");
        }
      } else {
        alert("Không tìm thấy thông tin người dùng!");
      }
    } catch (error) {
      alert("Đăng nhập thất bại: " + error.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Admin Login</h1>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className={styles.input}
        />
        <button onClick={handleLogin} className={styles.button}>Đăng Nhập</button>
      </div>
    </div>
  );
};

export default LoginPage;
