import api from '../services/api'; // Import axios instance

/**
 * Tạo hoặc cập nhật thông tin bổ sung (link, giá, trạng thái, lý do)
 * @param {object} data - Dữ liệu bao gồm { materialId, link, priceUSD, priceVND, status, reason }
 */
export const createOrUpdateSupplementary = (data) => {
  // Gọi đến POST /api/supplementary
  return api.post('/supplementary', data);
};

/**
 * Lấy thông tin bổ sung bằng materialId (ít dùng, nhưng để sẵn)
 * @param {number} materialId - ID của material
 */
export const getSupplementaryMaterial = (materialId) => {
  // Gọi đến GET /api/supplementary/material/:materialId
  return api.get(`/supplementary/material/${materialId}`);
};