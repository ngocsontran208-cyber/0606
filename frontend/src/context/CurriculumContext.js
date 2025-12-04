import React, { createContext, useState, useEffect, useContext } from "react";
import { fetchCurriculums } from "../api/curriculumApi"; // Import API để tải
import { useAuth } from "./AuthContext"; // Import AuthContext để lấy token

export const CurriculumContext = createContext();

const CurriculumProvider = ({ children }) => {
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);

  // --- START: THÊM CODE MỚI ---
  const [curriculums, setCurriculums] = useState([]); // State để chứa danh sách
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Lấy thông tin user (để lấy token)

  useEffect(() => {
    // Định nghĩa hàm tải danh sách
    const loadCurriculums = async () => {
      // Chỉ tải nếu user đã đăng nhập (vì API curriculumApi.js cần token)
      if (user && user.token) { 
        try {
          setLoading(true);
          // Gọi API và truyền token vào
          const data = await fetchCurriculums(user.token); 
          setCurriculums(data || []); // Lưu kết quả vào state
        } catch (error) {
          console.error("Lỗi không thể tải danh sách đề cương:", error);
          setCurriculums([]); // Set rỗng nếu có lỗi
        } finally {
          setLoading(false);
        }
      } else {
        // Nếu chưa đăng nhập, danh sách là rỗng
        setCurriculums([]);
        setLoading(false);
      }
    };

    loadCurriculums();
  }, [user]); // Chạy lại hàm này mỗi khi user thay đổi (đăng nhập/đăng xuất)

  // --- END: THÊM CODE MỚI ---

  // Thêm 'curriculums' (danh sách) vào giá trị của Provider
  const value = {
    selectedCurriculum,
    setSelectedCurriculum,
    curriculums, // Đây là thứ mà trang SupplementaryMaterialsPage cần
    loadingCurriculums: loading // (Tùy chọn)
  };

  return (
    <CurriculumContext.Provider value={value}>
      {children}
    </CurriculumContext.Provider>
  );
};

export default CurriculumProvider;