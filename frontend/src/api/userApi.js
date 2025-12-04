import api from "../services/api";

const handleError = (action, error) => {
  const message = error.response?.data?.message || error.message || "Lỗi không xác định";
  // Ném lỗi để component có thể bắt và hiển thị
  throw new Error(message); 
};

export const fetchOnlineUsers = async (token) => {
  try {
    if (!token) throw new Error("Token không tồn tại");
    const res = await api.get("/users/online", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data || [];
  } catch (error) {
    const errorMessage = handleError("Lấy danh sách người dùng online", error);
    throw new Error(errorMessage);
  }
};

// *** ĐÃ CẬP NHẬT: Cho phép lọc theo majorId và cohortId ***
export const fetchUsers = async (token, filters = {}) => { 
  try {
    const params = new URLSearchParams();
    if (filters.majorId) {
      params.append("majorId", filters.majorId);
    }
    if (filters.cohortId) {
      params.append("cohortId", filters.cohortId);
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    
    const res = await api.get(`/users${queryString}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    handleError("Lấy danh sách người dùng", error);
    throw new Error(error.message); // Ném lỗi
  }
};
// *** KẾT THÚC CẬP NHẬT ***

export const fetchUserActions = async (token) => {
  try {
    const res = await api.get("/users/actions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    handleError("Lấy lịch sử thao tác", error);
    throw new Error(error.message); // Ném lỗi
  }
};

export const fetchUserProfile = async (token) => {
  try {
    const res = await api.get("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    handleError("Lấy thông tin cá nhân", error);
    throw new Error(error.message); // Ném lỗi
  }
};

export const createUser = async (token, data) => {
  try {
    const res = await api.post("/users", data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    handleError("Tạo user", error);
    throw new Error(error.message); // Ném lỗi
  }
};

export const updateUser = async (token, id, data) => {
  try {
    const res = await api.put(`/users/${id}`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    handleError(`Cập nhật user ${id}`, error);
    throw new Error(error.message); // Ném lỗi
  }
};

export const updateProfile = async (token, data) => {
  try {
    const res = await api.put("/users/me", data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    handleError("Cập nhật hồ sơ", error);
    throw new Error(error.message); // Ném lỗi
  }
};

export const updatePassword = async (token, passwords) => {
  try {
    const res = await api.put("/users/me/password", passwords, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    handleError("Cập nhật mật khẩu", error);
    throw new Error(error.message); // Ném lỗi
  }
};

export const adminUpdateUserPassword = async (token, userId, newPassword) => {
  try {
    const res = await api.put(
      `/users/${userId}`,
      { password: newPassword },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    handleError(`Admin đổi mật khẩu user ID ${userId}`, error);
    throw new Error(error.message); // Ném lỗi
  }
};

export const deleteUser = async (token, id) => {
  try {
    const res = await api.delete(`/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error)
  {
    handleError(`Xóa user ${id}`, error);
    throw new Error(error.message); // Ném lỗi
  }
};

export const fetchRoles = async (token) => {
  try {
    const res = await api.get("/roles", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    handleError("Lấy danh sách quyền", error);
    throw new Error(error.message); // Ném lỗi
  }
};

export const importUsers = async (token, formData) => {
  try {
    const res = await api.post("/users/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    handleError("Import danh sách người dùng", error);
    throw new Error(error.message); // Ném lỗi
  }
};

// *** THÊM HÀM MỚI ĐỂ GỌI API KHÓA/MỞ KHÓA ***
export const bulkUpdateUserStatus = async (token, userIds, is_locked) => {
  try {
    const res = await api.post("/users/bulk-status", { userIds, is_locked }, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    // Ném lỗi để component có thể bắt và hiển thị
    handleError("Cập nhật trạng thái hàng loạt", error);
    throw new Error(error.message);
  }
};
// *** KẾT THÚC ***

// *** BẮT ĐẦU CODE MỚI CHO TRANG HOME ***
export const fetchMyCurriculums = async (token) => {
  try {
    const res = await api.get("/users/my-curriculums", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // Hàm này trả về res.data
  } catch (error) {
    handleError("Lấy đề cương của tôi", error);
    throw new Error(error.message); // Ném lỗi
  }
};
// *** KẾT THÚC CODE MỚI ***