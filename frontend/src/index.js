import React from "react";
import ReactDOM from "react-dom/client"; // ✅ Sử dụng React 18 API
import App from "./App";
import './index.css'; // <-- BẠN ĐANG THIẾU DÒNG NÀY

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);