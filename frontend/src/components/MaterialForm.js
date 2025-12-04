import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Divider,
  Row,
  Col,
  Progress,
  Tooltip,
  Popconfirm,
  AutoComplete,
  Spin,
  Space,
  notification,
} from "antd";
import { v4 as uuidv4 } from "uuid";
import { uploadFile } from "../api/uploadApi";
import materialsApi from "../api/MaterialsApi";
import { InfoCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import debounce from "lodash/debounce";

const { Option } = Select;
const { TextArea } = Input;

const MaterialForm = ({
  initialValues = {},
  selectedCourse = null,
  onSubmit = () => {},
  onCancel = () => {},
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [uploadPercent, setUploadPercent] = useState(0);
  const [fileUploading, setFileUploading] = useState(null);
  const [formDirty, setFormDirty] = useState(false);
  const [authorOptions, setAuthorOptions] = useState([]);

  useEffect(() => {
    const savedAuthors = JSON.parse(localStorage.getItem("savedAuthors") || "[]");
    setAuthorOptions(
      savedAuthors.map((author) => ({
        value: author,
        label: author,
      }))
    );
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      ...initialValues,
      type: Array.isArray(initialValues?.type)
        ? initialValues.type
        : typeof initialValues?.type === "string"
        ? initialValues.type.split(",").map((item) => item.trim()).filter(Boolean)
        : [],
      file_url: initialValues?.file_url || "",
      year: initialValues?.year || new Date().getFullYear(),
    });
  }, [initialValues, form]);

  const handleValuesChange = () => {
    setFormDirty(true);
  };

  const debouncedUpload = useCallback(
    debounce(async (file) => {
      const ext = file.name.split(".").pop();
      const newFileName = `${uuidv4()}.${ext}`;
      const renamedFile = new File([file], newFileName, { type: file.type });

      setFileUploading(true);
      try {
        const res = await uploadFile(renamedFile, setUploadPercent);
        form.setFieldsValue({ file_url: res.path });
        setFileUploading(newFileName);
        notification.success({
          message: "Tải file thành công!",
          description: "File đã được upload lên hệ thống.",
        });
      } catch (err) {
        notification.error({
          message: "Tải file thất bại!",
          description: "Vui lòng thử lại sau.",
        });
      } finally {
        setFileUploading(false);
        setTimeout(() => setUploadPercent(0), 1000);
      }
    }, 500),
    [form]
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      notification.warning({
        message: "Định dạng file không hợp lệ!",
        description: "Chỉ chấp nhận file PDF hoặc DOC/DOCX.",
      });
      return;
    }

    debouncedUpload(file);
  };

  const handleRemoveFile = () => {
    form.setFieldsValue({ file_url: "" });
    setFormDirty(true);
    setFileUploading(null);
    notification.info({
      message: "Đã xóa file!",
      description: "Bạn có thể upload file mới nếu cần.",
    });
  };

  const handleAuthorSelect = (value) => {
    const savedAuthors = JSON.parse(localStorage.getItem("savedAuthors") || "[]");
    if (!savedAuthors.includes(value) && value) {
      savedAuthors.push(value);
      localStorage.setItem("savedAuthors", JSON.stringify(savedAuthors));
      setAuthorOptions(
        savedAuthors.map((author) => ({
          value: author,
          label: author,
        }))
      );
    }
  };

  const handleSubmit = async (values) => {
    const payload = {
      ...values,
      type: Array.isArray(values.type) ? values.type.join(",") : values.type,
      course_id: selectedCourse,
    };

    try {
      let response;
      if (payload.id) {
        response = await materialsApi.update(payload.id, payload);
        notification.success({
          message: "Cập nhật tài liệu thành công!",
          description: "Tài liệu đã được cập nhật trên hệ thống.",
        });
      } else {
        response = await materialsApi.create(payload);
        notification.success({
          message: "Tạo tài liệu mới thành công!",
          description: "Tài liệu đã được thêm vào hệ thống.",
        });
      }

      setFormDirty(false);
      onSubmit?.(response);
      onCancel?.();
    } catch (error) {
      if (error.response) {
        notification.error({
          message: "Lỗi từ máy chủ!",
          description: error.response.data.message || "Đã có lỗi xảy ra.",
        });
      } else {
        notification.error({
          message: "Không kết nối được tới server!",
          description: "Vui lòng kiểm tra kết nối và thử lại.",
        });
      }
    }
  };

  const typeOptions = useMemo(
    () => [
      { value: "Sách giấy", label: "Sách giấy" },
      { value: "Sách điện tử", label: "Sách điện tử" },
      { value: "Website", label: "Website" },
      { value: "Tạp chí", label: "Tạp chí" },
    ],
    []
  );

  const functionOptions = useMemo(
    () => [
      { value: "Giáo trình", label: "Giáo trình" },
      { value: "Tham khảo bắt buộc", label: "Tham khảo bắt buộc" },
      { value: "Tham khảo tự chọn", label: "Tham khảo tự chọn" },
    ],
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: "16px", background: "#fff", borderRadius: 8 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFinishFailed={({ errorFields }) => {
          notification.error({
            message: "Vui lòng kiểm tra lại!",
            description: "Có một số trường bắt buộc chưa được điền.",
          });
        }}
        onValuesChange={handleValuesChange}
        validateTrigger="onChange"
      >
        <Divider orientation="left">Thông tin cơ bản</Divider>
        <Form.Item
          name="title"
          label="Tên tài liệu"
          rules={[{ required: true, message: "Vui lòng nhập tên tài liệu!" }]}
        >
          <Input placeholder="Nhập tên tài liệu" />
        </Form.Item>

        <Form.Item
          name="type"
          label="Loại tài liệu"
          rules={[{ required: true, message: "Vui lòng chọn loại tài liệu!" }]}
        >
          <Select
            mode="multiple"
            placeholder="Chọn loại tài liệu"
            allowClear
            options={typeOptions}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="author"
              label="Tác giả"
              rules={[{ required: true, message: "Vui lòng nhập tên tác giả!" }]}
            >
              <AutoComplete
                options={authorOptions}
                onSelect={handleAuthorSelect}
                placeholder="Nhập tên tác giả"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="publisher" label="Nhà xuất bản">
              <Input placeholder="Nhập tên nhà xuất bản (nếu có)" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="year"
          label="Năm xuất bản"
          rules={[
            { required: true, message: "Vui lòng nhập năm xuất bản!" },
            {
              type: "number",
              min: 1900,
              max: new Date().getFullYear(),
              message: "Năm xuất bản không hợp lệ!",
            },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            step={1}
            placeholder="Nhập năm xuất bản"
          />
        </Form.Item>

        <Divider orientation="left">Thông tin bổ sung</Divider>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="opac_link"
              label={
                <span>
                  Link OPAC
                  <Tooltip title="Link dẫn đến tài liệu trong hệ thống thư viện (nếu có)">
                    <InfoCircleOutlined />
                  </Tooltip>
                </span>
              }
              rules={[
                {
                  type: "url",
                  message: "Vui lòng nhập link hợp lệ!",
                  when: (value) => !!value,
                },
              ]}
            >
              <Input placeholder="Nhập link OPAC (nếu có)" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item
              name="dkcb_code"
              label={
                <span>
                  Mã ĐKCB
                  <Tooltip title="Mã định danh duy nhất của tài liệu trong thư viện (nếu có)">
                    <InfoCircleOutlined />
                  </Tooltip>
                </span>
              }
            >
              <Input placeholder="Nhập mã (nếu có)" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="quantity" label="Số lượng">
              <InputNumber
                min={1}
                style={{ width: "100%" }}
                placeholder="Nhập số lượng"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="function"
          label="Chức năng tài liệu"
          rules={[{ required: true, message: "Vui lòng chọn chức năng tài liệu!" }]}
        >
          <Select placeholder="Chọn chức năng tài liệu" options={functionOptions} />
        </Form.Item>

        <Form.Item name="notes" label="Ghi chú">
          <TextArea
            rows={3}
            maxLength={500}
            showCount
            placeholder="Nhập ghi chú (tối đa 500 ký tự)"
          />
        </Form.Item>

        <Divider orientation="left">Tệp đính kèm</Divider>
        <Form.Item label="Tệp đính kèm">
          <Spin spinning={fileUploading}>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              disabled={fileUploading}
            />
            <div style={{ marginTop: 8, color: "#888", fontSize: 12 }}>
              Định dạng được chấp nhận: PDF, DOC, DOCX
            </div>
            {fileUploading && (
              <Progress
                percent={uploadPercent}
                status={fileUploading ? "active" : "success"}
                showInfo={true}
                strokeColor="#1677ff"
                style={{ marginTop: 8 }}
              />
            )}
          </Spin>
        </Form.Item>

        <Form.Item shouldUpdate>
          {() => {
            const url = form.getFieldValue("file_url");
            return url ? (
              <Space style={{ marginBottom: "1rem" }}>
                📎
                <a href={url} target="_blank" rel="noreferrer">
                  Xem file đã upload
                </a>
                <Button
                  type="link"
                  icon={<DeleteOutlined />}
                  onClick={handleRemoveFile}
                  danger
                >
                  Xóa
                </Button>
              </Space>
            ) : null;
          }}
        </Form.Item>

        <Form.Item name="file_url" noStyle>
          <Input type="hidden" />
        </Form.Item>

        <Form.Item name="id" noStyle>
          <Input type="hidden" />
        </Form.Item>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: 16 }}>
          <Popconfirm
            title="Bạn có chắc muốn hủy? Dữ liệu đã nhập sẽ không được lưu."
            onConfirm={onCancel}
            okText="Hủy"
            cancelText="Không"
            disabled={!formDirty}
          >
            <Button disabled={!formDirty}>Hủy</Button>
          </Popconfirm>
          <Button
            type="primary"
            htmlType="submit"
            loading={fileUploading || loading}
            // ✨ SỬA LỖI NÚT BẤM
            style={{
              background: "#1677ff",
              color: "#ffffff",
              border: "none"
            }}
          >
            {initialValues?.id ? "Cập nhật" : "Lưu"}
          </Button>
        </div>
      </Form>
    </motion.div>
  );
};

export default MaterialForm;