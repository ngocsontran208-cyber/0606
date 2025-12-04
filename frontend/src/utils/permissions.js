// ===== ROLE DEFINITIONS =====
export const ROLE_ADMIN = "admin";
export const ROLE_MANAGER = "manager";
export const ROLE_USER = "user";
export const ROLE_LIBRARIAN = "librarian";
export const ROLE_LECTURER = "lecturer";
export const ROLE_STUDENT = "student";

// ===== GLOBAL ROLE CHECKER =====
const hasRole = (userRole, allowedRoles) => {
  if (!userRole) return false;

  // Nếu userRole là object, lấy name
  const roleName =
    typeof userRole === "string" ? userRole : userRole.name || "";

  if (!roleName) return false;

  return allowedRoles.includes(roleName.toLowerCase());
};

// ===== PERMISSION KEYS =====
export const PERMISSIONS = {
  VIEW_ALL: "VIEW_ALL",
  MANAGE_USERS: "MANAGE_USERS",
  VIEW_MATERIALS: "VIEW_MATERIALS",
  VIEW_REPORTS: "VIEW_REPORTS",
  VIEW_BASIC: "VIEW_BASIC",
  DOWNLOAD: "DOWNLOAD",
  PRINT: "PRINT",

  // Permissions for supplementary materials
  EDIT_SUPPLEMENTARY: "EDIT_SUPPLEMENTARY",
  EXPORT_SUPPLEMENTARY: "EXPORT_SUPPLEMENTARY",
};

// ===== PERMISSIONS MAPPING BY ROLE =====
const permissionsByRole = {
  [ROLE_ADMIN]: [
    PERMISSIONS.VIEW_ALL,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_MATERIALS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.DOWNLOAD,
    PERMISSIONS.PRINT,
    PERMISSIONS.EDIT_SUPPLEMENTARY,
    PERMISSIONS.EXPORT_SUPPLEMENTARY,
  ],

  [ROLE_MANAGER]: [
    PERMISSIONS.VIEW_ALL,
    PERMISSIONS.VIEW_MATERIALS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.DOWNLOAD,
    PERMISSIONS.EDIT_SUPPLEMENTARY,
    PERMISSIONS.EXPORT_SUPPLEMENTARY,
  ],

  [ROLE_LIBRARIAN]: [
    PERMISSIONS.VIEW_ALL,
    PERMISSIONS.VIEW_MATERIALS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.DOWNLOAD,
  ],

  [ROLE_LECTURER]: [PERMISSIONS.VIEW_MATERIALS],

  [ROLE_STUDENT]: [PERMISSIONS.VIEW_MATERIALS, PERMISSIONS.VIEW_BASIC],

  [ROLE_USER]: [PERMISSIONS.VIEW_BASIC],
};

// ===== PERMISSION CHECKER =====
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;

  const roleName = typeof user.role === "string" ? user.role : user.role.name || "";
  if (!roleName) return false;

  const rolePermissions = permissionsByRole[roleName.toLowerCase()] || [];
  return rolePermissions.includes(permission);
};

// ===== DIRECT FEATURE CHECKERS (OPTIONAL) =====
export const CAN_EDIT_SUPPLEMENTARY = (userRole) =>
  hasRole(userRole, [ROLE_ADMIN, ROLE_MANAGER]);

export const CAN_EXPORT_SUPPLEMENTARY = (userRole) =>
  hasRole(userRole, [ROLE_ADMIN, ROLE_MANAGER]);

export const CAN_MANAGE_USERS = (userRole) =>
  hasRole(userRole, [ROLE_ADMIN]);

export const CAN_VIEW_REPORTS = (userRole) =>
  hasRole(userRole, [ROLE_ADMIN, ROLE_MANAGER, ROLE_USER]);
