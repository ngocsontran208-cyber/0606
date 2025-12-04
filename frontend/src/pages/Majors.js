// frontend/src/pages/Majors.js
import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import majorsApi from "../api/majorsApi";
// ✅ SỬA LỖI IMPORT: Import đúng các hàm lẻ từ curriculumApi
import { 
  getCurriculumMajors, 
  addMajorToCurriculum, 
  removeMajorFromCurriculum 
} from "../api/curriculumApi"; 

import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Upload,
  Typography,
  Space,
  Tooltip,
  Card,
  Tag,
  Tabs,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  ReloadOutlined,
  ApartmentOutlined,
  ArrowRightOutlined,
  LinkOutlined
} from "@ant-design/icons";

const { Option } = Select;
const { Title, Text } = Typography;

const Majors = () => {
  // --- STATE CHUNG ---
  const [majors, setMajors] = useState([]); // Master Data (Tất cả ngành hệ thống)
  const [curriculums, setCurriculums] = useState([]); // Danh sách đề cương
  const [loading, setLoading] = useState(false);

  // Lấy thông tin user & token
  const userRaw = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isAdmin = user?.role?.name === 'admin';

  // --- STATE TAB 1: QUẢN LÝ MASTER DATA ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [form] = Form.useForm();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importForm] = Form.useForm();

  // --- STATE TAB 2: PHÂN NGÀNH (ASSIGNMENT) ---
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
  const [assignedMajors, setAssignedMajors] = useState([]); // Các ngành đã gán
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false); // Modal gán ngành
  const [assignForm] = Form.useForm();

  useEffect(() => {
    fetchMajors();
    fetchCurriculums();
  }, []);

  // Khi chọn đề cương ở Tab 2, tự động tải danh sách ngành đã gán
  useEffect(() => {
    if (selectedCurriculumId) {
      fetchAssignedMajors(selectedCurriculumId);
    } else {
      setAssignedMajors([]);
    }
  }, [selectedCurriculumId]);

  // --- API CALLS ---
  const fetchMajors = async () => {
    setLoading(true);
    try {
      const res = await majorsApi.getAll(token);
      // ✅ SẮP XẾP A-Z NGAY KHI TẢI VỀ
      const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name));
      setMajors(sorted);
    } catch (error) {
      message.error("Lỗi tải danh sách ngành hệ thống!");
    }
    setLoading(false);
  };

  const fetchCurriculums = async () => {
    try {
      const res = await api.get("/curriculums", { headers: { Authorization: `Bearer ${token}` } });
      // ✅ SẮP XẾP ĐỀ CƯƠNG THEO NĂM GIẢM DẦN, TÊN A-Z
      const sorted = res.data.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
      setCurriculums(sorted);
    } catch (error) {
      console.error("Lỗi tải danh sách đề cương:", error);
    }
  };

  const fetchAssignedMajors = async (curriculumId) => {
    try {
      // ✅ Dùng hàm đã import đúng
      const data = await getCurriculumMajors(curriculumId, token);
      // Sắp xếp A-Z
      setAssignedMajors(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      message.error("Lỗi tải danh sách ngành của đề cương!");
    }
  };

  // --- LOGIC TAB 1: MASTER DATA ---
  const handleFinish = async (values) => {
    try {
      const payload = {
        code: values.code.trim(),
        name: values.name.trim(),
      };
      if (selectedMajor) {
        await majorsApi.update(selectedMajor.id, payload, token);
        message.success("Cập nhật thành công!");
      } else {
        await majorsApi.create(payload, token);
        message.success("Tạo mới thành công!");
      }
      setIsModalOpen(false);
      setSelectedMajor(null);
      form.resetFields();
      fetchMajors();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi lưu dữ liệu!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await majorsApi.delete(id, token);
      message.success("Đã xóa ngành khỏi hệ thống!");
      fetchMajors();
    } catch (error) {
      message.error("Lỗi xóa ngành!");
    }
  };

  const handleImport = async (values) => {
    const { file, major_id, curriculum_id } = values;
    try {
      const response = await majorsApi.import(file.file, major_id, curriculum_id, token);
      message.success(`Import thành công! Môn tạo: ${response.data.result.courses.created}`);
      setIsImportModalOpen(false);
      importForm.resetFields();
    } catch (error) {
      message.error("Lỗi import!");
    }
  };

  // --- LOGIC TAB 2: GÁN NGÀNH ---
  // Lọc ra các ngành chưa được gán để hiển thị trong dropdown
  const availableMajorsForAssign = useMemo(() => {
    if (!selectedCurriculumId) return [];
    const assignedIds = assignedMajors.map(m => m.id);
    return majors.filter(m => !assignedIds.includes(m.id));
  }, [majors, assignedMajors, selectedCurriculumId]);

  const handleAssignSubmit = async (values) => {
    try {
      await addMajorToCurriculum({
        curriculumId: selectedCurriculumId,
        majorId: values.major_id
      }, token);
      message.success("Đã gán ngành vào đề cương!");
      setIsAssignModalOpen(false);
      assignForm.resetFields();
      fetchAssignedMajors(selectedCurriculumId);
    } catch (error) {
      message.error("Lỗi khi gán ngành!");
    }
  };

  const handleUnassign = async (majorId) => {
    try {
      await removeMajorFromCurriculum(selectedCurriculumId, majorId, token);
      message.success("Đã gỡ ngành khỏi đề cương!");
      fetchAssignedMajors(selectedCurriculumId);
    } catch (error) {
      message.error("Lỗi khi gỡ ngành!");
    }
  };

  // --- CẤU HÌNH CỘT TAB 1 (MASTER) ---
  const masterColumns = [
    { title: "STT", key: "index", render: (_, __, i) => i + 1, width: 60, align: "center" },
    { 
        title: "Mã Ngành", dataIndex: "code", key: "code", width: 120, 
        render: (t) => <Tag color="blue">{t?.toUpperCase()}</Tag>,
        sorter: (a, b) => a.code.localeCompare(b.code) 
    },
    { 
        title: "Tên Ngành", dataIndex: "name", key: "name", 
        render: (t) => <b>{t}</b>,
        sorter: (a, b) => a.name.localeCompare(b.name) // ✅ Sắp xếp A-Z
    },
    {
      title: "Hành động", key: "action", width: 120, align: "center",
      render: (r) => (
        <Space>
           <Button icon={<EditOutlined />} onClick={() => { setSelectedMajor(r); form.setFieldsValue(r); setIsModalOpen(true); }} disabled={!isAdmin} />
           <Popconfirm title="Xóa vĩnh viễn?" onConfirm={() => handleDelete(r.id)} disabled={!isAdmin}>
             <Button danger icon={<DeleteOutlined />} disabled={!isAdmin} />
           </Popconfirm>
        </Space>
      )
    }
  ];

  // --- CẤU HÌNH CỘT TAB 2 (ASSIGNED) ---
  const assignedColumns = [
    { title: "STT", key: "index", render: (_, __, i) => i + 1, width: 60, align: "center" },
    { 
        title: "Mã Ngành", dataIndex: "code", key: "code", width: 150,
        render: (t) => <Tag color="green">{t}</Tag>,
        sorter: (a, b) => a.code.localeCompare(b.code)
    },
    { 
        title: "Tên Ngành", dataIndex: "name", key: "name",
        render: (t) => <Text strong>{t}</Text>,
        sorter: (a, b) => a.name.localeCompare(b.name) // ✅ Sắp xếp A-Z
    },
    {
      title: "Hành động", key: "action", width: 100, align: "center",
      render: (r) => (
        <Tooltip title="Gỡ ngành này khỏi đề cương (Không xóa khỏi hệ thống)">
            <Popconfirm title="Gỡ ngành này?" onConfirm={() => handleUnassign(r.id)} disabled={!isAdmin}>
                <Button danger icon={<DeleteOutlined />} disabled={!isAdmin} />
            </Popconfirm>
        </Tooltip>
      )
    }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Card bordered={false} className="shadow-md">
        <div style={{ marginBottom: 16 }}>
          <Title level={2} style={{ margin: 0 }}>Quản lý Ngành Học</Title>
          <Text type="secondary">Quản lý danh mục chung & Phân ngành cho từng Đề cương</Text>
        </div>

        <Tabs defaultActiveKey="1" type="card">
          
          {/* === TAB 1: DANH MỤC MASTER === */}
          <Tabs.TabPane tab={<span><ApartmentOutlined /> Danh mục Ngành (Master)</span>} key="1">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
              <Button icon={<ReloadOutlined />} onClick={fetchMajors}>Làm mới</Button>
              <Button icon={<UploadOutlined />} onClick={() => setIsImportModalOpen(true)}>Import Excel</Button>
              {isAdmin && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedMajor(null); form.resetFields(); setIsModalOpen(true); }} style={{ background: "#1677ff" }}>
                  Thêm Ngành Mới
                </Button>
              )}
            </div>
            <Table columns={masterColumns} dataSource={majors} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} bordered />
          </Tabs.TabPane>

          {/* === TAB 2: PHÂN NGÀNH VÀO ĐỀ CƯƠNG === */}
          <Tabs.TabPane tab={<span><ArrowRightOutlined /> Phân Ngành vào Đề cương</span>} key="2">
            
            {/* 1. Chọn Đề cương */}
            <div style={{ background: '#f0f2f5', padding: 16, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Text strong style={{ fontSize: 16 }}>Chọn Đề Cương:</Text>
                    <Select 
                        style={{ width: 400 }} 
                        placeholder="Tìm chọn đề cương..."
                        value={selectedCurriculumId}
                        onChange={setSelectedCurriculumId}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                    >
                        {curriculums.map(c => (
                            <Option key={c.id} value={c.id} disabled={c.status === 'Đã khóa'}>
                                {c.name} (Năm {c.year}) {c.status === 'Đã khóa' && '🔒'}
                            </Option>
                        ))}
                    </Select>
                </div>
            </div>

            {selectedCurriculumId ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Title level={4} style={{ margin: 0 }}>
                            Danh sách ngành đã gán ({assignedMajors.length})
                        </Title>
                        {isAdmin && (
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={() => setIsAssignModalOpen(true)}
                                style={{ background: "#1677ff" }}
                            >
                                Gán thêm ngành
                            </Button>
                        )}
                    </div>
                    
                    {/* Bảng danh sách ngành đã gán */}
                    <Table 
                        columns={assignedColumns} 
                        dataSource={assignedMajors} 
                        rowKey="id" 
                        bordered 
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: "Đề cương này chưa có ngành nào. Hãy gán thêm!" }}
                    />
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                    <LinkOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <p>Vui lòng chọn một Đề cương ở trên để xem và chỉnh sửa danh sách ngành.</p>
                </div>
            )}
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Modal Thêm/Sửa Master */}
      <Modal
        title={selectedMajor ? "Cập nhật Ngành (Master)" : "Thêm Ngành Mới (Master)"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="code" label="Mã ngành" rules={[{ required: true }]} normalize={v => (v||'').toUpperCase()}>
            <Input disabled={!!selectedMajor} />
          </Form.Item>
          <Form.Item name="name" label="Tên ngành" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block style={{ background: "#1677ff" }}>Lưu</Button>
        </Form>
      </Modal>

      {/* Modal Gán Ngành (Tab 2) */}
      <Modal
        title="Gán Ngành vào Đề Cương"
        open={isAssignModalOpen}
        onCancel={() => setIsAssignModalOpen(false)}
        footer={null}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit}>
            <Form.Item 
                name="major_id" 
                label="Chọn ngành từ danh mục Master" 
                rules={[{ required: true, message: "Vui lòng chọn ngành!" }]}
            >
                <Select 
                    placeholder="Tìm kiếm ngành..." 
                    showSearch 
                    optionFilterProp="children"
                    filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                >
                    {availableMajorsForAssign.map(m => (
                        <Option key={m.id} value={m.id}>{m.name} ({m.code})</Option>
                    ))}
                </Select>
            </Form.Item>
            <div style={{ marginBottom: 16, color: '#888', fontSize: 12 }}>
                * Chỉ hiển thị những ngành chưa được gán vào đề cương này.
            </div>
            <Button type="primary" htmlType="submit" block style={{ background: "#1677ff" }}>Gán ngay</Button>
        </Form>
      </Modal>

      {/* Modal Import */}
      <Modal title="Import Excel" open={isImportModalOpen} onCancel={() => setIsImportModalOpen(false)} footer={null}>
        <Form form={importForm} layout="vertical" onFinish={handleImport}>
          <Form.Item name="file" label="File Excel" rules={[{ required: true }]} valuePropName="file">
            <Upload maxCount={1} beforeUpload={() => false}><Button icon={<UploadOutlined />}>Chọn file</Button></Upload>
          </Form.Item>
          <Form.Item name="curriculum_id" label="Vào Đề cương" rules={[{ required: true }]}>
            <Select placeholder="Chọn đề cương...">
               {curriculums.map(c => <Option key={c.id} value={c.id} disabled={c.status==='Đã khóa'}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="major_id" label="Vào Ngành" rules={[{ required: true }]}>
            <Select placeholder="Chọn ngành..." showSearch optionFilterProp="children">
                {majors.map(m => <Option key={m.id} value={m.id}>{m.name} ({m.code})</Option>)}
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block style={{ background: "#1677ff" }}>Import</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default Majors;