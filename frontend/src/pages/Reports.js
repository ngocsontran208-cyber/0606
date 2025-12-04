import React, { useEffect, useState, useMemo, useCallback, useContext } from "react";
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
  DatePicker,
  Statistic,
} from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  GlobalOutlined
} from "@ant-design/icons";
import {
  fetchSummaryReport,
  fetchCoverageReport,
  fetchMissingMaterials,
  exportReport,
  fetchCoverageByMajor,
  fetchUserAnalytics,
} from "../api/reportApi";
import { fetchCurriculums } from "../api/curriculumApi";
import majorsApi from "../api/majorsApi";
import MaterialForm from "../components/MaterialForm";
import materialsApi from "../api/MaterialsApi";
import { AuthContext } from "../context/AuthContext";
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
  LineChart,
  Line,
} from "recharts";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

const Reports = () => {
  const { token } = useContext(AuthContext);

  // --- States cho Báo cáo Đề cương (Cũ) ---
  const [summary, setSummary] = useState({});
  const [coverage, setCoverage] = useState({});
  const [missingMaterials, setMissingMaterials] = useState([]);
  const [filteredMissingMaterials, setFilteredMissingMaterials] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [majors, setMajors] = useState([]);
  const [coverageByMajor, setCoverageByMajor] = useState([]);
  const [searchOptions, setSearchOptions] = useState([]);
  
  // Loading states
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingCoverage, setLoadingCoverage] = useState(false);
  const [loadingMissingMaterials, setLoadingMissingMaterials] = useState(false);
  const [loadingCoverageByMajor, setLoadingCoverageByMajor] = useState(false);
  const [isSilentUpdate, setIsSilentUpdate] = useState(false);

  // --- States chung ---
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [form] = Form.useForm();
  
  // Edit Material Modal
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // --- States cho Báo cáo Người dùng (Mới) ---
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [loadingUserAnalytics, setLoadingUserAnalytics] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'd'), 
    dayjs()
  ]);

  // ✨ HÀM MỚI: Chặn chọn ngày tương lai
  const disabledDate = (current) => {
    // Không cho phép chọn ngày sau ngày hiện tại
    return current && current > dayjs().endOf('day');
  };

  // 1. Khởi tạo: Tải danh sách đề cương
  useEffect(() => {
    fetchCurriculums().then((res) => {
      const curriculumList = res || [];
      setCurriculums(curriculumList);
      if (curriculumList.length > 0) {
        // Mặc định chọn đề cương mới nhất (ID lớn nhất hoặc theo logic của bạn)
        const latestCurriculum = curriculumList.reduce((prev, curr) => 
            (prev.id > curr.id) ? prev : curr
        );
        setSelectedCurriculum(latestCurriculum.id);
      }
    });
  }, []);

  // 2. Khi chọn đề cương -> Tải danh sách ngành & Báo cáo đề cương
  useEffect(() => {
    if (selectedCurriculum && selectedType !== 'user-analytics') {
      majorsApi.getByCurriculum(selectedCurriculum).then((res) => setMajors(res.data || []));
      loadReports(selectedCurriculum);
    }
  }, [selectedCurriculum]);

  // 3. Khi chọn loại báo cáo User Analytics hoặc đổi ngày -> Tải báo cáo người dùng
  useEffect(() => {
    if (selectedType === 'user-analytics') {
      loadUserReport();
    }
  }, [selectedType, dateRange]);

  // Cập nhật danh sách tìm kiếm cho tài liệu thiếu
  useEffect(() => {
    setFilteredMissingMaterials(missingMaterials);
    setSearchOptions(
      missingMaterials.map((item) => ({
        value: item.title || "",
        label: item.title || "Không xác định",
      }))
    );
  }, [missingMaterials]);

  // --- API Calls cho Báo cáo Đề cương ---
  const loadSummaryReport = useCallback(async (curriculumId) => {
    try { setLoadingSummary(true); const res = await fetchSummaryReport(curriculumId); setSummary(res.data || {}); } 
    catch { message.error("Lỗi tải báo cáo tóm tắt!"); } finally { setLoadingSummary(false); }
  }, []);

  const loadCoverageReport = useCallback(async (curriculumId) => {
    try { setLoadingCoverage(true); const res = await fetchCoverageReport(curriculumId); setCoverage(res.data || {}); } 
    catch { message.error("Lỗi tải báo cáo độ phủ!"); } finally { setLoadingCoverage(false); }
  }, []);

  const loadMissingMaterialsReport = useCallback(async (curriculumId, silent = false) => {
    try { if (!silent) setLoadingMissingMaterials(true); const res = await fetchMissingMaterials(curriculumId); setMissingMaterials(res.data.data || []); } 
    catch { message.error("Lỗi tải danh sách tài liệu thiếu!"); } finally { if (!silent) setLoadingMissingMaterials(false); }
  }, []);

  const loadCoverageByMajorReport = useCallback(async (curriculumId, silent = false) => {
    try { if (!silent) setLoadingCoverageByMajor(true); const res = await fetchCoverageByMajor(curriculumId); setCoverageByMajor(res.data || []); } 
    catch { message.error("Lỗi tải độ phủ theo ngành!"); } finally { if (!silent) setLoadingCoverageByMajor(false); }
  }, []);

  const loadReports = useCallback(async (curriculumId) => {
    await Promise.all([
      loadSummaryReport(curriculumId),
      loadCoverageReport(curriculumId),
      loadMissingMaterialsReport(curriculumId),
      loadCoverageByMajorReport(curriculumId),
    ]);
  }, [loadSummaryReport, loadCoverageReport, loadMissingMaterialsReport, loadCoverageByMajorReport]);

  // --- API Call cho Báo cáo Người dùng ---
  const loadUserReport = async () => {
    setLoadingUserAnalytics(true);
    try {
      const fromDate = dateRange ? dateRange[0].format('YYYY-MM-DD') : null;
      const toDate = dateRange ? dateRange[1].format('YYYY-MM-DD') : null;
      const res = await fetchUserAnalytics(fromDate, toDate);
      setUserAnalytics(res.data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải báo cáo người dùng.");
    } finally {
      setLoadingUserAnalytics(false);
    }
  };

  // --- Xử lý Xuất báo cáo ---
  const handleExport = async (values) => {
    try {
      const payload = { ...values };
      
      // Xử lý ngày tháng cho User Analytics
      if (payload.type === 'user-analytics' && payload.dateRange) {
          payload.fromDate = payload.dateRange[0].format('YYYY-MM-DD');
          payload.toDate = payload.dateRange[1].format('YYYY-MM-DD');
          delete payload.dateRange; 
          delete payload.curriculum_id; 
      }

      const res = await exportReport(payload);
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const dateSuffix = payload.fromDate ? `_${payload.fromDate}_${payload.toDate}` : '';
      link.download = `baocao-${values.type}${dateSuffix}.${values.format === "excel" ? "xlsx" : "pdf"}`;
      
      link.click();
      setExportModalOpen(false);
      message.success("Xuất báo cáo thành công!");
    } catch (error) {
      console.error(error);
      message.error("Xuất báo cáo thất bại!");
    }
  };

  // --- Các hàm tiện ích khác (Search, Edit...) ---
  const openEditModal = async (material) => {
    try {
      const fullData = await materialsApi.getById(material.id);
      if (!fullData) { message.error("Không thể tải dữ liệu tài liệu."); return; }
      setEditingMaterial(fullData);
      setEditModalOpen(true);
    } catch { message.error("Lỗi khi lấy dữ liệu tài liệu."); }
  };

  const handleSearchMissingMaterials = (value) => {
    if (!value) {
      setFilteredMissingMaterials(missingMaterials);
      setSearchOptions(missingMaterials.map((item) => ({ value: item.title || "", label: item.title || "Không xác định" })));
      return;
    }
    const filtered = missingMaterials.filter((item) => item.title.toLowerCase().includes(value.toLowerCase()));
    setFilteredMissingMaterials(filtered);
    setSearchOptions(filtered.map((item) => ({ value: item.title || "", label: item.title || "Không xác định" })));
  };

  const updateRelevantData = useCallback(async (curriculumId) => {
    setIsSilentUpdate(true);
    try {
      await Promise.all([loadMissingMaterialsReport(curriculumId, true), loadCoverageByMajorReport(curriculumId, true)]);
    } catch { message.error("Không thể cập nhật dữ liệu!"); } 
    finally { setIsSilentUpdate(false); }
  }, [loadMissingMaterialsReport, loadCoverageByMajorReport]);

  // --- Cấu hình Biểu đồ & Bảng ---
  const enrichedCoverageByMajor = useMemo(() => {
    const enriched = coverageByMajor.map((item) => {
        const major = majors.find((m) => m.id === item.major_id);
        if (!major) return null;
        return {
          ...item,
          major_code: (major.code || major.name).toUpperCase(),
          major_name: major.name,
          coverage_percentage: typeof item.coverage_percentage === "string" ? parseFloat(item.coverage_percentage.replace("%", "")) || 0 : item.coverage_percentage || 0,
        };
      }).filter(Boolean);
    enriched.sort((a, b) => a.major_name.localeCompare(b.major_name));
    return enriched;
  }, [coverageByMajor, majors]);

  const chartData = useMemo(() => {
    return enrichedCoverageByMajor.map((item) => ({
      major_code: item.major_code,
      coverage_percentage: item.coverage_percentage,
      total_materials: item.total_materials,
      unique_materials: item.unique_materials,
    }));
  }, [enrichedCoverageByMajor]);

  const CoverageChart = ({ data }) => {
    if (!data || data.length === 0) return <Empty description="Không có dữ liệu" />;
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="major_code" tick={{ fontSize: 12, fontWeight: "bold" }} />
          <YAxis tickFormatter={(value) => `${value}%`} />
          <RechartsTooltip />
          <Legend formatter={() => "% Độ phủ"} />
          <Bar dataKey="coverage_percentage" fill="#0052cc" activeFill="#40c4ff" barSize={50}>
            <LabelList dataKey="coverage_percentage" position="top" formatter={(value) => `${value}%`} style={{ fontSize: 12, fill: "#333" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const columnsMissing = useMemo(() => [
      { title: "ID", dataIndex: "id", key: "id", width: 60 },
      { title: "Tên tài liệu", dataIndex: "title", key: "title" },
      { title: "Tác giả", dataIndex: "author", key: "author" },
      { title: "Môn học", key: "course", render: (_, r) => r.Course ? `${r.Course.code} - ${r.Course.name}` : "N/A" },
      { title: "Hành động", key: "action", render: (_, r) => <Button type="link" onClick={() => openEditModal(r)}>Sửa</Button> },
    ], []);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#1677ff", borderRadius: 8, fontFamily: "Inter, sans-serif" } }}>
      <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>Hệ thống Báo cáo</h1>

        {/* --- Toolbar --- */}
        <Space style={{ marginBottom: 24, flexWrap: "wrap" }}>
          
          {/* 1. Chọn loại báo cáo */}
          <Select 
            placeholder="Chọn loại báo cáo" 
            style={{ width: 260 }} 
            value={selectedType}
            onChange={(val) => setSelectedType(val)}
          >
             <Option value="">-- Báo cáo Tổng hợp (Đề cương) --</Option>
             <Option value="user-analytics">📊 Báo cáo Thống kê Người dùng</Option>
          </Select>

          {/* 2. Bộ lọc tùy thuộc loại báo cáo */}
          {selectedType === 'user-analytics' ? (
             <RangePicker 
               value={dateRange}
               onChange={setDateRange}
               format="DD/MM/YYYY"
               allowClear={false}
               style={{ width: 260 }}
               // ✨ Áp dụng chặn ngày tương lai
               disabledDate={disabledDate} 
             />
          ) : (
            <Tooltip title="Chọn đề cương để xem báo cáo">
              <Select
                placeholder="Chọn đề cương"
                style={{ width: 300 }}
                value={selectedCurriculum}
                onChange={setSelectedCurriculum}
                loading={loadingSummary}
              >
                {curriculums.map((c) => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
              </Select>
            </Tooltip>
          )}

          {/* 3. Các nút hành động */}
          <Space>
            <Tooltip title="Làm mới dữ liệu">
                <Button
                icon={<ReloadOutlined />}
                onClick={() => selectedType === 'user-analytics' ? loadUserReport() : loadReports(selectedCurriculum)}
                loading={loadingSummary || loadingUserAnalytics}
                >
                Làm mới
                </Button>
            </Tooltip>

            <Tooltip title="Xuất báo cáo ra file Excel">
                <Button
                icon={<DownloadOutlined />}
                type="primary"
                onClick={() => {
                    setExportModalOpen(true);
                    // Nếu đang ở tab User Analytics, tự động set giá trị cho form modal
                    if (selectedType === 'user-analytics') {
                        // setTimeout để đảm bảo form đã mount
                        setTimeout(() => form.setFieldsValue({ type: 'user-analytics' }), 0);
                    }
                }}
                disabled={selectedType !== 'user-analytics' && !selectedCurriculum}
                style={{ background: "#1677ff", color: "#ffffff", border: "none" }}
                >
                Xuất báo cáo
                </Button>
            </Tooltip>
          </Space>
        </Space>

        {/* ========================================================= */}
        {/* NỘI DUNG 1: DASHBOARD NGƯỜI DÙNG (USER ANALYTICS) */}
        {/* ========================================================= */}
        {selectedType === 'user-analytics' ? (
           <div style={{ marginTop: 24 }}>
             {loadingUserAnalytics ? <Skeleton active /> : userAnalytics ? (
               <>
                 <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card bordered={false} style={{ background: '#e6f7ff', borderRadius: 8 }}>
                        <Statistic 
                          title="Tổng tài khoản hệ thống" 
                          value={userAnalytics.summary?.total_accounts} // Dữ liệu thật từ Backend
                          prefix={<UserOutlined style={{ color: '#1890ff' }} />} 
                        />
                        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Tất cả tài khoản đã đăng ký</div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
                         <Statistic 
                           title="Người dùng hoạt động" 
                           value={userAnalytics.summary?.active_users} // Dữ liệu thật theo khoảng thời gian
                           prefix={<TeamOutlined style={{ color: '#52c41a' }} />} 
                         />
                         <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Có truy cập trong khoảng thời gian này</div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card bordered={false} style={{ background: '#fff7e6', borderRadius: 8 }}>
                         <Statistic 
                           title="Lượt truy cập (Sessions)" 
                           value={userAnalytics.summary?.total_visits} 
                           prefix={<GlobalOutlined style={{ color: '#fa8c16' }} />} 
                         />
                         <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Tổng số phiên làm việc</div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card bordered={false} style={{ background: '#f9f0ff', borderRadius: 8 }}>
                         <Statistic 
                           title="Thời gian TB (phút)" 
                           value={userAnalytics.summary?.avg_duration} 
                           precision={1}
                           prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />} 
                         />
                         <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Thời gian trung bình mỗi phiên</div>
                      </Card>
                    </Col>
                 </Row>

                 <Card title="Xu hướng hoạt động theo thời gian" style={{ marginTop: 24, borderRadius: 8 }}>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={userAnalytics.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{fontSize: 12}} />
                        <YAxis yAxisId="left" label={{ value: 'Lượt truy cập', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Thời gian (phút)', angle: 90, position: 'insideRight' }} />
                        <RechartsTooltip contentStyle={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="visits" name="Lượt truy cập" stroke="#1677ff" activeDot={{ r: 8 }} strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="duration" name="Thời gian TB (phút)" stroke="#82ca9d" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                 </Card>
               </>
             ) : <Empty description="Không có dữ liệu hoặc bạn không có quyền xem." />}
           </div>
        ) : (
          /* ========================================================= */
          /* NỘI DUNG 2: BÁO CÁO ĐỀ CƯƠNG (CŨ) */
          /* ========================================================= */
          selectedCurriculum && (
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                {loadingCoverageByMajor && !isSilentUpdate ? (
                  <Skeleton active />
                ) : (
                  <Card
                    title={`Độ phủ tài liệu theo ngành - Đề cương: ${curriculums.find(c => c.id === selectedCurriculum)?.name}`}
                    style={{ marginBottom: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
                  >
                    <Space style={{ marginBottom: 16 }}>
                      <div className="bg-blue-50 px-3 py-1 rounded">
                        <strong>Tổng tài liệu:</strong> {enrichedCoverageByMajor.reduce((sum, item) => sum + (item.total_materials || 0), 0)}
                      </div>
                      <div className="bg-green-50 px-3 py-1 rounded">
                        <strong>Có trong thư viện:</strong> {enrichedCoverageByMajor.reduce((sum, item) => sum + (item.unique_materials || 0), 0)}
                      </div>
                    </Space>
                    <CoverageChart data={chartData} />
                    {/* Bảng chi tiết độ phủ (ẩn bớt nếu cần gọn) */}
                  </Card>
                )}
              </Col>

              <Col xs={24}>
                {loadingMissingMaterials && !isSilentUpdate ? (
                  <Skeleton active />
                ) : (
                  <Card title="Danh sách tài liệu thiếu (Chưa có Link OPAC)" style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                      <AutoComplete
                        options={searchOptions}
                        style={{ width: 300 }}
                        onSearch={handleSearchMissingMaterials}
                        onSelect={handleSearchMissingMaterials}
                        placeholder="Tìm kiếm tên tài liệu thiếu..."
                        allowClear
                      >
                        <Input suffix={<SearchOutlined />} />
                      </AutoComplete>
                      <div style={{ fontWeight: "bold", color: 'red' }}>
                        Tổng số thiếu: {filteredMissingMaterials.length}
                      </div>
                    </div>
                    <Table
                      dataSource={filteredMissingMaterials}
                      columns={columnsMissing}
                      rowKey="id"
                      loading={loadingMissingMaterials && !isSilentUpdate}
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  </Card>
                )}
              </Col>
            </Row>
          )
        )}

        {/* Modal Export */}
        <Modal
          title="📤 Xuất báo cáo ra file"
          open={exportModalOpen}
          onCancel={() => setExportModalOpen(false)}
          onOk={() => form.submit()}
          okText="Tải về"
          okButtonProps={{ icon: <DownloadOutlined />, style: { background: "#1677ff", color: "#ffffff", border: "none" } }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleExport}
            initialValues={{ 
                format: "excel", 
                curriculum_id: selectedCurriculum,
                type: selectedType || "coverage-by-major",
                dateRange: dateRange 
            }}
          >
            <Form.Item
              name="type"
              label="Chọn loại báo cáo"
              rules={[{ required: true, message: "Vui lòng chọn loại báo cáo!" }]}
            >
              <Select placeholder="Chọn loại báo cáo" onChange={(val) => {
                  form.setFieldsValue({ type: val });
                  // Dùng state ảo để force re-render form nếu cần
                  // setSelectedType(val); // Không cần thiết nếu dùng shouldUpdate
              }}>
                <Option value="user-analytics">📊 Thống kê người dùng & Truy cập</Option>
                <Option value="coverage-by-major">📈 Độ phủ tài liệu theo ngành</Option>
                <Option value="missing-by-major">⚠️ Tài liệu thiếu OPAC</Option>
                <Option value="quantity-by-type">📚 Thống kê số lượng theo loại</Option>
                <Option value="all-materials">🗂️ Toàn bộ dữ liệu tài liệu</Option>
              </Select>
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
              {({ getFieldValue }) => {
                const type = getFieldValue("type");
                
                if (type === "user-analytics") {
                    return (
                        <Form.Item 
                            name="dateRange" 
                            label="Khoảng thời gian thống kê"
                            rules={[{ required: true, message: "Vui lòng chọn thời gian!" }]}
                        >
                            <RangePicker 
                              format="DD/MM/YYYY" 
                              style={{ width: '100%' }} 
                              // ✨ Áp dụng chặn ngày tương lai trong Modal
                              disabledDate={disabledDate} 
                            />
                        </Form.Item>
                    );
                }

                return (
                    <>
                        <Form.Item
                            name="curriculum_id"
                            label="Đề cương áp dụng"
                            rules={[{ required: true, message: "Vui lòng chọn đề cương!" }]}
                        >
                            <Select placeholder="Chọn đề cương">
                                {curriculums.map((c) => (<Option key={c.id} value={c.id}>{c.name}</Option>))}
                            </Select>
                        </Form.Item>
                        {["coverage-by-major", "missing-by-major", "quantity-by-type"].includes(type) && (
                            <Form.Item name="major_ids" label="Lọc theo Ngành (tuỳ chọn)">
                                <Select mode="multiple" placeholder="Tất cả các ngành" options={majors.map((m) => ({ label: m.name, value: m.id }))} />
                            </Form.Item>
                        )}
                    </>
                );
              }}
            </Form.Item>

            <Form.Item name="format" label="Định dạng file" initialValue="excel">
              <Select>
                <Option value="excel">Excel (.xlsx)</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal Edit Material */}
        <Modal
          title="Chỉnh sửa tài liệu"
          open={editModalOpen}
          onCancel={() => { setEditModalOpen(false); updateRelevantData(selectedCurriculum); }}
          footer={null}
          destroyOnClose
        >
          <MaterialForm
            initialValues={editingMaterial}
            onCancel={() => { setEditModalOpen(false); updateRelevantData(selectedCurriculum); }}
            onSubmit={() => { setEditModalOpen(false); updateRelevantData(selectedCurriculum); }}
          />
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default Reports;