import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  Button,
  Card,
  message,
  Select,
  Modal,
  Form,
  Space,
  Skeleton,
  ConfigProvider,
  Tooltip,
  Row,
  Col,
  AutoComplete,
  Empty,
  Input,
} from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  fetchSummaryReport,
  fetchCoverageReport,
  fetchMissingMaterials,
  exportReport,
  fetchCoverageByMajor,
} from "../api/reportApi";
import { fetchCurriculums } from "../api/curriculumApi";
import majorsApi from "../api/majorsApi";
import MaterialForm from "../components/MaterialForm";
// ✨ SỬA LỖI: Viết hoa 'MaterialsApi'
import materialsApi from "../api/MaterialsApi"; 
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";

const { Option } = Select;

const Reports = () => {
  const [summary, setSummary] = useState({});
  const [coverage, setCoverage] = useState({});
  const [missingMaterials, setMissingMaterials] = useState([]);
  const [filteredMissingMaterials, setFilteredMissingMaterials] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [majors, setMajors] = useState([]);
  const [form] = Form.useForm();
  const [coverageByMajor, setCoverageByMajor] = useState([]);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [searchOptions, setSearchOptions] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingCoverage, setLoadingCoverage] = useState(false);
  const [loadingMissingMaterials, setLoadingMissingMaterials] = useState(false);
  const [loadingCoverageByMajor, setLoadingCoverageByMajor] = useState(false);
  const [isSilentUpdate, setIsSilentUpdate] = useState(false);

  // (Toàn bộ logic useEffect và các hàm fetch... của bạn giữ nguyên)
  // ...
  // ... (Giữ nguyên từ dòng 60 đến 540) ...
  // ...

  // Fetch curriculums on mount and set default curriculum
  useEffect(() => {
    fetchCurriculums().then((res) => {
      const curriculumList = res || [];
      setCurriculums(curriculumList);
      if (curriculumList.length > 0) {
        const minIdCurriculum = curriculumList.reduce((min, curr) =>
          curr.id < min.id ? curr : min
        );
        setSelectedCurriculum(minIdCurriculum.id);
      }
    });
  }, []);

  // Fetch majors when export modal opens or curriculum changes
  useEffect(() => {
    if (selectedCurriculum) {
      majorsApi.getByCurriculum(selectedCurriculum).then((res) => setMajors(res.data || []));
    }
  }, [selectedCurriculum]);

  // Load reports when curriculum changes
  useEffect(() => {
    if (selectedCurriculum) {
      loadReports(selectedCurriculum);
    }
  }, [selectedCurriculum]);

  // Update filtered missing materials and search options when missingMaterials changes
  useEffect(() => {
    setFilteredMissingMaterials(missingMaterials);
    setSearchOptions(
      missingMaterials.map((item) => ({
        value: item.title || "",
        label: item.title || "Không xác định",
      }))
    );
  }, [missingMaterials]);

  // Hàm tải từng loại báo cáo riêng biệt
  const loadSummaryReport = useCallback(async (curriculumId) => {
    try {
      setLoadingSummary(true);
      const summaryData = await fetchSummaryReport(curriculumId);
      setSummary(summaryData.data || {});
    } catch (error) {
      message.error("Không thể tải báo cáo tóm tắt!");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadCoverageReport = useCallback(async (curriculumId) => {
    try {
      setLoadingCoverage(true);
      const coverageData = await fetchCoverageReport(curriculumId);
      setCoverage(coverageData.data || {});
    } catch (error) {
      message.error("Không thể tải báo cáo độ phủ!");
    } finally {
      setLoadingCoverage(false);
    }
  }, []);

  const loadMissingMaterialsReport = useCallback(async (curriculumId, silent = false) => {
    try {
      if (!silent) setLoadingMissingMaterials(true);
      const missingData = await fetchMissingMaterials(curriculumId);
      setMissingMaterials(missingData.data.data || []);
    } catch (error) {
      message.error("Không thể tải danh sách tài liệu thiếu!");
    } finally {
      if (!silent) setLoadingMissingMaterials(false);
    }
  }, []);

  const loadCoverageByMajorReport = useCallback(async (curriculumId, silent = false) => {
    try {
      if (!silent) setLoadingCoverageByMajor(true);
      const coverageByMajorData = await fetchCoverageByMajor(curriculumId);
      setCoverageByMajor(coverageByMajorData.data || []);
    } catch (error) {
      message.error("Không thể tải báo cáo độ phủ theo ngành!");
    } finally {
      if (!silent) setLoadingCoverageByMajor(false);
    }
  }, []);

  // Load all reports
  const loadReports = useCallback(
    async (curriculumId) => {
      await Promise.all([
        loadSummaryReport(curriculumId),
        loadCoverageReport(curriculumId),
        loadMissingMaterialsReport(curriculumId),
        loadCoverageByMajorReport(curriculumId),
      ]);
    },
    [loadSummaryReport, loadCoverageReport, loadMissingMaterialsReport, loadCoverageByMajorReport]
  );

  // Handle export report
  const handleExport = async (values) => {
    try {
      const res = await exportReport(values);
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `baocao-${values.type}.${values.format === "excel" ? "xlsx" : "pdf"}`;
      link.click();
      setExportModalOpen(false);
      message.success("Xuất báo cáo thành công!");
    } catch (error) {
      message.error("Xuất báo cáo thất bại!");
    }
  };

  // Open edit modal
  const openEditModal = async (material) => {
    try {
      const fullData = await materialsApi.getById(material.id);
      if (!fullData) {
        message.error("Không thể tải dữ liệu chi tiết của tài liệu.");
        return;
      }
      setEditingMaterial(fullData);
      setEditModalOpen(true);
    } catch (error) {
      message.error("Đã xảy ra lỗi khi lấy dữ liệu tài liệu.");
    }
  };

  // Handle search missing materials
  const handleSearchMissingMaterials = (value) => {
    if (!value) {
      setFilteredMissingMaterials(missingMaterials);
      setSearchOptions(
        missingMaterials.map((item) => ({
          value: item.title || "",
          label: item.title || "Không xác định",
        }))
      );
      return;
    }

    const filtered = missingMaterials.filter((item) =>
      item.title.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredMissingMaterials(filtered);
    setSearchOptions(
      filtered.map((item) => ({
        value: item.title || "",
        label: item.title || "Không xác định",
      }))
    );
  };

  // Update only relevant data after editing material
  const updateRelevantData = useCallback(
    async (curriculumId) => {
      setIsSilentUpdate(true);
      try {
        await Promise.all([
          loadMissingMaterialsReport(curriculumId, true),
          loadCoverageByMajorReport(curriculumId, true),
        ]);
      } catch (error) {
        message.error("Không thể cập nhật dữ liệu sau khi chỉnh sửa tài liệu!");
      } finally {
        setIsSilentUpdate(false);
      }
    },
    [loadMissingMaterialsReport, loadCoverageByMajorReport]
  );

  // Table columns for missing materials
  const columns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", key: "id" },
      { title: "Tên tài liệu", dataIndex: "title", key: "title" },
      { title: "Tác giả", dataIndex: "author", key: "author" },
      {
        title: "Môn học",
        key: "course",
        render: (_, record) => {
          const course = record.Course;
          const code = course?.code?.toUpperCase() || "";
          const name = course?.name || "";
          return course ? `${code} - ${name}` : "Không xác định";
        },
      },
      {
        title: "Hành động",
        key: "action",
        render: (_, record) => (
          <Button type="link" onClick={() => openEditModal(record)}>
            Sửa
          </Button>
        ),
      },
    ],
    []
  );

  // Map major_id to major code and name, sort by major_name
  const enrichedCoverageByMajor = useMemo(() => {
    const enriched = coverageByMajor
      .map((item) => {
        const major = majors.find((m) => m.id === item.major_id);
        if (!major) {
          return null;
        }
        return {
          ...item,
          major_code: (major.code || major.name).toUpperCase(), // In hoa mã ngành
          major_name: major.name,
          coverage_percentage: typeof item.coverage_percentage === "string"
            ? parseFloat(item.coverage_percentage.replace("%", "")) || 0
            : item.coverage_percentage || 0,
          total_materials: item.total_materials || 0,
          unique_materials: item.unique_materials || 0,
        };
      })
      .filter((item) => item !== null);

    enriched.sort((a, b) => a.major_name.localeCompare(b.major_name));
    return enriched;
  }, [coverageByMajor, majors]);

  // Chart data with memoization, sử dụng major_code
  const chartData = useMemo(() => {
    return enrichedCoverageByMajor.map((item) => ({
      major_code: item.major_code,
      coverage_percentage: item.coverage_percentage,
      total_materials: item.total_materials,
      unique_materials: item.unique_materials,
    }));
  }, [enrichedCoverageByMajor]);

  // Chart component for coverage by major
const CoverageChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <Empty description="Không có dữ liệu để hiển thị biểu đồ" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="major_code"
          tick={{ fontSize: 12, fontWeight: "bold" }} // In đậm mã ngành
        />
        <YAxis tickFormatter={(value) => `${value}%`} />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #d9d9d9",
            borderRadius: 4,
            padding: "8px",
          }}
          formatter={(value, name, props) => [
            `${value}%`,
            `Tổng tài liệu: ${props.payload.total_materials}`,
            `Tài liệu có trong thư viện: ${props.payload.unique_materials}`,
          ]}
          labelFormatter={() => "% Độ phủ"}
          cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
        />
        <Legend formatter={() => "% Độ phủ"} />
        <Bar
          dataKey="coverage_percentage"
          fill="#0052cc"
          activeFill="#40c4ff"
          barSize={50}
          stroke="#003087"
          strokeWidth={1}
        >
          <LabelList
            dataKey="coverage_percentage"
            position="top"
            formatter={(value) => `${value}%`}
            style={{ fontSize: 12, fill: "#333" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
          fontFamily: "Inter, sans-serif",
        },
      }}
    >
      <div style={{ padding: 24, maxWidth: 1300, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
          Báo cáo
        </h1>

        <Space style={{ marginBottom: 16, flexWrap: "wrap" }}>
          <Tooltip title="Chọn đề cương để xem báo cáo">
            <Select
              placeholder="Chọn đề cương"
              style={{ width: 300 }}
              value={selectedCurriculum}
              onChange={setSelectedCurriculum}
              loading={loadingSummary || loadingCoverage || loadingMissingMaterials || loadingCoverageByMajor}
            >
              {curriculums.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Tooltip>

          <Tooltip title="Làm mới dữ liệu báo cáo">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadReports(selectedCurriculum)}
              loading={loadingSummary || loadingCoverage || loadingMissingMaterials || loadingCoverageByMajor}
            >
              Làm mới
            </Button>
          </Tooltip>

          <Tooltip title="Xuất báo cáo ra Excel hoặc PDF">
            <Button
              icon={<DownloadOutlined />}
              type="primary"
              onClick={() => {
                setSelectedType("");
                setExportModalOpen(true);
              }}
              disabled={!selectedCurriculum}
              // ✨ SỬA LỖI NÚT BẤM
              style={{
                background: "#1677ff",
                color: "#ffffff",
                border: "none"
              }}
            >
              Xuất báo cáo
            </Button>
          </Tooltip>
        </Space>

        {selectedCurriculum && (
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              {loadingCoverageByMajor && !isSilentUpdate ? (
                <Skeleton active />
              ) : (
                <Card
                  title="Báo cáo độ phủ tài liệu"
                  style={{
                    marginBottom: 16,
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    minHeight: 300,
                  }}
                >
                  <Space style={{ marginBottom: 16 }}>
                    <div>
                      <strong>Tổng tài liệu:</strong>{" "}
                      {enrichedCoverageByMajor.reduce((sum, item) => sum + (item.total_materials || 0), 0)}
                    </div>
                    <div>
                      <strong>Tài liệu có trong thư viện:</strong>{" "}
                      {enrichedCoverageByMajor.reduce((sum, item) => sum + (item.unique_materials || 0), 0)}
                    </div>
                  </Space>
                  <CoverageChart data={chartData} />
                  <Table
                    size="small"
                    pagination={false}
                    dataSource={[
                      ...enrichedCoverageByMajor.map((item, idx) => ({
                        key: idx,
                        stt: idx + 1, // Thêm STT
                        major: item.major_name,
                        total: item.total_materials || 0,
                        hasOPAC: item.unique_materials || 0,
                        percent: item.coverage_percentage || 0,
                      })),
                      {
                        key: "total",
                        stt: "", // Không hiển thị STT cho dòng tổng cộng
                        major: "TỔNG CỘNG",
                        total: enrichedCoverageByMajor.reduce((sum, item) => sum + (item.total_materials || 0), 0) || 0,
                        hasOPAC: enrichedCoverageByMajor.reduce((sum, item) => sum + (item.unique_materials || 0), 0) || 0,
                        percent: enrichedCoverageByMajor.length
                          ? (
                              (enrichedCoverageByMajor.reduce((sum, item) => sum + (item.unique_materials || 0), 0) /
                                enrichedCoverageByMajor.reduce((sum, item) => sum + (item.total_materials || 0), 0)) *
                              100
                            ).toFixed(2) + "%"
                          : "0%",
                      },
                    ]}
                    columns={[
                      {
                        title: "STT",
                        dataIndex: "stt",
                        key: "stt",
                        width: 60,
                        render: (text) => <span style={{ fontWeight: "bold" }}>{text}</span>, // In đậm STT
                      },
                      {
                        title: "Ngành",
                        dataIndex: "major",
                        key: "major",
                        render: (text) => (
                          <span style={{ fontWeight: text === "TỔNG CỘNG" ? "bold" : "normal", color: text === "TỔNG CỘNG" ? "#1677ff" : "inherit" }}>
                            {text}
                          </span>
                        ),
                      },
                      { title: "Tổng tài liệu", dataIndex: "total", key: "total" },
                      { title: "Tài liệu có trong Thư viện", dataIndex: "hasOPAC", key: "hasOPAC" },
                      { title: "% Độ phủ", dataIndex: "percent", key: "percent" },
                    ]}
                  />
                </Card>
              )}
            </Col>

            <Col xs={24}>
              {loadingMissingMaterials && !isSilentUpdate ? (
                <Skeleton active />
              ) : (
                <Card
                  title="Danh sách tài liệu thiếu"
                  style={{
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Space style={{ marginBottom: 16 }}>
                    <AutoComplete
                      options={searchOptions}
                      style={{ width: 300 }}
                      onSearch={handleSearchMissingMaterials}
                      onSelect={handleSearchMissingMaterials}
                      placeholder="Tìm kiếm tên tài liệu"
                      allowClear
                    >
                      <Input suffix={<SearchOutlined />} />
                    </AutoComplete>
                  </Space>
                  <div style={{ marginBottom: 16, fontWeight: "bold" }}>
                    Tổng số tài liệu thiếu: {filteredMissingMaterials.length}
                  </div>
                  <Table
                    dataSource={filteredMissingMaterials}
                    columns={columns}
                    rowKey="id"
                    loading={loadingMissingMaterials && !isSilentUpdate}
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              )}
            </Col>
          </Row>
        )}

        <Modal
          title="📤 Xuất báo cáo"
          open={exportModalOpen}
          onCancel={() => setExportModalOpen(false)}
          onOk={() => form.submit()}
          okText="Xuất"
          // ✨ SỬA LỖI NÚT BẤM
          okButtonProps={{ 
            icon: <DownloadOutlined />,
            style: {
              background: "#1677ff",
              color: "#ffffff",
              border: "none"
            }
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleExport}
            initialValues={{ format: "excel", curriculum_id: selectedCurriculum }}
          >
            <Form.Item
              name="type"
              label="Loại báo cáo"
              rules={[{ required: true, message: "Vui lòng chọn loại báo cáo!" }]}
            >
              <Select placeholder="Chọn loại báo cáo" onChange={setSelectedType}>
                <Option value="coverage-by-major">Báo cáo 1: Độ phủ theo ngành</Option>
                <Option value="missing-by-major">Báo cáo 2: Tài liệu thiếu OPAC</Option>
                <Option value="all-materials">Báo cáo 3: Toàn bộ dữ liệu</Option>
                <Option value="quantity-by-type">Báo cáo 4: Thống kê số lượng</Option>
              </Select>
            </Form.Item>

            {["coverage-by-major", "missing-by-major", "all-materials", "quantity-by-type"].includes(selectedType) && (
              <Form.Item
                name="curriculum_id"
                label="Đề cương"
                rules={[{ required: true, message: "Vui lòng chọn đề cương!" }]}
              >
                <Select
                  placeholder="Chọn đề cương"
                  onChange={(val) => {
                    form.setFieldsValue({ curriculum_id: val });
                    setSelectedCurriculum(val);
                    majorsApi.getByCurriculum(val).then((res) => setMajors(res.data || []));
                  }}
                >
                  {curriculums.map((c) => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {["coverage-by-major", "missing-by-major", "quantity-by-type"].includes(selectedType) && (
              <Form.Item name="major_ids" label="Ngành học (tuỳ chọn)">
                <Select
                  mode="multiple"
                  placeholder="Chọn ngành học"
                  options={majors.map((m) => ({ label: m.name, value: m.id }))}
                />
              </Form.Item>
            )}

            <Form.Item
              name="format"
              label="Định dạng"
              initialValue="excel"
              rules={[{ required: true, message: "Vui lòng chọn định dạng!" }]}
            >
              <Select>
                <Option value="excel">Excel</Option>
                <Option value="pdf">PDF</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Chỉnh sửa tài liệu"
          open={editModalOpen}
          onCancel={() => {
            setEditModalOpen(false);
            updateRelevantData(selectedCurriculum);
          }}
          footer={null}
          destroyOnClose
        >
          {/* ⚠️ Chú ý: Nút "Submit" (Lưu) nằm BÊN TRONG component 'MaterialForm'. 
            Bạn cũng cần sửa lỗi nút bấm đó bằng cách thêm style nội tuyến
            cho nó trong file 'MaterialForm.js' nhé!
          */}
          <MaterialForm
            initialValues={editingMaterial}
            onCancel={() => {
              setEditModalOpen(false);
              updateRelevantData(selectedCurriculum);
            }}
            onSubmit={() => {
              setEditModalOpen(false);
              updateRelevantData(selectedCurriculum);
            }}
          />
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default Reports;