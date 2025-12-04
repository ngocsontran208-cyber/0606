// frontend/src/api/majorsApi.js
import api from "../services/api";

const majorsApi = {
  // Lấy danh sách ngành của một đề cương cụ thể
  getByCurriculum: async (curriculumId, token) => {
    try {
      const response = await api.get(`/majors/curriculum/${curriculumId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Lấy toàn bộ danh sách ngành (Master Data)
  getAll: async (token) => {
    try {
      const response = await api.get("/majors", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Tạo ngành mới (Master Data)
  create: async (data, token) => {
    try {
      const response = await api.post("/majors", data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật ngành
  update: async (id, data, token) => {
    try {
      const response = await api.put(`/majors/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Xóa ngành
  delete: async (id, token) => {
    try {
      const response = await api.delete(`/majors/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // *** QUAN TRỌNG: Hàm Import Excel ***
  // Cần truyền thêm curriculumId để biết import vào đâu
  import: async (file, majorId, curriculumId, token) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("major_id", majorId);
    formData.append("curriculum_id", curriculumId);

    try {
      const response = await api.post("/majors/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default majorsApi;