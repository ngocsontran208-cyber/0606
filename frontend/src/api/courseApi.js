//
import api from "../services/api";

const courseApi = {
  // --- QUAN TRỌNG: Đã thêm curriculumId để lọc môn theo đề cương ---
  getByMajor: (majorId, curriculumId, token) => {
    return api.get(`/courses/majors/${majorId}/courses`, {
      params: { curriculum_id: curriculumId }, // Lọc theo đề cương
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getAll: (params = {}, token) => api.get("/courses", { 
    params,
    headers: { Authorization: `Bearer ${token}` }
  }),

  create: (data, token) => api.post("/courses", data, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  update: (id, data, token) => api.put(`/courses/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  // Xóa môn học (Xóa hoàn toàn)
  delete: (id, token) => api.delete(`/courses/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),

  assignToMajor: (courseId, majorId, token, options = {}) =>
    api.post(`/courses/${courseId}/assign-major`, {
      major_id: majorId,
      includeMaterials: options.includeMaterials || false,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Gỡ môn học khỏi ngành (giữ lại môn nếu nó thuộc ngành khác)
  removeCourseFromMajor: (id, major_id, token) =>
    api.delete(`/courses/${id}`, { 
      params: { major_id },
      headers: { Authorization: `Bearer ${token}` } 
    }),

  syncCourses: (curriculum_id, clear_old_courses = false, token) =>
    api.post("/courses/sync", { curriculum_id, clear_old_courses }, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  // --- HÀM MỚI: Lấy môn theo mã (Public) ---
  // Cập nhật thêm curriculumId để tìm chính xác version của môn học
  getByCode: (code, curriculumId) => {
    return api.get(`/courses/code/${code}`, {
        params: { curriculumId }
    });
  },
};

export default courseApi;