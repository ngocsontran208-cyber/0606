import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { fetchUserProfile, updateProfile, updatePassword } from "../api/userApi";
import { Card, Typography, Button, Form, Input, message, Spin, Divider, Avatar } from "antd";
import { UserOutlined, SaveOutlined, CloseOutlined, LockOutlined } from "@ant-design/icons";
import { Box } from "@mui/material";

const { Title, Text } = Typography;

const Profile = () => {
  const { token, user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  // Tải thông tin người dùng
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        message.error("Vui lòng đăng nhập để xem thông tin!");
        setFetching(false);
        return;
      }

      try {
        setFetching(true);
        const userData = await fetchUserProfile(token);
        const actualUser = userData?.user || userData;

        if (!actualUser) {
          throw new Error("Dữ liệu người dùng không hợp lệ");
        }

        // Chỉ cập nhật nếu dữ liệu khác
        setUser((prevUser) => {
          if (JSON.stringify(prevUser) !== JSON.stringify(actualUser)) {
            return actualUser;
          }
          return prevUser;
        });

        form.setFieldsValue({
          full_name: actualUser.full_name || "",
          phone: actualUser.phone || "",
          email: actualUser.email || "",
        });
      } catch (err) {
        message.error(err.message || "Không thể tải thông tin cá nhân!");
      } finally {
        setFetching(false);
      }
    };

    loadUser();
  }, [token, form]); // Loại bỏ user, setUser khỏi dependency

  // Xử lý submit form
  const onFinish = async (values) => {
    const { current_password, new_password, confirm_password, ...profileData } = values;

    // Kiểm tra mật khẩu mới
    if (new_password) {
      if (new_password !== confirm_password) {
        message.error("Xác nhận mật khẩu không khớp!");
        return;
      }
      if (new_password.length < 8) {
        message.error("Mật khẩu mới phải có ít nhất 8 ký tự!");
        return;
      }
    }

    // So sánh dữ liệu để tránh gửi API không cần thiết
    const currentData = form.getFieldsValue(["full_name", "phone", "email"]);
    const hasProfileChanges = Object.keys(profileData).some(
      (key) => profileData[key] !== currentData[key]
    );

    if (!hasProfileChanges && !new_password) {
      message.info("Không có thay đổi để lưu!");
      setEditing(false);
      return;
    }

    try {
      setLoading(true);

      if (new_password) {
        await updatePassword(token, { current_password, new_password });
        message.success("Đổi mật khẩu thành công!");
      }

      if (hasProfileChanges) {
        const updated = await updateProfile(token, profileData);
        const updatedUser = updated?.user || updated;

        if (!updatedUser) {
          throw new Error("Dữ liệu cập nhật không hợp lệ");
        }

        setUser(updatedUser);
        form.setFieldsValue({
          full_name: updatedUser.full_name,
          phone: updatedUser.phone,
          email: updatedUser.email,
        });
        message.success("Cập nhật thông tin thành công!");
      }

      setEditing(false);
    } catch (err) {
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận hủy chỉnh sửa
  const handleCancel = () => {
    if (form.isFieldsTouched()) {
      if (window.confirm("Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.")) {
        form.resetFields();
        setEditing(false);
      }
    } else {
      setEditing(false);
    }
  };

  if (fetching) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  return (
    <Card
      style={{ maxWidth: 600, margin: "24px auto", padding: 24, borderRadius: 8 }}
      hoverable
    >
      <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
        Thông Tin Cá Nhân
      </Title>

      <Box style={{ textAlign: "center", marginBottom: 24 }}>
        <Avatar
          size={80}
          icon={<UserOutlined />}
          style={{ backgroundColor: "#B22222" }}
        />
      </Box>

      {!editing ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Họ tên: </Text>
            {user?.full_name || <Text type="secondary">Chưa có</Text>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Số điện thoại: </Text>
            {user?.phone || <Text type="secondary">Chưa có</Text>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Email: </Text>
            {user?.email || <Text type="secondary">Chưa có</Text>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Vai trò: </Text>
            {user?.role?.name || <Text type="secondary">Chưa rõ</Text>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Cập nhật lần cuối: </Text>
            {user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : <Text type="secondary">Chưa có</Text>}
          </div>

          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => setEditing(true)}
            block
            // ✨ SỬA LỖI NÚT BẤM
            style={{ 
              marginTop: 16,
              background: "#1677ff",
              color: "#ffffff",
              border: "none"
            }}
          >
            Chỉnh sửa hồ sơ
          </Button>
        </>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            full_name: user?.full_name || "",
            phone: user?.phone || "",
            email: user?.email || "",
          }}
        >
          <Form.Item
            label="Họ tên"
            name="full_name"
            rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              {
                pattern: /^[0-9]{10,11}$/,
                message: "Số điện thoại phải có 10-11 chữ số!",
              },
            ]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: "email", message: "Email không hợp lệ!" }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>

          <Divider orientation="left">Đổi mật khẩu (tùy chọn)</Divider>

          <Form.Item label="Mật khẩu hiện tại" name="current_password">
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu hiện tại" />
          </Form.Item>
          <Form.Item
            label="Mật khẩu mới"
            name="new_password"
            rules={[
              {
                min: 8,
                message: "Mật khẩu mới phải có ít nhất 8 ký tự!",
              },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" />
          </Form.Item>
          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirm_password"
            dependencies={["new_password"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Xác nhận mật khẩu không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu mới" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              block
              // ✨ SỬA LỖI NÚT BẤM
              style={{
                background: "#1677ff",
                color: "#ffffff",
                border: "none"
              }}
            >
              Lưu thay đổi
            </Button>
            <Button
              onClick={handleCancel}
              icon={<CloseOutlined />}
              block
              style={{ marginTop: 10 }}
            >
              Hủy
            </Button>
          </Form.Item>
        </Form>
      )}
    </Card>
  );
};

export default Profile;