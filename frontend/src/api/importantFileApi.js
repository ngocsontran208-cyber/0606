// frontend/src/api/importantFileApi.js
import api from '../services/api';

// *** SỬA: Thêm 'token' làm tham số ***
export const uploadImportantFile = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/important-files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      // *** SỬA: Thêm header Authorization ***
      'Authorization': `Bearer ${token}` 
    },
  });
};

// *** SỬA: Thêm 'token' làm tham số ***
export const getImportantFiles = async (token) => {
  return api.get('/important-files', {
    headers: {
      // *** SỬA: Thêm header Authorization ***
      'Authorization': `Bearer ${token}`
    }
  });
};

// *** SỬA: Thêm 'token' làm tham số ***
export const deleteImportantFile = async (id, token) => {
  return api.delete(`/important-files/${id}`, {
    headers: {
      // *** SỬA: Thêm header Authorization ***
      'Authorization': `Bearer ${token}`
    }
  });
};