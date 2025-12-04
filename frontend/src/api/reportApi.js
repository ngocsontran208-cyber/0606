import api from "../services/api";

// === CÁC HÀM CŨ CỦA BẠN (GIỮ NGUYÊN) ===

export const fetchSummaryReport = (curriculum_id) =>
  api.get("/reports/summary", {
    params: { curriculum_id },
  });

export const fetchCoverageReport = (curriculum_id) =>
  api.get("/reports/material-coverage", {
    params: { curriculum_id },
  });

export const fetchCoverageByMajor = (curriculum_id) =>
  api.get("/reports/material-coverage-by-major", {
    params: { curriculum_id },
  });

export const fetchMissingMaterials = (curriculum_id) =>
  api.get("/reports/missing-materials", {
    params: { curriculum_id },
  });

export const exportReport = (data) =>
  api.post("/reports/export", data, {
    responseType: "blob",
  });

// === CÁC HÀM MỚI ĐÃ THÊM VÀO ===

/**
 * (HÀM MỚI) Lấy dữ liệu báo cáo dựa trên bộ lọc
 * @param {object} filters - { curriculumId, majorId, courseId }
 */
export const getReport = (filters) => {
  // Gọi đến POST /api/reports
  return api.post('/reports', filters);
};

/**
 * (HÀM MỚI) Xuất file Excel danh mục BỔ SUNG
 * @param {number} curriculumId - ID của đề cương
 */
export const exportSupplementaryReport = (curriculumId) => {
  // Gọi đến GET /api/reports/export-supplementary
  return api.get(`/reports/export-supplementary`, {
    params: { curriculumId },
    responseType: 'blob', // Rất quan trọng: để nhận về dạng file
  });
};

/**
 * (HÀM MỚI) Lấy báo cáo người dùng (User Analytics)
 * @param {string} fromDate - YYYY-MM-DD (Tùy chọn)
 * @param {string} toDate - YYYY-MM-DD (Tùy chọn)
 */
export const fetchUserAnalytics = (fromDate, toDate) => {
  // Gọi đến GET /api/reports/users
  return api.get("/reports/users", {
    params: { fromDate, toDate }
  });
};