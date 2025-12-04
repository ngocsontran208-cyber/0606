// frontend/src/pages/ManageCohorts.js
// *** FILE HOÀN CHỈNH ĐÃ CẬP NHẬT ***

import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  Typography,
  message,
  Space,
  Table,
  Popconfirm,
  Modal,
  Spin,
  Row,
  Col,
  Select, // *** THÊM ***
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
  PaperClipOutlined, // *** THÊM ***
} from '@ant-design/icons';
import cohortApi from '../api/cohortApi';
import * as curriculumApi from '../api/curriculumApi'; // *** THÊM ***
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { debounce } from 'lodash';

const { Title } = Typography;
const { Option } = Select; // *** THÊM ***

const ManageCohorts = () => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem('token'); // *** THÊM: Lấy token ***
  const [cohorts, setCohorts] = useState([]);
  const [filteredCohorts, setFilteredCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [editingCohort, setEditingCohort] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isAdmin = user?.role?.name === "admin"; // File của bạn là 'admin'

  // *** THÊM: State cho Modal gán ***
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [allCurriculums, setAllCurriculums] = useState([]);
  const [selectedCurriculumIds, setSelectedCurriculumIds] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  // *** KẾT THÚC ***

  const fetchCohorts = useCallback(async () => {
    if (!token) return; // *** THÊM: Cần token
    try {
      setLoading(true);
      // *** SỬA: Gửi token ***
      const response = await cohortApi.getAllCohorts(token);
      const sorted = (response.data || []).sort((a, b) => (b.start_year || 0) - (a.start_year || 0));
      setCohorts(sorted);
    } catch (error) {
      message.error('Lỗi khi tải danh sách Khóa!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token]); // *** SỬA: Thêm dependency 'token' ***

  // *** THÊM: Hàm tải đề cương ***
  const loadAllCurriculums = useCallback(async () => {
    if (!token) return;
    try {
      const response = await curriculumApi.fetchCurriculums(token);
      // const lockedCurriculums = response.filter(c => c.status === 'Đã khóa'); // *** SỬA: Bỏ lọc theo yêu cầu ***
      setAllCurriculums(response); // *** SỬA: Hiển thị tất cả ***
    } catch (error) {
      message.error("Lỗi khi tải danh sách đề cương để gán.");
    }
  }, [token]);
  // *** KẾT THÚC ***

  useEffect(() => {
    if (isAdmin) {
      fetchCohorts();
      loadAllCurriculums(); // *** THÊM ***
    }
  }, [isAdmin, fetchCohorts, loadAllCurriculums]); // *** SỬA ***

  // Lọc
  const debouncedSearch = debounce((term) => {
    setSearchTerm(term);
  }, 300);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filtered = cohorts.filter(
      (c) => (c.name && c.name.toLowerCase().includes(lower))
    );
    setFilteredCohorts(filtered);
  }, [cohorts, searchTerm]);

  // Mở/Đóng Modal
  const showModal = (cohort = null) => {
    if (cohort) {
      setEditingCohort(cohort);
      form.setFieldsValue({
        ...cohort,
        start_year: cohort.start_year || undefined,
        end_year: cohort.end_year || undefined,
      });
    } else {
      setEditingCohort(null);
      form.resetFields();
    }
    setFormVisible(true);
  };

  const handleCancel = () => {
    setFormVisible(false);
    setEditingCohort(null);
    form.resetFields();
  };

  // Lưu (Tạo/Sửa)
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (editingCohort) {
        // *** SỬA: Gửi token ***
        await cohortApi.updateCohort(editingCohort.id, values, token);
        message.success('Cập nhật Khóa thành công!');
      } else {
        // *** SỬA: Gửi token ***
        await cohortApi.createCohort(values, token);
        message.success('Tạo Khóa mới thành công!');
      }
      handleCancel();
      fetchCohorts(); // Tải lại
    } catch (error) {
      const msg = error.response?.data?.message || (editingCohort ? 'Lỗi khi cập nhật!' : 'Lỗi khi tạo mới!');
      message.error(msg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Xóa
  const handleDelete = async (id) => {
    try {
      // *** SỬA: Gửi token ***
      await cohortApi.deleteCohort(id, token);
      message.success('Xóa Khóa thành công!');
      fetchCohorts(); // Tải lại
    } catch (error) {
      const msg = error.response?.data?.message || 'Lỗi khi xóa Khóa!';
      message.error(msg);
      console.error(error);
    }
  };

  // *** THÊM: Các hàm cho Modal gán ***
  const handleOpenAssignModal = (cohort) => {
    setSelectedCohort(cohort);
    setModalLoading(true);

    // Lấy chi tiết khóa (để biết đề cương nào đã gán)
    cohortApi.getCohortById(cohort.id, token)
      .then(response => {
        const assignedIds = response.data.curriculums
          ? response.data.curriculums.map(c => c.id)
          : [];
        setSelectedCurriculumIds(assignedIds);
        setIsAssignModalVisible(true);
      })
      .catch(() => message.error("Lỗi khi lấy chi tiết khóa"))
      .finally(() => setModalLoading(false));
  };

  const handleAssignSubmit = async () => {
    if (!selectedCohort) return;
    setModalLoading(true);
    try {
      // Gửi mảng ID đề cương mới
      await cohortApi.assignCurriculumsToCohort(
        selectedCohort.id,
        selectedCurriculumIds,
        token
      );
      message.success('Gán đề cương cho khóa thành công!');
      setIsAssignModalVisible(false);
    } catch (error) {
      message.error('Lỗi khi gán đề cương.');
    } finally {
      setModalLoading(false);
    }
  };
  // *** KẾT THÚC ***

  // Cột cho bảng
  const columns = [
    {
      title: 'STT',
      dataIndex: 'stt',
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: 'Tên Khóa',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Năm bắt đầu',
      dataIndex: 'start_year',
      sorter: (a, b) => (a.start_year || 0) - (b.start_year || 0),
      width: 150,
    },
    {
      title: 'Năm kết thúc',
      dataIndex: 'end_year',
      sorter: (a, b) => (a.end_year || 0) - (b.end_year || 0),
      width: 150,
    },
    {
      title: 'Hành động',
      fixed: 'right',
      // *** SỬA: Tăng chiều rộng ***
      width: 200,
      render: (_, record) => (
        <Space>
          {/* *** THÊM: Nút Gán Đề cương *** */}
          <Button
            icon={<PaperClipOutlined />}
            onClick={() => handleOpenAssignModal(record)}
          >
            Gán
          </Button>
          <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Popconfirm
            title={`Xóa Khóa "${record.name}"?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!isAdmin) {
    // SỬA: Kiểm tra role là "admin" (chữ thường)
    message.error("Bạn không có quyền truy cập trang này!");
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <Card variant="bordered">
        {/* ... (Phần Card Title và Search Input giữ nguyên) ... */}
        <Space
          style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}
          direction="vertical"
        >
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Title level={3} style={{ marginBottom: 0 }}>
              <TeamOutlined /> Quản lý Khóa
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal(null)}
              // ✨ SỬA LỖI NÚT BẤM
              style={{
                background: "#1677ff",
                color: "#ffffff",
                border: "none"
              }}
            >
              Tạo Khóa mới
            </Button>
          </Space>
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Input
              placeholder="🔍 Tìm kiếm theo tên Khóa..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 300 }}
              onChange={(e) => debouncedSearch(e.target.value)}
            />
            <span style={{ color: '#888' }}>
              Tổng cộng: <b>{filteredCohorts.length}</b> Khóa
            </span>
          </Space>
        </Space>

        <Table
          rowKey="id"
          dataSource={filteredCohorts}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Modal cho Form (Sửa/Tạo) (Giữ nguyên) */}
      <Modal
        title={
          <div className="flex items-center gap-3 text-xl font-semibold text-gray-800">
            {editingCohort ? (
              <EditOutlined className="text-blue-500" />
            ) : (
              <PlusOutlined className="text-blue-500" />
            )}
            {editingCohort ? 'Chỉnh sửa Khóa' : 'Tạo Khóa mới'}
          </div>
        }
        open={formVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
        className="rounded-2xl shadow-xl"
        styles={{ body: { padding: '24px 32px' } }}
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="mt-6"
          >
            {/* ... (Các Form.Item giữ nguyên) ... */}
            <Form.Item
              label={<span className="font-medium text-gray-700">Tên Khóa</span>}
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên Khóa!' }]}
            >
              <Input
                className="rounded-lg h-10 shadow-sm"
                placeholder="Ví dụ: Khóa 63"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={<span className="font-medium text-gray-700">Năm bắt đầu</span>}
                  name="start_year"
                >
                  <Input
                    type="number"
                    className="rounded-lg h-10 shadow-sm"
                    placeholder="Ví dụ: 2024"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span className="font-medium text-gray-700">Năm kết thúc</span>}
                  name="end_year"
                >
                  <Input
                    type="number"
                    className="rounded-lg h-10 shadow-sm"
                    placeholder="Ví dụ: 2028"
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="flex justify-end gap-3 mt-8">
              <Button
                onClick={handleCancel}
                className="rounded-lg h-10 shadow-sm hover:bg-gray-100 transition-colors"
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="rounded-lg h-10 bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                // ✨ SỬA LỖI NÚT BẤM
                style={{
                  background: "#1677ff",
                  color: "#ffffff",
                  border: "none"
                }}
              >
                {editingCohort ? 'Cập nhật' : 'Thêm'}
              </Button>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* *** THÊM: Modal Gán Đề cương *** */}
      <Modal
        title={
          <div className="flex items-center gap-3 text-xl font-semibold text-gray-800">
            <PaperClipOutlined className="text-blue-500" />
            Gán Đề cương cho: {selectedCohort?.name}
          </div>
        }
        open={isAssignModalVisible}
        onOk={handleAssignSubmit}
        onCancel={() => setIsAssignModalVisible(false)}
        confirmLoading={modalLoading}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
        // ✨ SỬA LỖI NÚT BẤM
        okButtonProps={{
          style: {
            background: "#1677ff",
            color: "#ffffff",
            border: "none"
          }
        }}
        styles={{ body: { padding: '24px 32px' } }}
      >
        <Select
          mode="multiple"
          allowClear
          loading={modalLoading}
          style={{ width: '100%', marginTop: 20, marginBottom: 20 }}
          placeholder="Chọn các đề cương" // *** SỬA: Bỏ chú thích "Đã khóa" ***
          value={selectedCurriculumIds}
          onChange={(values) => setSelectedCurriculumIds(values)}
          // *** SỬA: Cập nhật text ***
          notFoundContent={allCurriculums.length === 0 ? "Không có đề cương nào để gán" : <Spin size="small" />}
        >
          {allCurriculums.map(cur => (
            <Option key={cur.id} value={cur.id}>
              {cur.name} (Năm: {cur.year}) {/* *** THÊM: Hiển thị trạng thái nếu muốn (ví dụ: {cur.status}) *** */}
              {/* (Trạng thái: {cur.status}) */}
            </Option>
          ))}
        </Select>
      </Modal>

    </div>
  );
};

export default ManageCohorts;