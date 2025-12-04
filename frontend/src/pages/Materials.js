import React, { useState, useEffect } from "react";
import materialsApi from "../api/MaterialsApi";
import courseApi from "../api/courseApi";
import { fetchCurriculums } from "../api/curriculumApi";
import majorsApi from "../api/majorsApi";
import {
  Table,
  Button,
  Modal,
  Input,
  Select,
  message,
  Space,
  Popconfirm,
  Typography,
  Card,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import MaterialForm from "../components/MaterialForm";
import api from "../services/api";

const { Option } = Select;
const { Title } = Typography;

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [majors, setMajors] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);

  const [selectedCurriculum, setSelectedCurriculum] = useState(
    JSON.parse(localStorage.getItem("selectedCurriculum"))?.id || null
  );

  const [selectedMajor, setSelectedMajor] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const navigate = useNavigate();

  const isCurriculumLocked =
    curriculums.find((c) => c.id === selectedCurriculum)?.status === "Đã khóa";

  useEffect(() => {
    fetchAllCurriculums();
  }, []);

  useEffect(() => {
    if (selectedCurriculum) fetchMajors(selectedCurriculum);
    else {
      setMajors([]);
      setCourses([]);
    }
  }, [selectedCurriculum]);

  useEffect(() => {
    if (selectedMajor) fetchCoursesByMajor(selectedMajor);
    else {
      setCourses([]);
      setSelectedCourse(null);
    }
  }, [selectedMajor]);

  useEffect(() => {
    if (selectedCourse) fetchMaterialsByCourse(selectedCourse);
    else {
      setMaterials([]);
      setFilteredMaterials([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    filterMaterials();
  }, [searchQuery, materials]);

  const fetchAllCurriculums = async () => {
    try {
      const res = await fetchCurriculums();
      setCurriculums(Array.isArray(res) ? res : []);
    } catch {
      message.error("Lỗi tải danh sách đề cương!");
    }
  };

  const fetchMajors = async (curriculumId) => {
    try {
      const res = await majorsApi.getByCurriculum(curriculumId);
      setMajors(Array.isArray(res.data) ? res.data : []);
    } catch {
      message.error("Lỗi tải danh sách ngành học!");
    }
  };

  // Thêm tham số selectedCurriculum 
  const fetchCoursesByMajor = async (majorId) => {
    try {
      // Trước đây: const res = await courseApi.getByMajor(majorId);
      // Bây giờ: Truyền thêm selectedCurriculum để lọc đúng môn của đề cương này
      const res = await courseApi.getByMajor(majorId, selectedCurriculum);
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch {
      message.error("Lỗi tải danh sách môn học!");
    }
  };
  //  KẾT THÚC SỬA 

  const fetchMaterialsByCourse = async (courseId) => {
    setLoading(true);
    try {
      const res = await materialsApi.getByCourseId(courseId);
      setMaterials(Array.isArray(res) ? res : []);
      setFilteredMaterials(Array.isArray(res) ? res : []);
    } catch {
      message.error("Lỗi tải danh sách tài liệu!");
    }
    setLoading(false);
  };

  const filterMaterials = () => {
    const keyword = searchQuery.toLowerCase().trim();
    let filtered = materials;

    if (keyword) {
      filtered = materials.filter(
        (m) =>
          (m.title?.toLowerCase().includes(keyword) || false) ||
          (m.author?.toLowerCase().includes(keyword) || false)
      );
    }

    const typeWeights = {
      "Giáo trình": 1,
      "Tham khảo bắt buộc": 2,
      "Tham khảo tự chọn": 3,
    };

    filtered = [...filtered].sort((a, b) => {
      const weightA = typeWeights[a.function] || 4;
      const weightB = typeWeights[b.function] || 4;
      return weightA - weightB;
    });

    setFilteredMaterials(filtered);
  };

  const handleEdit = (record) => {
    if (isCurriculumLocked) {
      message.error("Đề cương đã bị khóa, không thể chỉnh sửa tài liệu!");
      return;
    }
    setEditingMaterial(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (isCurriculumLocked) {
      message.error("Đề cương đã bị khóa, không thể xóa tài liệu!");
      return;
    }
    try {
      await materialsApi.delete(id);
      message.success("Đã xóa tài liệu!");
      fetchMaterialsByCourse(selectedCourse);
    } catch {
      message.error("Không thể xóa tài liệu!");
    }
  };

  const handleCurriculumChange = (curriculumId) => {
    setSelectedCurriculum(curriculumId);

    if (curriculumId) {
      const selected = curriculums.find((c) => c.id === curriculumId);
      if (selected) {
        localStorage.setItem(
          "selectedCurriculum",
          JSON.stringify({ id: selected.id, name: selected.name })
        );
      }
    } else {
      localStorage.removeItem("selectedCurriculum");
    }

    setSelectedMajor(null);
    setSelectedCourse(null);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: "0 auto" }}>
      <Card>
        <Title level={2} style={{ textAlign: "center", marginBottom: 24 }}>
          Quản lý Tài Liệu
        </Title>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12} lg={6}>
            <Select
              placeholder="Chọn đề cương"
              style={{ width: "100%" }}
              value={selectedCurriculum}
              onChange={handleCurriculumChange}
              allowClear
            >
              {curriculums.map((curriculum) => (
                <Option
                  key={curriculum.id}
                  value={curriculum.id}
                  disabled={curriculum.status === "Đã khóa"}
                >
                  {curriculum.name}{" "}
                  {curriculum.status === "Đã khóa" && "(🔒 Đã khóa)"}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={12} lg={5}>
            <Select
              placeholder="Chọn ngành"
              style={{ width: "100%" }}
              value={selectedMajor}
              onChange={(val) => {
                setSelectedMajor(val);
                setSelectedCourse(null);
              }}
              disabled={!selectedCurriculum}
              allowClear
            >
              {majors.map((m) => (
                <Option key={m.id} value={m.id}>
                  {m.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={12} lg={5}>
            <Select
              showSearch
              placeholder="Chọn môn học"
              style={{ width: "100%" }}
              value={selectedCourse}
              onChange={setSelectedCourse}
              disabled={!selectedMajor}
              optionFilterProp="children"
              filterOption={(input, option) =>
                `${option.children}`.toLowerCase().includes(input.toLowerCase()) ||
                `${option.value}`.toLowerCase().includes(input.toLowerCase())
              }
              allowClear
            >
              {courses.map((c) => (
                <Option
                  key={c.id}
                  value={c.id}
                  title={`${c.name} (${c.code || c.id})`}
                >
                  {c.name} ({c.code || c.id})
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={12} lg={5}>
            <Input
              placeholder="Tìm tài liệu, tác giả..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={24} md={24} lg={3} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!selectedCourse || isCurriculumLocked}
              onClick={() => {
                if (isCurriculumLocked) {
                  message.error("Đề cương đã bị khóa, không thể thêm tài liệu!");
                  return;
                }
                setEditingMaterial(null);
                setIsModalOpen(true);
              }}
              style={{
                background: "#1677ff",
                color: "#ffffff",
                border: "none",
                width: "100%"
              }}
            >
              Thêm Tài Liệu
            </Button>
          </Col>
        </Row>

        <Modal
          title={editingMaterial ? "Sửa tài liệu" : "Thêm tài liệu"}
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingMaterial(null);
          }}
          footer={null}
          destroyOnClose
          width={800}
        >
          <MaterialForm
            initialValues={editingMaterial || {}}
            selectedCourse={selectedCourse}
            onSubmit={() => {
              setIsModalOpen(false);
              setEditingMaterial(null);
              fetchMaterialsByCourse(selectedCourse);
            }}
          />
        </Modal>

        <Table
          dataSource={filteredMaterials}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          bordered
          scroll={{ x: 2000 }}
          //  === SỬA LỖI CỘT HÀNH ĐỘNG ===
          columns={[
            {
              title: "STT",
              render: (_, __, i) => i + 1,
              align: "center",
              width: 60,
              fixed: "left", // Cố định STT
            },
            { title: "Tên Tài Liệu", dataIndex: "title", width: 300 },
            { title: "Tác Giả", dataIndex: "author", width: 200 },
            { title: "Năm XB", dataIndex: "year", width: 100, align: "center" },
            { title: "NXB", dataIndex: "publisher", width: 200 },
            { title: "Loại", dataIndex: "type", width: 150 },
            { title: "Chức năng", dataIndex: "function", width: 180 },
            { title: "Mã ĐKCB", dataIndex: "dkcb_code", width: 150 },
            {
              title: "Link OPAC",
              dataIndex: "opac_link",
              width: 150,
              render: (link) =>
                link ? (
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    Xem
                  </a>
                ) : (
                  "Không có"
                ),
            },
            {
              title: "Tài liệu số",
              dataIndex: "file_url",
              width: 120,
              align: "center",
              render: (_, record) => {
                const rawPath = record.file_url?.replace(
                  /^\/?(Uploads|uploads)\/?/,
                  ""
                );
                const fileUrl = rawPath
                  ? `${api.defaults.baseURL.replace(
                      "/api",
                      ""
                    )}/Uploads/${rawPath}`
                  : null;
                return fileUrl ? (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#1677ff" }}
                  >
                    Xem
                  </a>
                ) : (
                  "Không có"
                );
              },
            },
            { title: "Ghi Chú", dataIndex: "notes", width: 200 },
            {
              title: "Hành động",
              width: 100,
              fixed: "right", // Đổi thành "right"
              align: "center",
              render: (_, record) => (
                <Space>
                  <Tooltip title="Sửa">
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                      disabled={isCurriculumLocked}
                    />
                  </Tooltip>
                  <Tooltip title="Xoá">
                    <Popconfirm
                      title="Bạn chắc chắn xoá tài liệu này?"
                      onConfirm={() => handleDelete(record.id)}
                      disabled={isCurriculumLocked}
                    >
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={isCurriculumLocked}
                      />
                    </Popconfirm>
                  </Tooltip>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Materials;