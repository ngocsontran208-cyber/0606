// frontend/src/pages/ImportantFilesPage.js
// *** FILE HOÀN CHỈNH ĐÃ SỬA VÀ TỐI ƯU GIAO DIỆN ***

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { uploadImportantFile, getImportantFiles, deleteImportantFile } from '../api/importantFileApi';
import { Card, Table, Button, Input, Upload, Modal, Spin, message, Space, Typography, Tooltip, Tag } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined, SearchOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { FaFilePdf, FaFileImage, FaFile } from 'react-icons/fa'; // Cải thiện icon
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import api from '../services/api';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const { Search } = Input;
const { Text } = Typography;
const ITEMS_PER_PAGE = 10;

const fileBaseUrl = api.defaults.baseURL.replace('/api', '');

const ImportantFilesPage = () => {
  const [allFiles, setAllFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const { token } = useContext(AuthContext);

  const fetchFiles = async (termToUse = searchTerm) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getImportantFiles(token);
      const rawFiles = Array.isArray(res.data) ? res.data : [];
      setAllFiles(rawFiles);

      // Lọc dữ liệu dựa trên searchTerm mới nhất
      const filtered = rawFiles.filter(file =>
        // Lọc theo cả 'name' và 'originalname'
        file.originalname.toLowerCase().includes(termToUse.toLowerCase()) ||
        (file.name && file.name.toLowerCase().includes(termToUse.toLowerCase()))
      );
      setFilteredFiles(filtered);
      setPage(1); // Reset trang khi lọc/fetch
    } catch (error) {
      message.error('Không thể tải danh sách file!');
      setAllFiles([]);
      setFilteredFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFiles();
    }
  }, [token, searchTerm]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    // useEffect sẽ tự động gọi fetchFiles/filter
  };

  const handleUpload = async ({ file }) => {
    setLoading(true);
    try {
      await uploadImportantFile(file, token);
      message.success('Upload file thành công!');

      // Reset search và gọi fetchFiles với search rỗng để hiển thị toàn bộ list
      setSearchTerm('');
      await fetchFiles('');

    } catch (error) {
      console.error("Upload Error:", error);
      message.error(`Upload file thất bại: ${error.response?.data?.error || 'Lỗi mạng hoặc server'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc muốn xóa file này? Thao tác này không thể hoàn tác.', // Cập nhật nội dung
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger', // Thêm kiểu danger cho nút Xóa
      onOk: async () => {
        setLoading(true);
        try {
          await deleteImportantFile(id, token);
          message.success('Xóa file thành công!');
          // Tải lại dữ liệu sau khi xóa
          await fetchFiles();
        } catch (error) {
          message.error('Xóa file thất bại!');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const getAbsoluteUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return `${fileBaseUrl}/${fileUrl}`;
  };

  const handlePreview = (file) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      const absoluteUrl = getAbsoluteUrl(file.fileUrl);
      setPreviewFile({ ...file, fileUrl: absoluteUrl });
      setPreviewVisible(true);
    } else {
      message.warning('Chỉ hỗ trợ xem trước file PDF và hình ảnh!');
    }
  };

  const handleDownload = (file) => {
    const absoluteUrl = getAbsoluteUrl(file.fileUrl);
    const link = document.createElement('a');
    link.href = absoluteUrl;
    link.download = file.originalname;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClosePreview = () => {
    setPreviewVisible(false);
    setPreviewFile(null);
  };

  // Hàm tạo icon dựa trên mimetype
  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return <FaFileImage style={{ color: '#4CAF50' }} />; // Xanh lá cho ảnh
    if (mimetype === 'application/pdf') return <FaFilePdf style={{ color: '#F44336' }} />; // Đỏ cho PDF
    return <FaFile style={{ color: '#9E9E9E' }} />; // Xám cho loại khác
  };
  
  // Hàm tạo Tag dựa trên mimetype
  const getMimeTag = (mimetype) => {
    if (mimetype.startsWith('image/')) return <Tag color="green">Hình Ảnh</Tag>;
    if (mimetype === 'application/pdf') return <Tag color="red">PDF Document</Tag>;
    if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return <Tag color="blue">Excel/Sheet</Tag>;
    if (mimetype.includes('word') || mimetype.includes('document')) return <Tag color="volcano">Word/Doc</Tag>;
    return <Tag color="default">{mimetype.split('/')[1]?.toUpperCase() || 'Khác'}</Tag>;
  };

  const formatFileSize = (size) => {
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
      return `${(size / 1024 / 1024).toFixed(2)} MB`;
  };

  const columns = [
    {
      title: 'Icon', // Đổi tên cột cho rõ ràng
      dataIndex: 'mimetype',
      key: 'icon',
      render: (mimetype) => (
        <div style={{ fontSize: 20, textAlign: 'center' }}>
          {getFileIcon(mimetype)}
        </div>
      ),
      width: 70,
      align: 'center',
    },
    {
      title: 'Tên File Lưu',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      ellipsis: true,
      render: (text) => <Text strong>{text}</Text>, // In đậm tên file
    },
    {
      title: 'Tên Gốc (Original)',
      dataIndex: 'originalname',
      key: 'originalname',
      sorter: (a, b) => a.originalname.localeCompare(b.originalname),
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Kích Thước',
      dataIndex: 'size',
      key: 'size',
      sorter: (a, b) => a.size - b.size,
      render: (size) => formatFileSize(size), // Sử dụng hàm định dạng mới
      width: 120,
    },
    {
      title: 'Loại File',
      dataIndex: 'mimetype',
      key: 'mimetype',
      render: (mimetype) => getMimeTag(mimetype), // Sử dụng Tag để hiển thị loại file
      width: 150,
      responsive: ['lg'], // Chỉ hiển thị trên màn hình lớn
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem trước">
            <Button
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
              disabled={loading}
              style={{ color: '#1890ff', borderColor: '#e6f7ff' }}
            />
          </Tooltip>
          <Tooltip title="Tải xuống">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              disabled={loading}
              style={{ color: '#52c41a', borderColor: '#f6ffed' }}
            />
          </Tooltip>
          <Tooltip title="Xóa file">
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(record.id)}
              disabled={loading}
            />
          </Tooltip>
        </Space>
      ),
      width: 150,
      align: 'center',
    },
  ];

  return (
    <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card 
        bordered={false} // Bỏ border để trông nhẹ nhàng hơn
        style={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }} // Thêm shadow nhẹ
      >
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 24,
            flexWrap: 'wrap', // Cho phép xuống dòng trên màn hình nhỏ
            gap: 16, // Khoảng cách giữa các item
          }}
        >
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1f1f1f', margin: 0, display: 'flex', alignItems: 'center' }}>
            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Quản Lý File Quan Trọng
          </h1>
          <Space size="middle" wrap>
            <Search
              placeholder="Tìm kiếm theo Tên File hoặc Tên Gốc..."
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
              allowClear
              enterButton // Thêm nút enter/search rõ ràng
              prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.45)' }} />}
              style={{ width: 350 }} // Tăng chiều rộng Search
            />
            <Upload
              customRequest={handleUpload}
              showUploadList={false}
              disabled={loading}
              accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" // Chỉ định các loại file thường dùng
            >
              <Button
                icon={<UploadOutlined />}
                type="primary"
                loading={loading} // Sử dụng prop loading của Button
                size="large" // Nút lớn hơn, nổi bật hơn
                style={{
                  borderRadius: 6,
                  fontWeight: '500',
                  // ✨ SỬA LỖI NÚT BẤM
                  background: "#1677ff",
                  color: "#ffffff",
                  border: "none"
                }}
              >
                Upload File
              </Button>
            </Upload>
          </Space>
        </div>

        <Spin spinning={loading} tip="Đang tải dữ liệu...">
          <Table
            columns={columns}
            dataSource={filteredFiles}
            rowKey="id"
            // *** Cải thiện giao diện Table ***
            size="middle" // Kích thước bảng nhỏ hơn, gọn gàng hơn
            bordered={false} // Bỏ border cho kiểu dáng hiện đại hơn
            pagination={{
              current: page,
              pageSize: ITEMS_PER_PAGE,
              total: filteredFiles.length,
              showSizeChanger: false,
              onChange: (newPage) => setPage(newPage),
              position: ['bottomCenter'], // Đặt phân trang ở giữa dưới
            }}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: "Không tìm thấy file nào." }} // Thông báo trống
          />
        </Spin>
      </Card>

      {/* Modal Preview - Giữ nguyên logic cơ bản, có thể chỉnh style thêm nếu cần */}
      <Modal
        title={previewFile?.originalname || "Xem trước file"}
        open={previewVisible}
        onCancel={handleClosePreview}
        footer={null}
        width={900} // Tăng kích thước modal
        centered // Đặt modal ở giữa màn hình
        styles={{ body: { padding: 0 } }} // Loại bỏ padding mặc định của body modal
      >
        <div style={{ maxHeight: '80vh', overflowY: 'auto', padding: 24, textAlign: 'center' }}>
          {previewFile && (
            <>
              {previewFile.mimetype.startsWith('image/') ? (
                <img
                  src={previewFile.fileUrl}
                  alt={previewFile.originalname}
                  style={{ width: 'auto', maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              ) : previewFile.mimetype === 'application/pdf' ? (
                // Document và Page cần nằm trong div có kích thước cụ thể để hoạt động tốt
                <div style={{ width: '100%', margin: '0 auto', border: '1px solid #eee' }}>
                  <Document
                    file={previewFile.fileUrl}
                    loading={<Spin tip="Đang tải PDF..." />}
                    error={<p>File PDF không hợp lệ hoặc không thể tải!</p>}
                  >
                    {/* Hiển thị trang 1, có thể thêm logic để cuộn qua các trang nếu cần */}
                    <Page pageNumber={1} width={850} /> 
                  </Document>
                </div>
              ) : (
                <p>Không hỗ trợ xem trước loại file này. Vui lòng tải xuống để xem.</p>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ImportantFilesPage;