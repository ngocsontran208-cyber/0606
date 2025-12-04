// frontend/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// *** 1. IMPORT TOAST CONTAINER VÀ CSS ***
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import AuthProvider from "./context/AuthContext";
import CurriculumProvider from "./context/CurriculumContext";

import Courses from "./pages/Courses";
import Materials from "./pages/Materials";
import Reports from "./pages/Reports";
import Curriculums from "./pages/Curriculums";
import Majors from "./pages/Majors";
import Login from "./pages/Login";
import CreateUser from "./pages/CreateUser";
import Profile from "./pages/Profile";
import MaterialViewer from "./pages/MaterialViewer";
import FileManagementPage from "./pages/ImportantFilesPage";Route
import ChatbotWidget from "./components/ChatbotWidget";
import PublicMaterialsViewer from "./pages/PublicMaterialsViewer";Route
import SupplementaryMaterialsPage from "./pages/SupplementaryMaterialsPage";
import ManageCohorts from "./pages/ManageCohorts";

const App = () => {
  return (
    <AuthProvider>
      <CurriculumProvider>
        <Router>
          <AppContent />
        </Router>
      </CurriculumProvider>
    </AuthProvider>
  );
};

const AppContent = () => {
  const location = useLocation();

  const publicViewPath = "/hoclieuchitiet";
  const noNavbarRoutes = ["/login", "/register", publicViewPath];

  const hideNavbarOrChatbot =
    noNavbarRoutes.includes(location.pathname) ||
    /^\/materials\/\d+\/view/.test(location.pathname);

  return (
    <>
      {/* *** 2. THÊM TOASTCONTAINER VÀO ĐÂY *** */}
      {/* Nó sẽ "lắng nghe" các lệnh toast.error() từ trang Login */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {!hideNavbarOrChatbot && <Navbar />}

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path={publicViewPath} element={<PublicMaterialsViewer />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute element={<Home />} />} />
        <Route path="/curriculums" element={<ProtectedRoute element={<Curriculums />} />} />
        <Route path="/courses" element={<ProtectedRoute element={<Courses />} />} />
        <Route path="/materials" element={<ProtectedRoute element={<Materials />} />} />
        <Route path="/reports" element={<ProtectedRoute element={<Reports />} />} />
        <Route path="/majors" element={<ProtectedRoute element={<Majors />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
        <Route path="/create-user" element={<ProtectedRoute element={<CreateUser />} />} />
        <Route path="/materials/:id/view" element={<ProtectedRoute element={<MaterialViewer />} />} />
        <Route path="/file-management" element={<ProtectedRoute element={<FileManagementPage />} />} />

        {/* Admin routes */}
        <Route path="/manage-cohorts" element={<ProtectedRoute element={<ManageCohorts />} />} />

        {/* Supplementary (tài liệu bổ sung) */}
        <Route path="/supplementary" element={<ProtectedRoute element={<SupplementaryMaterialsPage />} />} />
      </Routes>

      {!hideNavbarOrChatbot && <ChatbotWidget />}
    </>
  );
};

export default App;