import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Upload,
  Typography, // ✨ Thêm
  Space,        // ✨ Thêm
  Tag,          // ✨ Thêm
  Tooltip,      // ✨ Thêm
  InputNumber,  // ✨ Thêm
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  UploadOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { importCurriculum, duplicateCurriculum } from "../api/curriculumApi";

const { Option } = Select;
const { Title } = Typography; // ✨ Thêm

const Curriculums = () => {
  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [form] = Form.useForm();

  // ✨ --- Cải tiến Bộ lọc Năm ---
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState(currentYear);
  const yearOptions = [
    currentYear + 1,
    currentYear,
    currentYear - 1,
    currentYear - 2,
    currentYear - 3,
  ];
  // ✨ --- Kết thúc ---

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const role = user?.role?.name?.toLowerCase();
  const isAdmin = role === "admin";
  const isLibrarian = role === "librarian";

  useEffect(() => {
    fetchCurriculums();
  }, [yearFilter]); // Giữ nguyên

  const fetchCurriculums = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/curriculums", {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: yearFilter },
      });
      setCurriculums(res.data);
    } catch (error) {
      message.error("Lỗi tải danh sách đề cương!");
    }
    setLoading(false);
  };

  const handleFinish = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const userRaw = localStorage.getItem("user");
      if (!token || !userRaw) {
        message.error("Không tìm thấy thông tin người dùng!");
        return;
      }

      const user = JSON.parse(userRaw);
      const createdBy = user?.id;

      if (!createdBy) {
        message.error("Không xác định được người tạo!");
        return;
      }

      const payload = {
        name: values.name.trim(),
        year: parseInt(values.year, 10),
        status: values.status || "Đang chỉnh sửa",
        created_by: createdBy,
      };

      if (selectedCurriculum) {
        await api.put(`/curriculums/${selectedCurriculum.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success("Cập nhật đề cương thành công!");
      } else {
        await api.post("/curriculums", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success("Tạo đề cương mới thành công!");
      }

      setIsModalOpen(false);
      setSelectedCurriculum(null);
      form.resetFields();
      fetchCurriculums();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi tạo đề cương!");
    }
  };

  const handleEdit = (record) => {
    setSelectedCurriculum(record);
    form.setFieldsValue({
      name: record.name,
      year: record.year,
      status: record.status,
    });
    setIsModalOpen(true);
  };

  // (Các hàm toggleLockStatus, handleDelete, handleDuplicate giữ nguyên)
  const toggleLockStatus = async (id, newStatus) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await api.put(`/curriculums/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success(`🔒 Trạng thái đề cương đã chuyển thành: ${newStatus}`);
      // Tối ưu: Cập nhật state local thay vì gọi lại API
      setCurriculums((prev) =>
        prev.map((curriculum) =>
          curriculum.id === id ? { ...curriculum, status: newStatus } : curriculum
        )
      );
    } catch (error) {
      message.error("Lỗi khi cập nhật trạng thái đề cương!");
    }
    setLoading(false);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa đề cương này? Hành động này không thể hoàn tác!",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          await api.delete(`/curriculums/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          message.success("Xóa đề cương thành công!");
          setCurriculums((prev) => prev.filter((c) => c.id !== id));
        } catch (error) {
          message.error("Lỗi khi xóa đề cương!");
        }
        setLoading(false);
      },
    });
  };

  const handleDuplicate = async (id) => {
    setLoading(true);
    try {
      await duplicateCurriculum(id);
      message.success("Sao chép đề cương thành công!");
      fetchCurriculums();
    } catch (error) {
      message.error("Lỗi khi sao chép đề cương!");
    }
    setLoading(false);
  };
  
  // ✨ --- Cải tiến Cột (Columns) ---
  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => index + 1,
      width: 70,
      align: "center",
    },
    {
      title: "Tên Đề Cương",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "Năm",
      dataIndex: "year",
      key: "year",
      width: 100,
      align: "center",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      align: "center",
      render: (status) => (
        <Tag color={status === "Đã khóa" ? "volcano" : "green"}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      align: "center",
      render: (record) => (
        <Space size="middle">
          <Tooltip title="Sửa">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>

          <Tooltip
            title={record.status === "Đã khóa" ? "Mở khóa" : "Khóa"}
          >
            <Button
              icon={
                record.status === "Đã khóa" ? (
                  <UnlockOutlined />
                ) : (
                  <LockOutlined />
                )
              }
              onClick={() => {
                if (!isAdmin && record.status === "Đã khóa") {
                  message.warning("Chỉ admin mới được mở khóa đề cương!");
                } else {
                  toggleLockStatus(
                    record.id,
                    record.status === "Đã khóa" ? "Đang chỉnh sửa" : "Đã khóa"
                  );
                }
              }}
            />
          </Tooltip>

          <Tooltip title="Sao chép">
            <Button
              icon={<CopyOutlined />}
              onClick={() => {
                if (isLibrarian) {
                  message.warning("Bạn không có quyền sao chép đề cương!");
                } else {
                  handleDuplicate(record.id);
                }
              }}
            />
          </Tooltip>

          <Tooltip title="Xóa">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                if (isLibrarian) {
                  message.warning("Bạn không có quyền xóa đề cương!");
                } else {
                  handleDelete(record.id);
                }
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];
  // ✨ --- Kết thúc Cải tiến Cột ---

  return (
    // ✨ --- Cải tiến Bố cục (Layout) ---
    <div style={{ padding: 24, maxWidth: 1600, margin: "0 auto" }}>
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 8,
        }}
      >
        {/* ✨ --- Thanh Toolbar mới --- */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Quản lý Đề Cương
          </Title>
          <Space>
            <Select
              value={yearFilter}
              onChange={setYearFilter}
              style={{ width: 120 }}
            >
              {yearOptions.map((year) => (
                <Option key={year} value={year}>
                  Năm {year}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedCurriculum(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
              // ✨ SỬA LỖI: Thêm style nội tuyến để ép nút hiển thị
              style={{
                background: "#1677ff",
                color: "#ffffff",
                border: "none"
              }}
            >
              Thêm Đề Cương
            </Button>
          </Space>
        </div>

        <Modal
          title={selectedCurriculum ? "Cập nhật Đề Cương" : "Thêm Đề Cương"}
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
        >
          {/* ✨ --- Cải tiến Form --- */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{
              year: currentYear,
              status: "Đang chỉnh sửa",
            }}
          >
            <Form.Item
              name="name"
              label="Tên Đề Cương"
              rules={[{ required: true, message: "Vui lòng nhập tên đề cương" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="year"
              label="Năm"
              rules={[{ required: true, message: "Vui lòng nhập năm" }]}
            >
              {/* Dùng InputNumber thay vì Input type=number */}
              <InputNumber style={{ width: "100%" }} placeholder="Nhập năm học..." />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái">
              <Select>
                <Option value="Đang chỉnh sửa">Đang chỉnh sửa</Option>
                <Option value="Đã khóa">Đã khóa</Option>
              </Select>
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              // ✨ SỬA LỖI: Thêm style nội tuyến để ép nút hiển thị
              style={{
                background: "#1677ff",
                color: "#ffffff",
                border: "none"
              }}
            >
              {selectedCurriculum ? "Cập nhật" : "Tạo mới"}
            </Button>
          </Form>
        </Modal>

        <Table
          columns={columns} // ✨ Sử dụng columns đã cải tiến
          dataSource={curriculums}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default Curriculums;