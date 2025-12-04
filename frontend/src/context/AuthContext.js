// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

// ✅ Tạo context xác thực
export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  // --- STATE ---
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // --- LẤY THÔNG TIN NGƯỜI DÙNG ---
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      } catch (err) {
        logout(); // token sai => logout
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [token]);

  // --- HÀM ĐĂNG NHẬP ---
  const login = async (userData, token) => {
    setToken(token);
    localStorage.setItem("token", token);

    try {
      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      return true;
    } catch (err) {
      return false;
    }
  };

  // --- HÀM ĐĂNG XUẤT ---
  const logout = async () => {
    try {
      if (token) {
        await api.post(
          "/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      // có thể bỏ qua lỗi server
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  // --- TRẢ VỀ CONTEXT ---
  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

// ✅ Hook tiện dụng để sử dụng AuthContext ở bất kỳ component nào
export const useAuth = () => useContext(AuthContext);
