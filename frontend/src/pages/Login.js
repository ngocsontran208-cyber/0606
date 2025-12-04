import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { Form, Input, Button, Card, Typography, Checkbox, Alert } from "antd";
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  let timeoutId = null; 
  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", values, {
        timeout: 10000,
      });
      const { token, user } = res.data;

      if (token && user) {
        localStorage.setItem("accessToken", token);
        const { role, email, ...safeUser } = user;
        localStorage.setItem("user", JSON.stringify(safeUser));

        login(user, token);

        toast.success("Đăng nhập thành công!", { autoClose: 1000 });
        setTimeout(() => {
          navigate("/");
        }, 1000);

        timeoutId = setTimeout(() => {
          toast.info("Phiên đăng nhập đã hết hạn!");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          navigate("/login");
        }, 2 * 60 * 60 * 1000);
      } else {
        toast.error("Thông tin đăng nhập không hợp lệ!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể kết nối tới server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f4f6f8 0%, #e0e4e8 100%)",
        paddingTop: "8vh",
        transition: "background 0.3s ease",
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          padding: "40px 24px",
          textAlign: "center", // Giữ lại text-align cho nội dung khác
          background: "#fff",
        }}
      >
        <div 
          style={{ 
            marginBottom: 24, 
            display: 'flex',          // ✨ THÊM: Sử dụng flexbox
            justifyContent: 'center', // ✨ THÊM: Căn giữa theo chiều ngang
            alignItems: 'center'      // ✨ THÊM: Căn giữa theo chiều dọc (nếu có chiều cao)
          }}
        >
          <img
            src="/logo/FTU-logo.png"
            alt="FTU Logo"
            style={{ width: 72, height: 72, objectFit: "contain" }}
            onError={(e) => (e.target.src = "/logo/fallback-logo.png")}
          />
        </div>

        <Title level={3} style={{ marginBottom: 8, color: "#B22222" }}>
          Đăng nhập
        </Title>
        <Text style={{ display: "block", marginBottom: 32, color: "#666" }}>
          Phân hệ quản lý tài nguyên khóa học
        </Text>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          initialValues={{ remember: true }}
        >
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[
              { required: true, message: "Vui lòng nhập tên đăng nhập!" },
              { min: 3, message: "Tên đăng nhập phải có ít nhất 3 ký tự!" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Tên đăng nhập"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox style={{ marginBottom: 16 }}>Ghi nhớ đăng nhập</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ backgroundColor: "#B22222", borderColor: "#B22222" }}
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </Form.Item>
        </Form>
        
        <Alert
          message={
            <span style={{ fontSize: '13px' }}>
              <b>Lưu ý cho sinh viên:</b> Tài khoản và mật khẩu đăng nhập lần đầu
              đều là <b>Mã số sinh viên</b>. Vui lòng thay đổi mật khẩu sau khi
              đăng nhập.
            </span>
          }
          type="info"
          showIcon
          style={{ marginTop: 24, textAlign: 'left' }}
        />
      </Card>
    </div>
  );
};

export default Login;