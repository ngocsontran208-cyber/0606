import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Table, message, Spin, Alert, Typography } from "antd";
import materialsApi from "../api/MaterialsApi";
import courseApi from "../api/courseApi";

const { Title, Text, Paragraph } = Typography;

const PublicMaterialsViewer = () => {
  const [materials, setMaterials] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [curriculumName, setCurriculumName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  const courseCodeFromUrl = searchParams.get("mahoclieu");

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!courseCodeFromUrl) {
        setError("Không tìm thấy mã học liệu (mahoclieu) trên URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const courseRes = await courseApi.getByCode(courseCodeFromUrl);
        const courseData = courseRes.data;

        if (courseData && courseData.id) {
          const curriculumNameFromData =
            courseData.Curriculum?.name ||
            courseData.curriculumName ||
            "Chưa xác định";

          setCourseName(courseData.name);
          setCourseCode(courseData.code);
          setCurriculumName(curriculumNameFromData);

          const materialsRes = await materialsApi.getByCourseId(courseData.id);
          const sortedMaterials = sortMaterials(
            Array.isArray(materialsRes) ? materialsRes : []
          );
          setMaterials(sortedMaterials);
        } else {
          setError(`Không tìm thấy môn học với mã: ${courseCodeFromUrl}.`);
        }
      } catch (err) {
        setError("Lỗi khi tải dữ liệu. Vui lòng thử lại.");
        message.error(err.message || "Lỗi máy chủ");
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [searchParams, courseCodeFromUrl]);

  const sortMaterials = (materialsList) => {
    const typeWeights = {
      "Giáo trình": 1,
      "Tham khảo bắt buộc": 2,
      "Tham khảo tự chọn": 3,
    };
    return [...materialsList].sort((a, b) => {
      const weightA = typeWeights[a.function] || 4;
      const weightB = typeWeights[b.function] || 4;
      return weightA - weightB;
    });
  };

  const columns = [
    { title: "STT", render: (_, __, i) => i + 1, align: "center", width: 50 },
    { title: "Tên Tài Liệu", dataIndex: "title", width: 300 },
    { title: "Tác Giả", dataIndex: "author", width: 200 },
    { title: "Năm XB", dataIndex: "year", width: 100 },
    { title: "NXB", dataIndex: "publisher", width: 200 },
    { title: "Loại", dataIndex: "type", width: 150 },
    { title: "Chức năng", dataIndex: "function", width: 180 },
    {
      title: "Link OPAC",
      dataIndex: "opac_link",
      width: 120,
      render: (link) =>
        link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#1677ff" }}
          >
            Xem
          </a>
        ) : (
          "Không có"
        ),
    },
    { title: "Ghi Chú", dataIndex: "notes", width: 200 },
  ];

  if (loading) {
    return <Spin size="large" style={{ display: "block", marginTop: 50 }} />;
  }

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description={error}
        type="error"
        showIcon
        style={{ margin: 20 }}
      />
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: "0 auto" }}>
      {/* --- KHỐI TIÊU ĐỀ --- */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 0 }}>
        {courseCode}: {courseName}
        </Title>
        <Text type="secondary" style={{ fontSize: "1.1rem" }}>
          (Thuộc đề cương: {curriculumName})
        </Text>
      </div>

      {/* --- BẢNG TÀI LIỆU --- */}
      <Table
        dataSource={materials}
        rowKey="id"
        columns={columns}
        pagination={{ pageSize: 10 }}
        bordered
        style={{ marginBottom: 20 }}
      />

     {/* --- DẤU CHÂN TRANG TỐI GIẢN --- */}
<div
  style={{
    textAlign: "center",
    marginTop: 40,
    paddingTop: 14,
    borderTop: "1px solid #eaeaea",
    color: "#666",
    fontSize: "0.9rem",
    lineHeight: 1.6,
  }}
>
  <Paragraph style={{ marginBottom: 4, color: "#595959" }}>
    <Text strong>Phân hệ Quản lý Tài nguyên Khóa học</Text> – Thư viện Cơ sở II
  </Paragraph>

  <Paragraph style={{ marginBottom: 6 }}>
    Chi tiết tại:{" "}
    <a
      href="http://thuvien.cs2.ftu.edu.vn:3000/"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "#1677ff",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
      onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
    >
      thuvien.cs2.ftu.edu.vn:3000
    </a>
  </Paragraph>

  <Paragraph
    style={{
      fontSize: "0.8rem",
      color: "#999",
      marginBottom: 0,
    }}
  >
    © {new Date().getFullYear()} Trường Đại học Ngoại thương - Cơ sở II
  </Paragraph>
</div>
{/* --- KẾT THÚC DẤU CHÂN TRANG --- */}
    </div>
  );
};

export default PublicMaterialsViewer;
