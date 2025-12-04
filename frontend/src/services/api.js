import axios from "axios";
import { message } from "antd";

let baseURL = process.env.REACT_APP_API_URL;

if (!baseURL) {
  const hostname = window.location.hostname;
  if (hostname.startsWith("10.") || hostname.startsWith("192.168.")) {
    baseURL = "http://10.2.0.3:5001/api";
  } else if (hostname === "thuvien.cs2.ftu.edu.vn") {
    baseURL = "/api";
  } else {
    baseURL = "http://localhost:5001/api";
  }
}

const api = axios.create({
  baseURL,
  timeout: 90000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    const fullUrl = config.url?.startsWith("http")
      ? config.url
      : `${config.baseURL}${config.url}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (!err.response) {
      return Promise.reject(err);
    }
    const { status, data } = err.response;
    const msg = data?.message || "Đã có lỗi xảy ra!";
    
    if (status === 400) {
      message.error(msg);
    } else if (status === 401 && data.errorCode === "TOKEN_EXPIRED" && !err.config._retry) {
      err.config._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("Không tìm thấy refresh token!");
        }
        const response = await axios.post(`${baseURL}/auth/refresh-token`, { refreshToken });
        const { accessToken } = response.data;
        localStorage.setItem("accessToken", accessToken);
        err.config.headers.Authorization = `Bearer ${accessToken}`;
        return api(err.config);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setTimeout(() => window.location.assign("/login"), 1000);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(err);
  }
);

export default api;