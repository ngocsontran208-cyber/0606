import React, { useEffect, useState } from 'react';
import courseApi from '../api/courseApi';
import majorsApi from '../api/majorsApi';
import { fetchCurriculums } from '../api/curriculumApi';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Typography, // ✨ THÊM
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  LinkOutlined,
  SyncOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { TabPane } = Tabs;
const { Title } = Typography; // ✨ THÊM

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [apiCourses, setApiCourses] = useState([]);
  const [filteredApiCourses, setFilteredApiCourses] = useState([]);
  const [majors, setMajors] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState(
    JSON.parse(localStorage.getItem('selectedCurriculum'))?.id || null
  );
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingCourse, setEditingCourse] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [assigningCourseId, setAssigningCourseId] = useState(null);
  const [assignSearch, setAssignSearch] = useState('');

  const isCurriculumLocked = curriculums.find(c => c.id === selectedCurriculum)?.status === 'Đã khóa';

  // (Toàn bộ logic useEffect và các hàm fetch... của bạn giữ nguyên)
  // ...
  // ... (Giữ nguyên từ dòng 60 đến 350) ...
  // ...

  useEffect(() => {
    fetchAllCurriculums();
  }, []);

  useEffect(() => {
    if (selectedCurriculum) {
      fetchMajors(selectedCurriculum);
      fetchApiCourses();
      localStorage.setItem('selectedCurriculum', JSON.stringify({ id: selectedCurriculum }));
    }
  }, [selectedCurriculum]);

  useEffect(() => {
    if (selectedMajor) fetchCourses(selectedMajor);
  }, [selectedMajor]);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, courses]);

  useEffect(() => {
    filterApiCourses();
  }, [apiSearchQuery, apiCourses]);

  const fetchAllCurriculums = async () => {
    try {
      const curriculumsData = await fetchCurriculums();
      setCurriculums(Array.isArray(curriculumsData) ? curriculumsData : []);
    } catch (error) {
      message.error('Lỗi tải danh sách đề cương!');
      setCurriculums([]);
    }
  };

  const fetchMajors = async (curriculumId) => {
    try {
      const res = await majorsApi.getByCurriculum(curriculumId);
      const majorsData = Array.isArray(res.data) ? res.data : [];
      setMajors(majorsData);
      if (majorsData.length > 0) {
        setSelectedMajor(majorsData[0].id);
        fetchCourses(majorsData[0].id);
      } else {
        setSelectedMajor(null);
        setCourses([]);
        setFilteredCourses([]);
      }
    } catch (error) {
      message.error('Lỗi tải danh sách ngành!');
      setMajors([]);
    }
  };

  // 🔥🔥🔥 ĐÃ SỬA Ở ĐÂY: Thêm tham số selectedCurriculum 🔥🔥🔥
  const fetchCourses = async (majorId) => {
    setLoading(true);
    try {
      // SỬA LỖI: Truyền thêm selectedCurriculum để lọc môn chính xác theo đề cương
      const res = await courseApi.getByMajor(majorId, selectedCurriculum);
      
      const coursesData = Array.isArray(res.data) ? res.data : [];
      setCourses(coursesData);
      setFilteredCourses(coursesData);
    } catch (error) {
      message.error('Lỗi tải danh sách môn học!');
      setCourses([]);
      setFilteredCourses([]);
    }
    setLoading(false);
  };
  // 🔥🔥🔥 KẾT THÚC SỬA 🔥🔥🔥

  const fetchApiCourses = async () => {
    if (!selectedCurriculum) return;
    setApiLoading(true);
    try {
      const res = await courseApi.getAll({ curriculum_id: selectedCurriculum });
      const coursesData = Array.isArray(res.data) ? res.data : [];
      setApiCourses(coursesData);
      setFilteredApiCourses(coursesData);
    } catch (error) {
      message.error('Lỗi tải danh sách môn học từ API!');
      setApiCourses([]);
      setFilteredApiCourses([]);
    }
    setApiLoading(false);
  };

  const filterCourses = () => {
    const lower = searchQuery.toLowerCase();
    if (!Array.isArray(courses)) return;
    setFilteredCourses(
      courses.filter(
        (course) =>
          course.code.toLowerCase().includes(lower) ||
          course.name.toLowerCase().includes(lower) ||
          course.english_name?.toLowerCase().includes(lower)
      )
    );
  };

  const filterApiCourses = () => {
    const lower = apiSearchQuery.toLowerCase();
    if (!Array.isArray(apiCourses)) return;
    setFilteredApiCourses(
      apiCourses.filter(
        (course) =>
          course.code.toLowerCase().includes(lower) ||
          course.name.toLowerCase().includes(lower) ||
          course.english_name?.toLowerCase().includes(lower)
      )
    );
  };

  const handleSyncCourses = async () => {
    if (!selectedCurriculum) {
      message.error('Vui lòng chọn đề cương!');
      return;
    }
    if (isCurriculumLocked) {
      message.error('Đề cương đã bị khóa, không thể đồng bộ môn học!');
      return;
    }
    setApiLoading(true);
    try {
      const res = await courseApi.syncCourses(selectedCurriculum, false);
      message.success('' + res.data.message);
      await fetchApiCourses();
      if (selectedMajor) await fetchCourses(selectedMajor);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Lỗi đồng bộ môn học!';
      if (error.response?.status === 403) {
        message.error('Chỉ admin được phép đồng bộ môn học!');
      } else if (error.response?.status === 404) {
        message.error('Đề cương không tồn tại!');
      } else if (error.response?.status === 500) {
        message.error('Lỗi server! Vui lòng kiểm tra log backend.');
      } else if (error.code === 'ECONNABORTED') {
        message.error('Timeout! Server không phản hồi.');
      } else if (!error.response) {
        message.error('Không thể kết nối đến server!');
      } else {
        message.error('' + errorMsg);
      }
    }
    setApiLoading(false);
  };

  const handleFinish = async (values) => {
    if (isCurriculumLocked) {
      message.error('Đề cương đã bị khóa, không thể thêm hoặc cập nhật môn học!');
      return;
    }
    try {
      if (!selectedCurriculum || !selectedMajor) {
        message.error('Vui lòng chọn đề cương và ngành!');
        return;
      }
      const payload = {
        code: values.code.trim(),
        name: values.name.trim(),
        english_name: values.english_name?.trim(),
        credits: values.credits ? parseFloat(values.credits) : undefined,
        major_id: selectedMajor,
        curriculum_id: selectedCurriculum,
      };
      if (editingCourse) {
        await courseApi.update(editingCourse.id, payload);
        message.success('Cập nhật môn học thành công!');
      } else {
        await courseApi.create(payload);
        message.success('Thêm môn học thành công!');
      }
      fetchCourses(selectedMajor);
      setIsModalOpen(false);
      setEditingCourse(null);
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi xử lý môn học!');
    }
  };

  const handleDeleteCourse = async (id, majorId = '', isOnlyOne = false) => {
    if (isCurriculumLocked) {
      message.error('Đề cương đã bị khóa, không thể xóa môn học!');
      return;
    }
    try {
      if (isOnlyOne) {
        await courseApi.delete(id);
        message.success('Xoá môn học khỏi hệ thống!');
      } else {
        await courseApi.removeCourseFromMajor(id, majorId);
        message.success('Đã gỡ môn học khỏi ngành!');
      }
      fetchCourses(selectedMajor);
    } catch (error) {
      message.error('Xóa thất bại!');
    }
  };

  const handleOpenAssignModal = async () => {
    if (isCurriculumLocked) {
      message.error('Đề cương đã bị khóa, không thể gán môn học!');
      return;
    }
    try {
      const res = await courseApi.getAll({ curriculum_id: selectedCurriculum });
      const allCourses = Array.isArray(res.data) ? res.data : [];
      const notAssigned = allCourses.filter(
        (c) => !courses.some((course) => course.id === c.id)
      );
      setAvailableCourses(notAssigned);
      setIsAssignModalOpen(true);
    } catch (error) {
      message.error('Không thể lấy danh sách môn học!');
    }
  };

  const handleAssignCourse = async () => {
    if (isCurriculumLocked) {
      message.error('Đề cương đã bị khóa, không thể gán môn học!');
      return;
    }
    try {
      await courseApi.assignToMajor(assigningCourseId, selectedMajor, { includeMaterials: false });
      message.success('Đã gán môn học vào ngành! Thêm tài liệu mới trong trang quản lý tài liệu.');
      fetchCourses(selectedMajor);
      setIsAssignModalOpen(false);
      setAssigningCourseId(null);
      setAssignSearch('');
    } catch (error) {
      message.error('Gán môn thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredCoursesData = availableCourses.filter((course) =>
    course.code.toLowerCase().includes(assignSearch.toLowerCase()) ||
    course.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
    course.english_name?.toLowerCase().includes(assignSearch.toLowerCase())
  );

  const getCurriculumName = (curriculum_id) => {
    const curriculum = curriculums.find((c) => c.id === curriculum_id);
    return curriculum ? `${curriculum.name} ${curriculum.status === 'Đã khóa' ? '(🔒 Đã khóa)' : ''}` : "Không xác định";
  };

  const columns = [
    { title: 'STT', render: (_, __, index) => index + 1, width: 80, align: 'center' },
    { title: 'Mã môn học', dataIndex: 'code', width: 150, align: 'center' },
    { title: 'Tên môn học', dataIndex: 'name', width: 300, align: 'center' },
    { title: 'Tên tiếng Anh', dataIndex: 'english_name', width: 300, align: 'center' },
    { title: 'Tín chỉ', dataIndex: 'credits', width: 100, align: 'center' },
    { title: 'Ngành', dataIndex: 'major_name', width: 200, align: 'center' },
    {
      title: 'Đề cương',
      dataIndex: 'curriculum_id',
      width: 250,
      align: 'center',
      render: (curriculum_id) => getCurriculumName(curriculum_id),
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center',
      width: 180,
      render: (_, record) => {
        const isOnlyOneMajor = record.majors?.length <= 0;
        return (
          <>
            <Button
              icon={<EditOutlined />}
              style={{ marginRight: 8 }}
              onClick={() => {
                if (isCurriculumLocked) {
                  message.error('Đề cương đã bị khóa, không thể chỉnh sửa môn học!');
                  return;
                }
                setEditingCourse(record);
                form.setFieldsValue({
                  code: record.code,
                  name: record.name,
                  english_name: record.english_name,
                  credits: record.credits,
                });
                setIsModalOpen(true);
              }}
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                if (isCurriculumLocked) {
                  message.error('Đề cương đã bị khóa, không thể xóa môn học!');
                  return;
                }
                if (isOnlyOneMajor) {
                  Modal.confirm({
                    title: 'Xác nhận xoá vĩnh viễn?',
                    content: 'Môn học này chỉ thuộc một ngành. Bạn có chắc muốn xoá vĩnh viễn khỏi hệ thống?',
                    okText: 'Xoá',
                    okType: 'danger',
                    cancelText: 'Không',
                    onOk: () => handleDeleteCourse(record.id, null, true),
                  });
                } else {
                  Modal.confirm({
                    title: 'Gỡ môn khỏi ngành?',
                    content: 'Môn học đang thuộc nhiều ngành. Bạn có thể gỡ khỏi ngành này.',
                    okText: 'Gỡ',
                    cancelText: 'Không',
                    onOk: () => handleDeleteCourse(record.id, selectedMajor),
                  });
                }
              }}
            />
          </>
        );
      },
    },
  ];

  const apiColumns = [
    { title: 'STT', render: (_, __, index) => index + 1, width: 80, align: 'center' },
    { title: 'Mã môn học', dataIndex: 'code', width: 150, align: 'center' },
    { title: 'Tên môn học', dataIndex: 'name', width: 300, align: 'center' },
    { title: 'Tên tiếng Anh', dataIndex: 'english_name', width: 300, align: 'center' },
    { title: 'Tín chỉ', dataIndex: 'credits', width: 100, align: 'center' },
    {
      title: 'Đề cương',
      dataIndex: 'curriculum_id',
      width: 250,
      align: 'center',
      render: (curriculum_id) => getCurriculumName(curriculum_id),
    },
  ];

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: '0 auto' }}>
      {/* ✨ YÊU CẦU 2: Sửa tiêu đề */}
      <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
        Quản lý môn học
      </Title>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Môn học theo đề cương" key="1">
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <Select
              placeholder="Chọn đề cương"
              style={{ width: 300 }}
              value={selectedCurriculum}
              onChange={setSelectedCurriculum}
            >
              {curriculums.map((curriculum) => (
                <Option
                  key={curriculum.id}
                  value={curriculum.id}
                  disabled={curriculum.status === 'inactive'}
                >
                  {curriculum.name} {curriculum.status === 'Đã khóa' ? '(🔒 Đã khóa)' : ''}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Chọn ngành"
              style={{ width: 250 }}
              value={selectedMajor}
              onChange={setSelectedMajor}
              disabled={!selectedCurriculum}
            >
              {majors.map((major) => (
                <Option key={major.id} value={major.id}>
                  {major.name}
                </Option>
              ))}
            </Select>

            <Input
              placeholder="Tìm kiếm môn học..."
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (isCurriculumLocked) {
                  message.error('Đề cương đã bị khóa, không thể thêm môn học!');
                  return;
                }
                setEditingCourse(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
              disabled={!selectedMajor || isCurriculumLocked}
              // ✨ YÊU CẦU 1: SỬA LỖI NÚT BẤM
              style={{
                background: "#1677ff",
                color: "#ffffff",
                border: "none"
              }}
            >
              Thêm môn học
            </Button>

            <Button
              icon={<LinkOutlined />}
              onClick={handleOpenAssignModal}
              disabled={!selectedMajor || isCurriculumLocked}
            >
              Gán môn có sẵn
            </Button>
          </div>

          <p style={{ marginBottom: 10, textAlign: 'right', fontWeight: 'bold' }}>
            Tổng số môn học: {filteredCourses.length}
          </p>
          <Table
            dataSource={filteredCourses}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            bordered
          />
        </TabPane>

        <TabPane tab="Toàn bộ môn học từ API" key="2">
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <Input
              placeholder="Tìm kiếm môn học..."
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
              value={apiSearchQuery}
              onChange={(e) => setApiSearchQuery(e.target.value)}
            />
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={handleSyncCourses}
              loading={apiLoading}
              disabled={!selectedCurriculum || isCurriculumLocked}
              // ✨ YÊU CẦU 1: SỬA LỖI NÚT BẤM
              style={{
                background: "#1677ff",
                color: "#ffffff",
                border: "none"
              }}
            >
              Đồng bộ môn học
            </Button>
          </div>
          <p style={{ marginBottom: 10, textAlign: 'right', fontWeight: 'bold' }}>
            Tổng số môn học: {filteredApiCourses.length}
          </p>
          {apiCourses.length === 0 && !apiLoading ? (
            <p style={{ textAlign: 'center', margin: 20 }}>
              Chưa có môn học. Vui lòng chọn đề cương và nhấn "Đồng bộ môn học" hoặc kiểm tra dữ liệu đã đồng bộ.
            </p>
          ) : (
            <Table
              dataSource={filteredApiCourses}
              columns={apiColumns}
              rowKey="id"
              loading={apiLoading}
              pagination={{ pageSize: 10 }}
              bordered
            />
          )}
        </TabPane>
      </Tabs>
      <Modal
        title={editingCourse ? 'Cập nhật môn học' : 'Thêm môn học'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingCourse(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="code"
            label="Mã môn học"
            rules={[{ required: true, message: 'Vui lòng nhập mã môn học!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên môn học"
            rules={[{ required: true, message: 'Vui lòng nhập tên môn học!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="english_name" label="Tên tiếng Anh">
            <Input />
          </Form.Item>
          <Form.Item name="credits" label="Tín chỉ">
            <Input type="number" step="0.5" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            // ✨ YÊU CẦU 1: SỬA LỖI NÚT BẤM
            style={{
              background: "#1677ff",
              color: "#ffffff",
              border: "none"
            }}
          >
            {editingCourse ? 'Lưu thay đổi' : 'Thêm mới'}
          </Button>
        </Form>
      </Modal>

      <Modal
        title="🔗 Gán môn có sẵn"
        open={isAssignModalOpen}
        onCancel={() => {
          setIsAssignModalOpen(false);
          setAssigningCourseId(null);
          setAssignSearch('');
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsAssignModalOpen(false);
              setAssigningCourseId(null);
              setAssignSearch('');
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleAssignCourse}
            disabled={!assigningCourseId}
            // ✨ YÊU CẦU 1: SỬA LỖI NÚT BẤM
            style={{
              background: "#1677ff",
              color: "#ffffff",
              border: "none"
            }}
          >
            Gán
          </Button>,
        ]}
      >
        <Input
          placeholder="Tìm kiếm môn học..."
          style={{ width: '100%', marginBottom: 10 }}
          prefix={<SearchOutlined />}
          value={assignSearch}
          onChange={(e) => setAssignSearch(e.target.value)}
        />
        <Select
          placeholder="Chọn môn học"
          style={{ width: '100%' }}
          value={assigningCourseId}
          onChange={(val) => setAssigningCourseId(val)}
          showSearch
          filterOption={false}
          options={filteredCoursesData.map((course) => ({
            value: course.id,
            label: `${course.name} (${course.code}) - ${course.english_name || 'No English Name'} - ${course.credits} tín chỉ`,
          }))}
        />
        <p style={{ color: '#fa8c16', marginTop: 10 }}></p>
      </Modal>
    </div>
  );
};

export default Courses;