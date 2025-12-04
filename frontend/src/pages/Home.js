// frontend/src/pages/Home.js

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  AutoComplete,
  Select,
  Table,
  Typography,
  Space,
  Tag,
  Modal,
  Row,
  Col,
  Descriptions,
} from "antd";
import { FileSearchOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { fetchMyCurriculums } from "../api/userApi";

const { Title } = Typography;
const { Option } = Select;

const Home = () => {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const isStudent = user && user.role && user.role.name === "Student";

  const [materials, setMaterials] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFunction, setFilterFunction] = useState("");
  const [filterMajor, setFilterMajor] = useState(null);
  const [filterCourse, setFilterCourse] = useState(null);

  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const navigate = useNavigate();

  // === Tải Đề cương ===
  useEffect(() => {
    const loadCurriculums = async () => {
      let data = [];
      try {
        if (isStudent && token) {
          data = await fetchMyCurriculums(token);
        } else {
          const res = await api.get("/curriculums");
          data = res.data.filter((cur) => cur.status !== "Đã khóa");
        }
        setCurriculums(data);
        if (Array.isArray(data) && data.length > 0) {
          const latest = data.find((d) => d.created_at)
            ? [...data].sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
              )[0]
            : [...data].sort((a, b) => b.id - a.id)[0];
          setSelectedCurriculum(latest.id);
        } else {
          setSelectedCurriculum(null);
        }
      } catch (err) {
        console.error("Lỗi khi tải đề cương:", err);
        setCurriculums([]);
        setSelectedCurriculum(null);
      }
    };
    loadCurriculums();
  }, [isStudent, token]);

  // === Tải Tài liệu ===
  const fetchMaterials = async (curriculumId) => {
    setLoadingMaterials(true);
    setMaterials([]);
    try {
      const config =
        isStudent && token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};
      const res = await api.get(
        `/materials?curriculum_id=${curriculumId}`,
        config
      );
      setMaterials(res.data);
    } catch (err) {
      console.error("Lỗi tải tài liệu:", err);
    }
    setLoadingMaterials(false);
  };

  // === Hàm xử lý đổi Đề cương ===
  const handleCurriculumChange = (id) => {
    setSelectedCurriculum(id);
  };

  useEffect(() => {
    if (selectedCurriculum) {
      fetchMaterials(selectedCurriculum);
      setSearch("");
      setFilterType(null);
      setFilterFunction(null);
      setFilterMajor(null);
      setFilterCourse(null);
    } else {
      setMaterials([]);
    }
  }, [selectedCurriculum]);

  // === Xử lý reset filter ===
  useEffect(() => {
    setFilterMajor(null);
    setFilterCourse(null);
  }, [materials]);

  useEffect(() => {
    setFilterCourse(null);
  }, [filterMajor]);

  // === Tối ưu hiệu năng: Memoize các bộ lọc ===
  const uniqueMajors = useMemo(() => {
    const allMajors = materials.flatMap((m) => m.course?.majors || []);
    const unique = [...new Set(allMajors.map((m) => m.name))];
    return unique.sort();
  }, [materials]);

  const uniqueCourses = useMemo(() => {
    const courseList = materials
      .filter((m) => {
        if (!filterMajor) return true;
        return m.course?.majors?.some((major) => major.name === filterMajor);
      })
      .map((m) => {
        const c = m.course;
        return c ? `${c.code || ""} - ${c.name}` : null;
      })
      .filter(Boolean);
    return [...new Set(courseList)].sort();
  }, [materials, filterMajor]);

  // === Logic Filter chính ===
  const filtered = materials.filter((mat) => {
    const matchSearch = mat.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType
      ? mat.type?.toLowerCase().includes(filterType.toLowerCase())
      : true;
    const matchFunction = filterFunction
      ? mat.function === filterFunction
      : true;
    const matchMajor = filterMajor
      ? mat.course?.majors?.some((m) => m.name === filterMajor)
      : true;
    const matchCourse = filterCourse
      ? `${mat.course?.code || ""} - ${mat.course?.name}` === filterCourse
      : true;

    return (
      matchSearch && matchType && matchFunction && matchMajor && matchCourse
    );
  });

  // === Cấu hình Cột (Quay về gốc theo yêu cầu) ===
  const columns = [
    {
      title: "Tên tài liệu",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <a
          onClick={() => setSelectedMaterial(record)}
          style={{ color: "#1677ff" }}
        >
          {text?.replace(/\u00A0/g, " ").trim()}
        </a>
      ),
    },
    {
      title: "Tác giả",
      dataIndex: "author",
      key: "author",
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag color="blue">{type || "Không rõ"}</Tag>,
    },
    {
      title: "Chức năng",
      dataIndex: "function",
      key: "function",
      render: (func) => <Tag color="green">{func}</Tag>,
    },
    {
      title: (
        <span
          title="OPAC = Online Public Access Catalog
Hệ thống tra cứu tài liệu trực tuyến của thư viện"
        >
          <InfoCircleOutlined
            style={{ fontSize: 12, marginRight: 4, color: "#1677ff" }}
          />
          OPAC
        </span>
      ),
      dataIndex: "opac_link",
      key: "opac_link",
      width: 130, // Giữ lại width gốc từ file ban đầu của bạn
      render: (link) =>
        link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#1677ff" }}
          >
            Link
          </a>
        ) : (
          <Tag color="red">Không có</Tag>
        ),
    },
    {
      title: "Môn học",
      key: "course",
      render: (_, record) => {
        const course = record.course;
        return course ? `${course.code} - ${course.name}` : "Không rõ";
      },
    },
    {
      title: "Ngành",
      key: "major",
      render: (_, record) => {
        const majors = record.course?.majors || [];
        return majors.length > 0
          ? majors.map((m) => m.name).join(", ")
          : "Không rõ";
      },
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1300, margin: "0 auto" }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: 24 }}>
        {isStudent ? "ĐỀ CƯƠNG VÀ TÀI LIỆU CỦA BẠN" : "TÌM KIẾM TÀI LIỆU"}
      </Title>

      {/* === KHU VỰC BỘ LỌC === */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {/* Chọn Đề cương */}
          <Col span={24}>
            <Select
              placeholder={
                isStudent ? "Chọn đề cương của bạn" : "Chọn đề cương"
              }
              style={{ width: "100%" }}
              value={selectedCurriculum || undefined}
              onChange={handleCurriculumChange}
              notFoundContent={
                isStudent
                  ? "Bạn chưa được gán vào đề cương nào."
                  : "Không có đề cương nào."
              }
            >
              {curriculums.map((cur) => (
                <Option key={cur.id} value={cur.id}>
                  {cur.name} {/* Đã xóa trạng thái */}
                </Option>
              ))}
            </Select>
          </Col>

          {/* Tìm kiếm theo tên */}
          <Col span={24}>
            <AutoComplete
              options={
                search.length >= 2
                  ? materials
                      .map((m) => ({ value: m.title }))
                      .filter((item) =>
                        item.value.toLowerCase().includes(search.toLowerCase())
                      )
                  : []
              }
              style={{ width: "100%" }}
              placeholder="Nhập tên tài liệu cần tìm..."
              value={search}
              onChange={(value) => setSearch(value)}
              onSelect={(value) => setSearch(value)}
              allowClear
            />
          </Col>

          {/* Lọc theo Loại */}
          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder="Lọc theo loại tài liệu"
              style={{ width: "100%" }}
              value={filterType || undefined}
              onChange={(val) => setFilterType(val)}
              allowClear
            >
              <Option value="Sách giấy">Sách giấy</Option>
              <Option value="Sách điện tử">Sách điện tử</Option>
              <Option value="Website">Website</Option>
              <Option value="Tạp chí">Tạp chí</Option>
            </Select>
          </Col>

          {/* Lọc theo Chức năng */}
          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder="Lọc theo chức năng"
              style={{ width: "100%" }}
              value={filterFunction || undefined}
              onChange={(val) => setFilterFunction(val)}
              allowClear
            >
              <Option value="Giáo trình">Giáo trình</Option>
              <Option value="Tham khảo bắt buộc">Tham khảo bắt buộc</Option>
              <Option value="Tham khảo tự chọn">Tham khảo tự chọn</Option>
            </Select>
          </Col>

          {/* Lọc theo Ngành */}
          <Col xs={24} sm={12} lg={6}>
            <Select
              showSearch
              placeholder="Lọc theo ngành"
              style={{ width: "100%" }}
              value={filterMajor}
              onChange={(value) => setFilterMajor(value)}
              options={uniqueMajors.map((major) => ({
                value: major,
                label: major,
              }))}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              allowClear
            />
          </Col>

          {/* Lọc theo Môn học */}
          <Col xs={24} sm={12} lg={6}>
            <Select
              showSearch
              placeholder="Lọc theo môn học"
              style={{ width: "100%" }}
              value={filterCourse}
              onChange={(value) => setFilterCourse(value)}
              options={uniqueCourses.map((course) => ({
                value: course,
                label: course,
              }))}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              allowClear
              disabled={!uniqueCourses.length}
            />
          </Col>
        </Row>
      </Card>

      {/* === BẢNG KẾT QUẢ === */}
      <Card title={<span><FileSearchOutlined /> Kết quả tìm kiếm</span>}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loadingMaterials}
          // Đã xóa 'scroll'
        />
      </Card>

      {/* === MODAL CHI TIẾT === */}
      <Modal
        open={!!selectedMaterial}
        onCancel={() => setSelectedMaterial(null)}
        footer={null}
        title={
          <>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            Chi tiết tài liệu
          </>
        }
      >
        {selectedMaterial && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Tên">
              {selectedMaterial.title}
            </Descriptions.Item>
            <Descriptions.Item label="Tác giả">
              {selectedMaterial.author}
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              {selectedMaterial.type}
            </Descriptions.Item>
            <Descriptions.Item label="Chức năng">
              {selectedMaterial.function}
            </Descriptions.Item>
            <Descriptions.Item label="NXB">
              {selectedMaterial.publisher}
            </Descriptions.Item>
            <Descriptions.Item label="Năm">
              {selectedMaterial.year}
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng">
              {selectedMaterial.quantity}
            </Descriptions.Item>
            <Descriptions.Item label="ĐKCB">
              {selectedMaterial.dkcb_code}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">
              {selectedMaterial.notes}
            </Descriptions.Item>
            <Descriptions.Item label="OPAC">
              {selectedMaterial.opac_link ? (
                <a
                  href={selectedMaterial.opac_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#1890ff", cursor: "pointer" }}
                >
                  Truy cập
                </a>
              ) : (
                "Không có"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tài liệu số / Ebook">
              {selectedMaterial.file_url ? (
                <a
                  onClick={() => {
                    Modal.confirm({
                      title: "CẢNH BÁO PHÁP LÝ / LEGAL WARNING",
                      width: 600,
                      // ✨ YÊU CẦU 2: Đã cập nhật nội dung đầy đủ
                      content: (
                        <div>
                          <p>
                            Việc truy cập và sử dụng tài liệu số phải tuyệt đối
                            tuân thủ các quy định của pháp luật Việt Nam về quyền
                            tác giả và sở hữu trí tuệ, đặc biệt theo Luật Sở hữu
                            trí tuệ năm 2005 (được sửa đổi, bổ sung năm 2009,
                            2019 và 2022) và Nghị định số 17/2023/NĐ-CP. Mọi hành
                            vi sao chép, phát tán, chỉnh sửa, sử dụng trái phép
                            tài liệu – dù một phần hay toàn bộ – đều bị nghiêm
                            cấm và có thể dẫn đến chế tài xử phạt hành chính,
                            bồi thường dân sự hoặc truy cứu trách nhiệm hình sự
                            theo quy định pháp luật.
                          </p>
                          <p style={{ fontStyle: "italic" }}>
                            Accessing and using digital materials must strictly
                            comply with Vietnamese laws on copyright and
                            intellectual property, including the amended
                            Intellectual Property Law (2005, 2009, 2019, 2022)
                            and Decree No. 17/2023/NĐ-CP. Any unauthorized
                            reproduction, distribution, modification, or use – in
                            whole or in part – is strictly prohibited and may
                            result in administrative penalties, civil liabilities,
                            or criminal prosecution under applicable laws.
                          </p>
                          <div
                            style={{
                              marginTop: 16,
                              padding: "12px 16px",
                              backgroundColor: "#f6ffed",
                              border: "1px solid #b7eb8f",
                              borderLeft: "4px solid #52c41a",
                              borderRadius: 6,
                              fontStyle: "italic",
                              color: "#333",
                            }}
                          >
                            ✔️ Tôi đã đọc và đồng ý tuân thủ các quy định trên /
                            I have read and agree to comply with the above
                            regulations.
                          </div>
                        </div>
                      ),
                      okText: "Tôi đồng ý",
                      // ✨ YÊU CẦU 1: Đã ép style cho nút
                      okButtonProps: {
                        type: "primary",
                        ghost: false,
                        style: {
                          background: "#1677ff",
                          color: "#ffffff",
                          border: "none",
                        },
                      },
                      cancelText: "Hủy",
                      onOk: () => {
                        // Mở tab mới
                        const url = `/materials/${selectedMaterial.id}/view`;
                        window.open(url, "_blank", "noopener,noreferrer");
                        setSelectedMaterial(null);
                      },
                    });
                  }}
                  style={{ color: "#1890ff", cursor: "pointer" }}
                >
                  Truy cập
                </a>
              ) : (
                "Không có"
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Home;