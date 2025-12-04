import api from "../services/api";

export const login = async (username, password) => {
  try {
    const res = await api.post("/api/auth/login", { username, password });
    localStorage.setItem("token", res.data.token);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
};