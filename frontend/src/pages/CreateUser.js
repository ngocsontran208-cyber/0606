// frontend/src/pages/CreateUser.js
// *** FILE HOÀN CHỈNH ĐÃ SỬA ***

import React, { useEffect, useState, useContext } from "react";
import { debounce } from "lodash";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchRoles as fetchRolesApi,
  importUsers,
  fetchOnlineUsers,
  bulkUpdateUserStatus,
} from "../api/userApi";
import cohortApi from "../api/cohortApi";
// *** SỬA: Import 'majorsApi' thay vì 'fetchMajors' ***
import majorsApi from "../api/majorsApi";
import {
  Layout,
  Card,
  Button,
  Form,
  Input,
  Select,
  Typography,
  message,
  Space,
  Table,
  Popconfirm,
  Modal,
  Tabs,
  Progress,
  Spin,
  Divider,
  Upload,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SearchOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../context/AuthContext";

const { Title } = Typography;
const { Option } = Select;
const { Content } = Layout;

// Tên file là CreateUser.js nhưng component là Users
const Users = () => {
  const { user, token } = useContext(AuthContext); // Token đã có ở đây
  const [roles, setRoles] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [majors, setMajors] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const isAdmin = user?.role?.name === "admin";

  // *** BỔ SUNG: State cho bộ lọc Khóa và Ngành ***
  const [selectedMajorId, setSelectedMajorId] = useState(undefined);
  const [selectedCohortId, setSelectedCohortId] = useState(undefined);
  // *** KẾT THÚC BỔ SUNG ***

  const loadRoles = async () => {
    try {
      const res = await fetchRolesApi(token);
      setRoles(Array.isArray(res) ? res : []);
    } catch (err) {
      message.error(err.message || "Không thể tải danh sách quyền!");
    }
  };

  // *** SỬA: Hàm loadUsers chấp nhận filter để gọi API ***
  const loadUsers = async (majorId, cohortId) => {
    try {
      setLoading(true);
      // Gọi API với các filter (majorId, cohortId)
      const res = await fetchUsers(token, { majorId, cohortId }); 
      const sorted = Array.isArray(res)
        ? res.sort((a, b) => a.username.localeCompare(b.username))
        : [];
      setUsers(sorted);
      // Khi tải lại danh sách mới, xóa các khóa đã chọn
      setSelectedRowKeys([]); 
    } catch (err) {
      message.error(err.message || "Không thể tải danh sách người dùng!");
    } finally {
      setLoading(false);
    }
  };
  // *** KẾT THÚC SỬA ***

  const loadOnlineUsers = async () => {
    try {
      const res = await fetchOnlineUsers(token);
      if (res && Array.isArray(res.data)) {
        setOnlineUsers(res.data);
      } else if (Array.isArray(res)) {
        setOnlineUsers(res);
      } else {
        setOnlineUsers([]);
      }
    } catch (err) {
      message.error(err.message || "Không thể tải danh sách người dùng online!");
      setOnlineUsers([]);
    }
  };

  const loadCohorts = async () => {
    try {
      // *** SỬA: Gửi token ***
      const res = await cohortApi.getAllCohorts(token);
      setCohorts(res.data || []);
    } catch (err) {
      message.error("Không thể tải danh sách Khóa!");
    }
  };

  const loadMajors = async () => {
    try {
      // *** SỬA: Gửi token ***
      const res = await majorsApi.getAll(token);
      setMajors(res.data || []);
    } catch (err) {
      message.error("Không thể tải danh sách Ngành!");
    }
  };

  // *** SỬA: Thêm selectedMajorId và selectedCohortId vào dependency array ***
  useEffect(() => {
    if (isAdmin) {
      loadRoles();
      // Gọi loadUsers với các filter
      loadUsers(selectedMajorId, selectedCohortId); 
      loadOnlineUsers();
      loadCohorts();
      loadMajors();
    } else {
      message.error("Bạn không có quyền truy cập chức năng này!");
    }
  }, [user, isAdmin, token, selectedMajorId, selectedCohortId]); 
  // *** KẾT THÚC SỬA ***

  useEffect(() => {
    if (isAdmin) {
      const interval = setInterval(() => {
        loadOnlineUsers();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, token]); // Thêm token

  useEffect(() => {
    handleSearch(searchTerm);
  }, [users, searchTerm]);

  const debouncedSearch = debounce((term) => {
    setSearchTerm(term);
  }, 300);

  const handleSearch = (term) => {
    // Lưu ý: `users` đã được lọc từ server theo major/cohort, ta chỉ cần lọc thêm theo searchTerm.
    const lower = term.toLowerCase();
    const filtered = users.filter(
      (u) =>
        (u.username && u.username.toLowerCase().includes(lower)) ||
        (u.full_name && u.full_name.toLowerCase().includes(lower))
    );
    setFilteredUsers(filtered);
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (editingUser) {
        if (!editingUser.id) {
          message.error("Không xác định được người dùng cần cập nhật!");
          return;
        }
        await updateUser(token, editingUser.id, values);
        message.success("Cập nhật tài khoản thành công!");
      } else {
        await createUser(token, values);
        message.success("Tạo tài khoản thành công!");
      }
      form.resetFields();
      setPasswordStrength(0);
      // *** SỬA: Gọi lại loadUsers với các filter hiện tại ***
      loadUsers(selectedMajorId, selectedCohortId); 
      // *** KẾT THÚC SỬA ***
      setFormVisible(false);
      setEditingUser(null);
    } catch (err) {
      message.error(err.message || "Thao tác thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      ...record,
      role_id: record.role?.id || record.role_id,
      cohort_id: record.cohort_id || undefined,
      major_id: record.major_id || undefined,
    });
    setFormVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(token, id);
      message.success("Đã xóa người dùng thành công!");
      // *** SỬA: Gọi lại loadUsers với các filter hiện tại ***
      loadUsers(selectedMajorId, selectedCohortId);
      // *** KẾT THÚC SỬA ***
    } catch (err) {
      message.error(err.message || "Không thể xóa người dùng!");
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      message.warning("Vui lòng chọn tệp Excel trước!");
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", importFile);

    try {
      setLoading(true);
      const response = await importUsers(token, formData);
      message.success(response.message || "Nhập khẩu thành công!");
      // *** SỬA: Gọi lại loadUsers với các filter hiện tại ***
      loadUsers(selectedMajorId, selectedCohortId);
      // *** KẾT THÚC SỬA ***
      setImportVisible(false);
      setImportFile(null);
    } catch (err) {
      const errorMessage = err.message || "Nhập khẩu thất bại!";
      const skipped = err.response?.data?.skipped || [];
      if (skipped.length > 0) {
        console.error("Skipped rows:", skipped);
        message.error(
          `${errorMessage} (Chi tiết: ${skipped
            .map((s) => `${s.username}: ${s.reason}`)
            .join(", ")})`
        );
      } else {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // *** BỔ SUNG: Hàm chung cho bulk action (Khóa/Mở khóa/Xóa) ***
  const handleBulkAction = async (actionType) => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một người dùng!");
      return;
    }

    let successMessage = "";
    let actionFailedMessage = "";

    try {
      setLoading(true);

      if (actionType === "lock") {
        await bulkUpdateUserStatus(token, selectedRowKeys, true);
        successMessage = `Khóa ${selectedRowKeys.length} tài khoản thành công!`;
        actionFailedMessage = "Khóa thất bại!";
      } else if (actionType === "unlock") {
        await bulkUpdateUserStatus(token, selectedRowKeys, false);
        successMessage = `Mở khóa ${selectedRowKeys.length} tài khoản thành công!`;
        actionFailedMessage = "Mở khóa thất bại!";
      } else if (actionType === "delete") {
        // Gọi API xóa từng người dùng tuần tự
        await Promise.all(selectedRowKeys.map(id => deleteUser(token, id)));
        successMessage = `Xóa ${selectedRowKeys.length} tài khoản thành công!`;
        actionFailedMessage = "Xóa hàng loạt thất bại!";
      }

      message.success(successMessage);
      setSelectedRowKeys([]);
      // Gọi lại loadUsers với bộ lọc hiện tại sau khi hoàn thành
      loadUsers(selectedMajorId, selectedCohortId); 
    } catch (err) {
      message.error(err.message || actionFailedMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBulkLock = (lock) => {
    handleBulkAction(lock ? "lock" : "unlock");
  };
  // *** KẾT THÚC BỔ SUNG ***
  
  // *** SỬA: Cập nhật handleToggleLock để gọi loadUsers với filter ***
  const handleToggleLock = async (record) => {
    const isCurrentlyLocked = record.is_locked;
    const actionText = isCurrentlyLocked ? "Mở khóa" : "Khóa";

    try {
      setLoading(true);
      await bulkUpdateUserStatus(token, [record.id], !isCurrentlyLocked);
      message.success(
        `${actionText} tài khoản ${record.username} thành công!`
      );
      // Gọi lại loadUsers với các filter hiện tại
      loadUsers(selectedMajorId, selectedCohortId);
    } catch (err) {
      message.error(err.message || `${actionText} thất bại!`);
    } finally {
      setLoading(false);
    }
  };
  // *** KẾT THÚC SỬA ***

  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: "Tên đăng nhập",
      dataIndex: "username",
      sorter: (a, b) => (a.username || "").localeCompare(b.username || ""),
    },
    {
      title: "Họ tên",
      dataIndex: "full_name",
      sorter: (a, b) => (a.full_name || "").localeCompare(b.full_name || ""),
    },
    {
      title: "Quyền",
      dataIndex: ["role", "name"],
      sorter: (a, b) => (a.role?.name || "").localeCompare(b.role?.name),
    },
    {
      title: "Khóa",
      dataIndex: ["cohort", "name"],
      sorter: (a, b) => (a.cohort?.name || "").localeCompare(b.cohort?.name),
    },
    {
      title: "Ngành",
      dataIndex: ["major", "name"],
      sorter: (a, b) => (a.major?.name || "").localeCompare(b.major?.name),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_locked",
      render: (is_locked) =>
        is_locked ? (
          <span style={{ color: "red" }}>
            <LockOutlined /> Đã khóa
          </span>
        ) : (
          <span style={{ color: "green" }}>
            <UnlockOutlined /> Hoạt động
          </span>
        ),
      filters: [
        { text: "Hoạt động", value: false },
        { text: "Đã khóa", value: true },
      ],
      onFilter: (value, record) => record.is_locked === value,
    },
    {
      title: "Hành động",
      fixed: "right",
      width: 140,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />

          <Popconfirm
            title={
              record.is_locked
                ? "Mở khóa người dùng này?"
                : "Khóa người dùng này?"
            }
            onConfirm={() => handleToggleLock(record)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button
              // *** ĐÃ SỬA: Đổi nút Khóa cá nhân từ màu đỏ (danger) sang màu cam/vàng cảnh báo ***
              style={!record.is_locked ? { borderColor: "#faad14", color: "#faad14" } : {}}
              icon={record.is_locked ? <UnlockOutlined /> : <LockOutlined />}
            />
          </Popconfirm>
          
          {/* *** ĐÃ KHÔI PHỤC: Nút Xóa cá nhân với màu đỏ (danger) *** */}
          <Popconfirm
            title="Xóa người dùng này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
          {/* *** KẾT THÚC KHÔI PHỤC *** */}
        </Space>
      ),
    },
  ];

  const onlineColumns = [
    { title: "STT", render: (_, __, index) => index + 1, width: 60 },
    { title: "Tên đăng nhập", dataIndex: "username" },
    { title: "Họ tên", dataIndex: "full_name" },
    {
      title: "Khóa",
      dataIndex: ["cohort", "name"],
    },
    {
      title: "Ngành",
      dataIndex: ["major", "name"],
    },
    {
      title: "Thời gian hoạt động",
      dataIndex: ["sessions", "0", "last_active"],
      render: (text) => {
        if (!text) return "Không xác định";
        const lastActive = new Date(text);
        // Giả sử session hợp lệ trong 12 giờ
        const isActive =
          lastActive > new Date(Date.now() - 12 * 60 * 60 * 1000);
        return isActive ? lastActive.toLocaleString() : "Đã đăng xuất";
      },
    },
  ];

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const tabItems = [
    {
      key: "1",
      label: "Danh sách người dùng",
      children: (
        <Table
          rowKey="id"
          rowSelection={rowSelection}
          dataSource={filteredUsers || []}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 6 }}
          scroll={{ x: 1200 }}
        />
      ),
    },
    {
      key: "2",
      label: "Người dùng trực tuyến",
      children: (
        <Table
          rowKey="id"
          dataSource={onlineUsers || []}
          columns={onlineColumns}
          loading={loading}
          pagination={{ pageSize: 6 }}
          scroll={{ x: 1000 }}
        />
      ),
    },
  ];

  const uploadProps = {
    name: "excelFile",
    multiple: false,
    accept: ".xlsx,.xls",
    beforeUpload: (file) => {
      const isExcel = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ].includes(file.type);

      if (!isExcel) {
        message.error("Bạn chỉ có thể tải lên tệp .xlsx hoặc .xls!");
        return Upload.LIST_IGNORE;
      }

      setImportFile(file);
      return false; // Ngăn tải lên tự động
    },
    onRemove: () => {
      setImportFile(null);
    },
    fileList: importFile ? [importFile] : [],
  };

  const styles = {
    pageHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    toolbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      flexWrap: "wrap",
      gap: 16,
    },
  };

  if (!isAdmin) {
    // Hiển thị thông báo hoặc component rỗng nếu không phải admin
    // thay vì trả về null để tránh lỗi render
    return (
      <Card style={{ margin: 24 }}>
        <Title level={4} type="danger">
          Truy cập bị từ chối
        </Title>
        <p>Bạn không có quyền truy cập chức năng này.</p>
      </Card>
    );
  }

  return (
    <Content style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <Card variant="bordered">
        <div style={styles.pageHeader}>
          <Title level={3} style={{ margin: 0 }}>
            <UserAddOutlined /> Quản lý người dùng
          </Title>
          <Space>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setImportVisible(true)}
            >
              Nhập Excel
            </Button>
            <Button
              type="primary"
              onClick={() => setFormVisible(true)}
              // ✨ SỬA LỖI NÚT BẤM
              style={{
                background: "#1677ff",
                color: "#ffffff",
                border: "none",
              }}
            >
              + Tạo tài khoản
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: "0 0 16px 0" }} />

        <div style={styles.toolbar}>
          <Space size="middle" wrap>
            <Input
              placeholder="🔍 Tìm kiếm theo tên hoặc tên đăng nhập..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 300 }}
              onChange={(e) => debouncedSearch(e.target.value)}
            />
            
            {/* *** BỔ SUNG: Select lọc theo Ngành (Major) *** */}
            <Select
              placeholder="Lọc theo Ngành"
              allowClear
              showSearch
              style={{ width: 200 }}
              value={selectedMajorId}
              onChange={setSelectedMajorId} // Cập nhật state, kích hoạt useEffect
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {majors.map((m) => (
                <Option key={m.id} value={m.id}>
                  {`${m.name} (${m.code})`}
                </Option>
              ))}
            </Select>
            {/* *** KẾT THÚC BỔ SUNG *** */}

            {/* *** BỔ SUNG: Select lọc theo Khóa (Cohort) *** */}
            <Select
              placeholder="Lọc theo Khóa"
              allowClear
              showSearch
              style={{ width: 150 }}
              value={selectedCohortId}
              onChange={setSelectedCohortId} // Cập nhật state, kích hoạt useEffect
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {cohorts.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name}
                </Option>
              ))}
            </Select>
            {/* *** KẾT THÚC BỔ SUNG *** */}
            
            <span>
              Tổng cộng: <b>{filteredUsers.length}</b>
            </span>
          </Space>

          <Space>
            {selectedRowKeys.length > 0 && (
              <>
                <span style={{ color: "#555" }}>
                  Đã chọn: <b>{selectedRowKeys.length}</b>
                </span>
                <Button
                  // *** ĐÃ SỬA: Đổi nút Khóa hàng loạt từ màu đỏ (danger) sang màu cam/vàng cảnh báo ***
                  style={{ borderColor: "#faad14", color: "#faad14" }}
                  icon={<LockOutlined />}
                  onClick={() => handleBulkLock(true)}
                  loading={loading}
                >
                  Khóa ({selectedRowKeys.length})
                </Button>
                <Button
                  style={{ borderColor: "green", color: "green" }}
                  icon={<UnlockOutlined />}
                  onClick={() => handleBulkLock(false)}
                  loading={loading}
                >
                  Mở khóa ({selectedRowKeys.length})
                </Button>
                
                {/* *** Nút XÓA hàng loạt (Giữ nguyên màu đỏ danger) *** */}
                <Popconfirm
                  title="Bạn có chắc chắn muốn XÓA vĩnh viễn các tài khoản này?"
                  description="Thao tác này không thể hoàn tác!"
                  onConfirm={() => handleBulkAction("delete")} 
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={loading}
                  >
                    Xóa ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
                {/* *** KẾT THÚC *** */}
              </>
            )}
          </Space>
        </div>

        <Tabs defaultActiveKey="1" items={tabItems} />
      </Card>

      <Modal
        // Class của bạn (Tailwind) vẫn được giữ lại cho Modal
        title={
          <div className="flex items-center gap-3 text-xl font-semibold text-gray-800">
            {editingUser ? (
              <EditOutlined className="text-blue-500" />
            ) : (
              <UserAddOutlined className="text-blue-500" />
            )}
            {editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
          </div>
        }
        open={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingUser(null);
          setPasswordStrength(0);
          form.resetFields();
        }}
        footer={null}
        width={600}
        className="rounded-2xl shadow-xl"
        styles={{ body: { padding: "24px 32px" } }}
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ role_id: undefined }}
            className="mt-6"
          >
            <Form.Item
              label={
                <span className="font-medium text-gray-700">
                  Tên đăng nhập
                </span>
              }
              name="username"
              rules={[
                { required: true, message: "Vui lòng nhập tên đăng nhập!" },
                {
                  pattern: /^[a-zA-Z0-9_]{3,20}$/,
                  message:
                    "Tên đăng nhập chỉ chứa chữ, số, gạch dưới, từ 3-20 ký tự!",
                },
              ]}
            >
              <Input
                disabled={!!editingUser}
                placeholder="Nhập tên đăng nhập"
              />
            </Form.Item>

            {!editingUser && (
              <Form.Item
                label={
                  <span className="font-medium text-gray-700">Mật khẩu</span>
                }
                name="password"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu!" },
                  { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự!" },
                ]}
              >
                <Input.Password
                  onChange={(e) => checkPasswordStrength(e.target.value)}
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                  placeholder="Nhập mật khẩu"
                />
              </Form.Item>
            )}

            {passwordStrength > 0 && !editingUser && (
              <div className="mb-4">
                <Progress
                  percent={passwordStrength}
                  status={
                    passwordStrength < 50
                      ? "exception"
                      : passwordStrength < 75
                      ? "normal"
                      : "success"
                  }
                  showInfo={false}
                  className="mb-2"
                />
                <span className="text-sm text-gray-500">
                  Độ mạnh mật khẩu:{" "}
                  {passwordStrength < 50
                    ? "Yếu"
                    : passwordStrength < 75
                    ? "Trung bình"
                    : "Mạnh"}
                </span>
              </div>
            )}

            {editingUser && (
              <Form.Item
                label={
                  <span className="font-medium text-gray-700">
                    Mật khẩu mới
                  </span>
                }
                name="password"
                rules={[
                  {
                    validator: (_, value) => {
                      if (value && value.length < 8) {
                        return Promise.reject(
                          new Error("Mật khẩu phải có ít nhất 8 ký tự!")
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input.Password
                  onChange={(e) => checkPasswordStrength(e.target.value)}
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                  placeholder="Để trống nếu không đổi"
                />
              </Form.Item>
            )}

            {passwordStrength > 0 &&
              editingUser &&
              form.getFieldValue("password") && (
                <div className="mb-4">
                  <Progress
                    percent={passwordStrength}
                    status={
                      passwordStrength < 50
                        ? "exception"
                        : passwordStrength < 75
                        ? "normal"
                        : "success"
                    }
                    showInfo={false}
                    className="mb-2"
                  />
                  <span className="text-sm text-gray-500">
                    Độ mạnh mật khẩu:{" "}
                    {passwordStrength < 50
                      ? "Yếu"
                      : passwordStrength < 75
                      ? "Trung bình"
                      : "Mạnh"}
                  </span>
                </div>
              )}

            <Form.Item
              label={<span className="font-medium text-gray-700">Họ tên</span>}
              name="full_name"
              rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
            >
              <Input placeholder="Nhập họ tên" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium text-gray-700">Email</span>}
              name="email"
              rules={[{ type: "email", message: "Email không hợp lệ!" }]}
            >
              <Input placeholder="Nhập email" />
            </Form.Item>

            <Form.Item
              label={
                <span className="font-medium text-gray-700">Số điện thoại</span>
              }
              name="phone"
              rules={[
                {
                  pattern: /^\d{10,11}$/,
                  message: "Số điện thoại phải có 10-11 số!",
                },
              ]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium text-gray-700">Quyền</span>}
              name="role_id"
              rules={[{ required: true, message: "Vui lòng chọn quyền!" }]}
            >
              <Select
                placeholder="Chọn quyền"
                showSearch
                optionFilterProp="children"
                dropdownStyle={{
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                {roles.map((r) => (
                  <Option key={r.id} value={r.id}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.role_id !== currentValues.role_id
              }
            >
              {({ getFieldValue }) => {
                const selectedRoleId = getFieldValue("role_id");
                const selectedRole = roles.find(
                  (r) => r.id === selectedRoleId
                );
                const isStudent =
                  selectedRole?.name?.toLowerCase() === "student";

                if (!isStudent) {
                  return null;
                }

                return (
                  <>
                    <Form.Item
                      label={
                        <span className="font-medium text-gray-700">
                          Khóa (Sinh viên)
                        </span>
                      }
                      name="cohort_id"
                    >
                      <Select
                        placeholder="Chọn Khóa (nếu là sinh viên)"
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        dropdownStyle={{
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      >
                        {cohorts.map((c) => (
                          <Option key={c.id} value={c.id}>
                            {c.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label={
                        <span className="font-medium text-gray-700">
                          Ngành (Sinh viên)
                        </span>
                      }
                      name="major_id"
                    >
                      <Select
                        placeholder="Chọn Ngành (nếu là sinh viên)"
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        dropdownStyle={{
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      >
                        {majors.map((m) => (
                          <Option key={m.id} value={m.id}>
                            {`${m.name} (${m.code})`}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </>
                );
              }}
            </Form.Item>

            <div className="flex justify-end gap-3 mt-8">
              <Button
                onClick={() => {
                  setFormVisible(false);
                  setEditingUser(null);
                  setPasswordStrength(0);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                // ✨ SỬA LỖI NÚT BẤM
                style={{
                  background: "#1677ff",
                  color: "#ffffff",
                  border: "none",
                }}
              >
                {editingUser ? "Cập nhật" : "Thêm"}
              </Button>
            </div>
          </Form>
        </Spin>
      </Modal>

      <Modal
        title="📥 Nhập danh sách người dùng"
        open={importVisible}
        onCancel={() => {
          setImportVisible(false);
          setImportFile(null);
        }}
        onOk={handleImport}
        okText="Nhập"
        confirmLoading={loading}
        // ✨ SỬA LỖI NÚT BẤM
        okButtonProps={{
          style: {
            background: "#1677ff",
            color: "#ffffff",
            border: "none",
          }
        }}
      >
        <Upload.Dragger {...uploadProps} style={{ marginBottom: 16 }}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            Nhấp hoặc kéo tệp vào khu vực này
          </p>
          <p className="ant-upload-hint">
            Chỉ hỗ trợ định dạng Excel (.xlsx, .xls)
          </p>
        </Upload.Dragger>

        <div>
          <p>
            <b>Hướng dẫn:</b>
          </p>
          <p>
            Các cột bắt buộc: <b>username</b>, <b>password</b>, <b>full_name</b>
            , <b>role</b> (tên role)
          </p>
          <p>
            Các cột tùy chọn: <b>email</b>, <b>phone</b>,{" "}
            <b>cohort_name</b> (vd: "Khóa 63"), <b>major_code</b> (vd: "KTE")
          </p>
        </div>
      </Modal>
    </Content>
  );
};

export default Users;