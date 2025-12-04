import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import materialsApi from "../api/MaterialsApi";

// --- Ant Design ---
// Thêm Input, Button để tùy chỉnh thanh tìm kiếm
import { Spin, message, Progress, Input, Button } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

// --- React PDF Viewer ---
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { toolbarPlugin } from "@react-pdf-viewer/toolbar";
import { searchPlugin } from "@react-pdf-viewer/search";
import { thumbnailPlugin } from "@react-pdf-viewer/thumbnail";

// --- CSS cho các plugin ---
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/toolbar/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";
import "@react-pdf-viewer/thumbnail/lib/styles/index.css";

// --- Tiện ích ---
import { hasPermission, PERMISSIONS } from "../utils/permissions";

// Hằng số cho PDF Worker
const PDF_WORKER_URL =
  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

const MaterialViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const isAdmin = user?.role?.name?.toLowerCase() === "admin";
  const canView = hasPermission(user, PERMISSIONS.VIEW_MATERIALS);

  // === Khởi tạo các plugin ===
  
  // 1. Khởi tạo Toolbar (Quan trọng: KHÔNG truyền 'renderToolbar' vào)
  const toolbarPluginInstance = toolbarPlugin();
  const { Toolbar } = toolbarPluginInstance; // Lấy component Toolbar

  // 2. Khởi tạo Search
  const searchPluginInstance = searchPlugin({
    onHighlight: (props) => {
      props.highlightEle.style.outline = "2px dashed red";
      props.highlightEle.style.backgroundColor = "rgba(255, 255, 0, 0.2)";
    },
  });
  const { Search } = searchPluginInstance; // Lấy component Search (dạng render prop)

  // 3. Khởi tạo Thumbnail
  const thumbnailPluginInstance = thumbnailPlugin();
  const { Thumbnails } = thumbnailPluginInstance; // Lấy component Thumbnails

  // === Fetch thông tin tài liệu ===
  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const res = await materialsApi.getById(id);
        const data = res?.data || res;
        if (!data || !data.id) {
          message.warning("⚠️ Tài liệu không tồn tại hoặc đã bị xoá.");
          navigate(-1);
          return;
        }
        setMaterial(data);
      } catch (err) {
        console.error("Lỗi lấy tài liệu:", err);
        message.error("Không thể tải thông tin tài liệu.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterial();
  }, [id, navigate]);

  // === Fetch PDF file ===
  useEffect(() => {
    const fetchPdfBlob = async () => {
      try {
        setFileLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) {
          message.error("Bạn chưa đăng nhập hoặc phiên đã hết hạn.");
          navigate("/login");
          return;
        }

        const fileUrl = material.file_url.startsWith("http")
          ? material.file_url
          : `http://thuvien.cs2.ftu.edu.vn:3000/${material.file_url.replace(
              /^\/+/,
              ""
            )}`;

        const response = await fetch(fileUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
        });

        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
        const contentType = response.headers.get("Content-Type");
        if (!contentType.includes("application/pdf")) {
          throw new Error(`Invalid content type: ${contentType}`);
        }

        const contentLength = +response.headers.get("Content-Length");
        const reader = response.body.getReader();
        let receivedLength = 0;
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedLength += value.length;
          if (contentLength > 0) {
            setProgress(Math.round((receivedLength / contentLength) * 100));
          }
        }

        const fileBlob = new Blob(chunks, { type: "application/pdf" });
        const fileUrlBlob = URL.createObjectURL(fileBlob);
        setPdfBlobUrl(fileUrlBlob);
        setFileLoading(false);
      } catch (err) {
        console.error("Lỗi tải PDF:", err.message);
        message.error(
          "Không thể tải tài liệu PDF. Vui lòng kiểm tra file hoặc kết nối."
        );
        setFileLoading(false);
      }
    };
    if (material?.file_url) fetchPdfBlob();
  }, [material?.file_url, id, navigate]);

  // === Fix Memory Leak: Thu hồi Blob URL khi component unmount ===
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // === Ngăn in/sao chép cho non-admin ===
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isAdmin && (e.ctrlKey || e.metaKey)) {
        const key = e.key.toLowerCase();
        if (["s", "p", "c"].includes(key)) {
          e.preventDefault();
          message.warning("Không được phép thực hiện thao tác này!");
        }
      }
    };
    const handleContextMenu = (e) => {
      if (!isAdmin) e.preventDefault();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isAdmin]);

  // === Các trạng thái loading/permission ===
  if (!canView)
    return (
      <div style={{ paddingTop: 100, textAlign: "center", color: "#888" }}>
        Bạn không có quyền truy cập tài liệu này.
      </div>
    );

  if (loading)
    return (
      <div style={{ paddingTop: 100, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );

  if (!material?.file_url)
    return (
      <div style={{ textAlign: "center", marginTop: 100, color: "#888" }}>
        Tài liệu này không có file đính kèm để xem.
      </div>
    );

  // Style ngăn bôi đen văn bản
  const protectionStyles = !isAdmin
    ? {
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }
    : {};

  // === Giao diện PDF Viewer ===
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#f4f4f4",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...protectionStyles,
      }}
    >
      {/* Toolbar cố định */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderBottom: "1px solid #ddd",
          padding: "8px 0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        {/* Quan trọng: Dùng component <Toolbar> và tự định nghĩa layout bên trong */}
        <Toolbar>
          {(props) => {
            // props này tự động chứa nút của mọi plugin (Zoom, Rotate, ShowThumbnails...)
            const {
              GoToPreviousPage,
              GoToNextPage,
              PageIndicator,
              ZoomOut,
              ZoomIn,
              RotateClockwise,
              RotateCounterClockwise,
              FullScreen,
              Print,
              Download,
              ShowThumbnails, // Nút này từ thumbnailPlugin
            } = props;

            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {/* Sửa lỗi: Dùng {ShowThumbnails} (biến) */}
                {ShowThumbnails}
                {GoToPreviousPage}
                {PageIndicator}
                {GoToNextPage}
                <div style={{ padding: "0 10px" }} />
                {ZoomOut}
                {ZoomIn}
                <div style={{ padding: "0 10px" }} />
                {RotateCounterClockwise}
                {RotateClockwise}
                <div style={{ padding: "0 10px" }} />
                {FullScreen}
                <div style={{ padding: "0 10px" }} />

                {/* Sửa lỗi: Dùng render prop cho Search */}
                <Search>
                  {(renderProps) => (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Input
                        placeholder="Tìm kiếm tài liệu..."
                        value={renderProps.keyword}
                        onChange={(e) => renderProps.setKeyword(e.target.value)}
                        onPressEnter={() => renderProps.search()}
                        style={{ width: 180 }}
                        size="small"
                      />
                      <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        onClick={renderProps.jumpToPreviousMatch}
                        disabled={!renderProps.keyword}
                      />
                      <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        onClick={renderProps.jumpToNextMatch}
                        disabled={!renderProps.keyword}
                      />
                    </div>
                  )}
                </Search>

                {/* Nút cho Admin */}
                {isAdmin && (
                  <>
                    <div style={{ padding: "0 10px" }} />
                    {Download}
                    {Print}
                  </>
                )}
              </div>
            );
          }}
        </Toolbar>
      </div>

      {/* PDF Viewer và Sidebar */}
      <div
        style={{
          flex: 1,
          marginTop: 60, // Chừa chỗ cho toolbar
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Sidebar cho Thumbnails */}
        <div
          style={{
            width: "240px",
            borderRight: "1px solid #ddd",
            background: "#fafafa",
            overflow: "auto",
          }}
        >
          {/* Component <Thumbnails /> */}
          <Thumbnails />
        </div>

        {/* Trình xem chính */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "auto",
          }}
        >
          {/* Lớp loading file */}
          {fileLoading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.8)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#333",
                zIndex: 10,
              }}
            >
              <Spin tip="Đang tải tài liệu..." size="large" />
              {progress > 0 && (
                <div style={{ marginTop: 20, width: "40%" }}>
                  <Progress percent={progress} status="active" />
                </div>
              )}
            </div>
          )}

          {/* Viewer */}
          {pdfBlobUrl && (
            <Worker workerUrl={PDF_WORKER_URL}>
              <Viewer
                fileUrl={pdfBlobUrl}
                defaultScale={1.0} // Giữ 100% theo yêu cầu
                onDocumentLoadFailure={(e) => {
                  console.error("PDF Load error:", e.message);
                  message.error("Không thể tải tài liệu PDF.");
                }}
                // Quan trọng: Truyền TẤT CẢ các plugin vào đây
                plugins={[
                  toolbarPluginInstance,
                  searchPluginInstance,
                  thumbnailPluginInstance,
                ]}
              />
            </Worker>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialViewer;