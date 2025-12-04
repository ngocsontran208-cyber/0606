// frontend/src/api/cohortApi.js

import api from '../services/api';

const cohortApi = {
  // SỬA: Thêm 'token'
  getAllCohorts: (token) => {
    return api.get('/cohorts', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // SỬA: Thêm 'token'
  getCohortById: (id, token) => {
    return api.get(`/cohorts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // SỬA: Thêm 'token'
  createCohort: (cohortData, token) => {
    return api.post('/cohorts', cohortData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // SỬA: Thêm 'token'
  updateCohort: (id, cohortData, token) => {
    return api.put(`/cohorts/${id}`, cohortData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // SỬA: Thêm 'token'
  deleteCohort: (id, token) => {
    return api.delete(`/cohorts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // *** BẮT ĐẦU CODE MỚI ***
  
  /**
   * Gán danh sách đề cương (bằng mảng ID) cho một khóa học
   */
  assignCurriculumsToCohort: (id, curriculumIds, token) => {
    const data = { curriculumIds: curriculumIds }; 
    return api.post(`/cohorts/${id}/assign-curriculums`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  
  // *** KẾT THÚC CODE MỚI ***
};

export default cohortApi;