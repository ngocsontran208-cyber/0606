import api from "../services/api";

// Thêm hàm xử lý lỗi
const handleError = (action, error) => {
  const message = error.response?.data?.message || error.message || "Lỗi không xác định";
  throw new Error(message); 
};

export const fetchCurriculums = async (token) => {
  try {
    const response = await api.get("curriculums", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(response.data)
      ? response.data.map((curriculum) => ({
          ...curriculum,
          status: curriculum.status || "Đang chỉnh sửa",
        }))
      : [];
  } catch (error) {
    handleError("Lấy danh sách đề cương", error);
    return [];
  }
};

export const getCurriculumById = async (id, token) => {
  try {
    const response = await api.get(`curriculums/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    handleError("Lấy chi tiết đề cương", error);
    return null;
  }
};

export const createCurriculum = async (data, token) => {
  try {
    const res = await api.post("curriculums", {
      name: data.name,
      year: data.year,
      status: "Đang chỉnh sửa",
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    handleError("Tạo đề cương", error);
    throw error;
  }
};

export const updateCurriculum = async (id, data, token) => {
  try {
    const res = await api.put(`curriculums/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    handleError("Cập nhật đề cương", error);
    throw error;
  }
};

export const lockCurriculum = async (id, token) => {
  try {
    const res = await api.put(`curriculums/${id}`, { status: "Đã khóa" }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    handleError("Khóa đề cương", error);
    throw error;
  }
};

export const unlockCurriculum = async (id, token) => {
  try {
    const res = await api.put(`curriculums/${id}`, { status: "Đang chỉnh sửa" }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    handleError("Mở khóa đề cương", error);
    throw error;
  }
};

export const deleteCurriculum = async (id, token) => {
  try {
    const res = await api.delete(`curriculums/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    handleError("Xóa đề cương", error);
    throw error;
  }
};

// Lấy danh sách ngành của đề cương
export const getCurriculumMajors = async (id, token) => {
  try {
    const response = await api.get(`curriculums/${id}/majors`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    handleError("Lấy ngành của đề cương", error);
    return [];
  }
};

// *** MỚI: Gán ngành có sẵn vào đề cương ***
export const addMajorToCurriculum = async (data, token) => {
  try {
    // data = { curriculumId, majorId }
    const res = await api.post("curriculums/add-major", data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    handleError("Gán ngành vào đề cương", error);
    throw error;
  }
};

// *** MỚI: Gỡ ngành khỏi đề cương ***
export const removeMajorFromCurriculum = async (curriculumId, majorId, token) => {
  try {
    const res = await api.delete(`curriculums/${curriculumId}/majors/${majorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    handleError("Gỡ ngành khỏi đề cương", error);
    throw error;
  }
};

export const duplicateCurriculum = async (id, token) => {
  try {
    const res = await api.post(`curriculums/${id}/duplicate`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    handleError("Nhân bản đề cương", error);
    throw error;
  }
};

// *** MỚI: Gán Khóa cho đề cương (Đã bỏ comment) ***
export const assignCohortsToCurriculum = async (id, cohortIds, token) => {
  try {
    const res = await api.put(`curriculums/${id}/assign-cohorts`, { cohortIds }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    handleError("Gán khóa cho đề cương", error);
    throw error;
  }
};

// Hàm công khai lấy toàn bộ danh sách đề cương
export const getAllCurriculumsPublic = async () => {
  try {
    const response = await api.get("/curriculums/public/all");
    return response.data;
  } catch (error) {
    handleError("Lấy danh sách đề cương công khai", error);
    throw error;
  }
};