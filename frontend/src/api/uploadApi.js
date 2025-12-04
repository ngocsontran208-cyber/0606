import api from "../services/api";
import CryptoJS from "crypto-js";

export const calculateChecksum = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
      const checksum = CryptoJS.MD5(wordArray).toString();
      resolve(checksum);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
};

export const uploadFile = async (file, onProgress, retries = 3) => {
  try {
    const originalChecksum = await calculateChecksum(file);
    const formData = new FormData();
    formData.append("file", file);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await api.post("/upload/file", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 10 * 60 * 1000,
          onUploadProgress: (e) => {
            if (onProgress) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          },
        });

        if (res.data.checksum !== originalChecksum) {
          throw new Error("Checksum không khớp, file có thể bị hỏng trong quá trình upload.");
        }

        return res.data;
      } catch (error) {
        if (attempt === retries) {
          throw new Error(`Upload thất bại sau ${retries} lần thử: ${error.message}`);
        }
      }
    }
  } catch (error) {
    throw new Error(`Lỗi xử lý file: ${error.message}`);
  }
};

export const getUploadedFiles = async () => {
  try {
    const res = await api.get("/upload/files");
    return res.data.map((file) => ({
      ...file,
      url: `${api.defaults.baseURL.replace('/api', '')}/Uploads/${encodeURIComponent(file.name)}`,
    }));
  } catch (error) {
    throw new Error(`Lỗi lấy danh sách file: ${error.message}`);
  }
};

export const deleteFile = async (filename) => {
  try {
    const res = await api.delete(`/upload/file/${encodeURIComponent(filename)}`);
    return res.data;
  } catch (error) {
    throw new Error(`Lỗi xóa file: ${error.message}`);
  }
};