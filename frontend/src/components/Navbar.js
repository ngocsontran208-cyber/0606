import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
} from "@mui/material";
import {
  MenuBook as MenuBookIcon,
  Description as DescriptionIcon,
  LibraryBooks as LibraryBooksIcon,
  ExitToApp as ExitToAppIcon,
  AccountCircle as AccountCircleIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  BarChart as BarChartIcon,
  CloudUpload as CloudUploadIcon,
  Menu as MenuIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

// Icon riêng cho SupplementaryMaterialsPage
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";

import { AuthContext } from "../context/AuthContext";
import { message } from "antd";
import { hasPermission, PERMISSIONS } from "../utils/permissions";

message.config({
  top: 70,
  duration: 3,
  maxCount: 3,
});

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElMgmt, setAnchorElMgmt] = useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };
  const handleOpenMgmtMenu = (event) => {
    setAnchorElMgmt(event.currentTarget);
  };
  const handleCloseMgmtMenu = () => {
    setAnchorElMgmt(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    message.success("Đăng xuất thành công!");
    handleCloseNavMenu();
    handleCloseMgmtMenu();
  };

  const role = user?.role?.name?.toLowerCase();
  const isBasicRole = role === "lecturer" || role === "student";

  // ===== Main nav items (Desktop) =====
  let mainNavItems = [
    { label: "Trang chủ", path: "/", icon: <LibraryBooksIcon fontSize="small" /> },
  ];

  let managementNavItems = [];

  if (!isBasicRole) {
    // Thêm menu chính
    mainNavItems.push(
      {
        label: "Đề Cương",
        path: "/curriculums",
        icon: <DescriptionIcon fontSize="small" />,
        permission: PERMISSIONS.VIEW_ALL,
      },
      {
        label: "Ngành",
        path: "/majors",
        icon: <SchoolIcon fontSize="small" />,
        permission: PERMISSIONS.VIEW_ALL,
      },
      {
        label: "Môn Học",
        path: "/courses",
        icon: <MenuBookIcon fontSize="small" />,
        permission: PERMISSIONS.VIEW_ALL,
      },
      {
        label: "Tài Liệu",
        path: "/materials",
        icon: <LibraryBooksIcon fontSize="small" />,
        permission: PERMISSIONS.VIEW_MATERIALS,
      }
    );

    // Menu quản lý
    if (hasPermission(user, PERMISSIONS.VIEW_REPORTS)) {
      managementNavItems.push({
        label: "Báo Cáo",
        path: "/reports",
        icon: <BarChartIcon fontSize="small" />,
        permission: PERMISSIONS.VIEW_REPORTS,
      });
    }

    if (role === "admin" || role === "manager") {
      if (role === "admin") {
        managementNavItems.push(
          {
            label: "Quản lý người dùng",
            path: "/create-user",
            icon: <AdminPanelSettingsIcon fontSize="small" />,
            permission: PERMISSIONS.MANAGE_USERS,
          },
          {
            label: "Quản lý Khóa",
            path: "/manage-cohorts",
            icon: <SchoolIcon fontSize="small" />,
            permission: PERMISSIONS.MANAGE_USERS,
          },
          {
            label: "Quản lý tệp",
            path: "/file-management",
            icon: <CloudUploadIcon fontSize="small" />,
            permission: null, // admin luôn thấy
          }
        );
      }

      // Thêm Tài Liệu Bổ Sung
      if (hasPermission(user, PERMISSIONS.EDIT_SUPPLEMENTARY)) {
        managementNavItems.push({
          label: "Tài Liệu Bổ Sung",
          path: "/supplementary",
          icon: <LibraryBooksOutlinedIcon fontSize="small" />,
          permission: PERMISSIONS.EDIT_SUPPLEMENTARY,
        });
      }
    }

    // Lọc theo permission
    mainNavItems = mainNavItems.filter(
      (item) => !item.permission || hasPermission(user, item.permission)
    );
    managementNavItems = managementNavItems.filter(
      (item) => !item.permission || hasPermission(user, item.permission)
    );
  }

  const allNavItemsForMobile = [...mainNavItems, ...managementNavItems];

  return (
    <AppBar position="static" sx={{ bgcolor: "#B22222" }}>
      <Toolbar>
        {/* Desktop title */}
        <Typography
          variant="h8"
          noWrap
          component={Link}
          to="/"
          sx={{
            mr: 2,
            display: { xs: "none", md: "flex" },
            fontWeight: 300,
            color: "inherit",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          PHÂN HỆ QUẢN LÝ TÀI NGUYÊN KHÓA HỌC
        </Typography>

        {/* Mobile menu */}
        <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
          <IconButton
            size="large"
            aria-label="navigation menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleOpenNavMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorElNav}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            keepMounted
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
            sx={{ display: { xs: "block", md: "none" } }}
          >
            {allNavItemsForMobile.map((item) => (
              <MenuItem
                key={item.path}
                onClick={handleCloseNavMenu}
                component={Link}
                to={item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <Typography textAlign="center">{item.label}</Typography>
              </MenuItem>
            ))}
            {user && <Divider />}
            {user && (
              <MenuItem onClick={handleCloseNavMenu} component={Link} to="/profile">
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                {user.full_name || user.username}
              </MenuItem>
            )}
            {user && (
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToAppIcon fontSize="small" />
                </ListItemIcon>
                Đăng Xuất
              </MenuItem>
            )}
          </Menu>
        </Box>

        {/* Mobile title */}
        <Typography
          variant="h6"
          noWrap
          component={Link}
          to="/"
          sx={{
            mr: 2,
            display: { xs: "flex", md: "none" },
            flexGrow: 1,
            fontWeight: 700,
            color: "inherit",
            textDecoration: "none",
            justifyContent: "center",
          }}
        >
          QUẢN LÝ TÀI NGUYÊN
        </Typography>

        {/* Desktop main menu */}
        <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, gap: 1 }}>
          {mainNavItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              component={Link}
              to={item.path}
              sx={{ textTransform: "none", color: "white" }}
            >
              {item.label}
            </Button>
          ))}

          {/* Desktop management dropdown */}
          {managementNavItems.length > 0 && (
            <>
              <Button
                color="inherit"
                startIcon={<SettingsIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                onClick={handleOpenMgmtMenu}
                sx={{ textTransform: "none", color: "white" }}
              >
                Quản lý
              </Button>
              <Menu
                anchorEl={anchorElMgmt}
                open={Boolean(anchorElMgmt)}
                onClose={handleCloseMgmtMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                {managementNavItems.map((item) => (
                  <MenuItem
                    key={item.path}
                    onClick={handleCloseMgmtMenu}
                    component={Link}
                    to={item.path}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>

        {/* User buttons Desktop */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
          {user ? (
            <>
              <Button
                color="inherit"
                startIcon={<AccountCircleIcon fontSize="small" />}
                component={Link}
                to="/profile"
                sx={{ textTransform: "none" }}
              >
                {user.full_name || user.username}
              </Button>
              <Button
                color="error"
                variant="contained"
                startIcon={<ExitToAppIcon fontSize="small" />}
                onClick={handleLogout}
              >
                Đăng Xuất
              </Button>
            </>
          ) : (
            <Button color="success" variant="contained" component={Link} to="/login">
              Đăng Nhập
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
