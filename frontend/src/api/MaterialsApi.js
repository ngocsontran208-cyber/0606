import api from "../services/api";

const getByCourseId = async (courseId) => {
  try {
    const response = await api.get(`/materials/course/${courseId}`);
    return response.data || [];
  } catch (error) {
    return [];
  }
};

const getAll = async () => {
  try {
    const response = await api.get("/materials");
    return response.data || [];
  } catch (error) {
    return [];
  }
};

const getById = async (id) => {
  try {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

const create = async (data) => {
  try {
    const response = await api.post("/materials", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const update = async (id, data) => {
  try {
    const response = await api.put(`/materials/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const remove = async (id) => {
  try {
    const response = await api.delete(`/materials/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const viewFile = async (id) => {
  try {
    const response = await api.get(`/materials/${id}/view`, {
      responseType: "blob",
    });
    return response;
  } catch (error) {
    throw error;
  }
};

const copyToMajor = async (courseId, majorId) => {
  try {
    const response = await api.post("/materials/copy-to-major", {
      course_id: courseId,
      major_id: majorId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const materialsApi = {
  getAll,
  getByCourseId,
  getById,
  create,
  update,
  viewFile,
  delete: remove,
  copyToMajor,
};

export default materialsApi;