const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

const serviceAccount = require("./serviceAccountKey.json"); // File lấy từ Firebase Console

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "YOUR_DB_URL",
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Firebase Backend API!");
});

// Endpoint lấy danh sách users
app.get("/users", async (req, res) => {
    try {
        const listUsersResult = await admin.auth().listUsers();
        const users = listUsersResult.users.map((user) => ({
            uid: user.uid,
            email: user.email,
            phone: user.phone,
            disabled: user.disabled,
            displayName: user.displayName,
        }));
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint tạo user mới
app.post("/createUser", async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: "Email, password và name là bắt buộc!" 
      });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: "Email không hợp lệ!" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: "Mật khẩu phải có ít nhất 6 ký tự!" 
      });
    }
    
    // Tạo user trong Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });
    
    await admin.database().ref(`Users/${userRecord.uid}`).set({
      name: name,
      email: email,
      phone: phone || "Chưa cập nhật",
      role: role || "Người thuê",
      uid: userRecord.uid,
      createdAt: Date.now()
    });
    
    console.log(`User created successfully: ${userRecord.uid} - ${email}`);
    
    res.json({ 
      success: true, 
      message: "Người dùng đã được tạo thành công!",
      userId: userRecord.uid,
      userData: {
        email: email,
        name: name,
        phone: phone || "Chưa cập nhật",
        role: role || "Người thuê"
      }
    });
    
  } catch (error) {
    console.error('Error creating user:', error);

    let errorMessage = "Có lỗi xảy ra khi tạo người dùng";
    
    if (error.code === 'auth/email-already-exists') {
      errorMessage = "Email này đã được sử dụng!";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "Email không hợp lệ!";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Mật khẩu quá yếu!";
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: error.message
    });
  }
});

// Endpoint xóa user
app.delete("/deleteUser/:uid", async (req, res) => {
    const { uid } = req.params;
    try {
        // Lấy thông tin user trước khi xóa để hiển thị thông báo
        let userEmail = "Unknown";
        try {
            const userRecord = await admin.auth().getUser(uid);
            userEmail = userRecord.email;
        } catch (error) {
            console.log("Could not get user email:", error.message);
        }

        // Xóa user từ Authentication
        await admin.auth().deleteUser(uid);
        
        // Xóa user từ Database
        await admin.database().ref(`Users/${uid}`).remove();
        
        console.log(`User deleted successfully: ${uid} - ${userEmail}`);
        
        res.json({ 
            success: true,
            message: `Đã xóa người dùng ${userEmail} thành công!`,
            deletedUser: {
                uid: uid,
                email: userEmail
            }
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Endpoint toggle enable/disable user
app.post("/toggleUser/:uid", async (req, res) => {
    const { uid } = req.params;
    const { disabled } = req.body;
    
    try {
        const userRecord = await admin.auth().getUser(uid);
        const userEmail = userRecord.email;
        
        // Cập nhật trạng thái disabled trong Authentication
        await admin.auth().updateUser(uid, { disabled });

        console.log(`User ${disabled ? 'disabled' : 'enabled'}: ${uid} - ${userEmail}`);
        
        res.json({ 
            success: true,
            message: `Người dùng ${userEmail} đã ${disabled ? "bị vô hiệu hóa" : "được kích hoạt"} thành công!`,
            user: {
                uid: uid,
                email: userEmail,
                disabled: disabled
            }
        });
    } catch (error) {
        console.error("Error toggling user:", error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Endpoint reset password
app.post("/resetPassword", async (req, res) => {
    const { email } = req.body;
    try {
        // Validate email
        if (!email) {
            return res.status(400).json({ 
                success: false,
                error: "Email là bắt buộc!" 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                error: "Email không hợp lệ!" 
            });
        }

        // Kiểm tra user có tồn tại không
        try {
            await admin.auth().getUserByEmail(email);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                return res.status(404).json({ 
                    success: false,
                    error: "Không tìm thấy người dùng với email này!" 
                });
            }
            throw error;
        }

        // Tạo link reset password
        const resetLink = await admin.auth().generatePasswordResetLink(email);
        
        console.log(`Password reset link generated for: ${email}`);
        
        res.json({ 
            success: true,
            message: `Đã tạo link đặt lại mật khẩu cho ${email}!`,
            resetLink: resetLink
        });
    } catch (error) {
        console.error("Error generating password reset link:", error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error("Unhandled error:", error);
    res.status(500).json({ 
        success: false,
        error: "Internal server error" 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: "Endpoint not found" 
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`- GET /`);
    console.log(`- GET /users`);
    console.log(`- POST /createUser`);
    console.log(`- DELETE /deleteUser/:uid`);
    console.log(`- POST /toggleUser/:uid`);
    console.log(`- POST /resetPassword`);
});

