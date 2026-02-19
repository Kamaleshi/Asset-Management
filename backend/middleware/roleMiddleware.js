// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  MANAGER: 3,
  EMPLOYEE: 2,
  AUDITOR: 1,
};

/**
 * Middleware to check if user has required role
 * @param {string|string[]} allowedRoles - Single role or array of roles
 * @returns {Function} Express middleware
 */
export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    // Convert single role to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Check if user role is in allowed roles
    if (roles.includes(userRole)) {
      return next();
    }
    
    // SUPER_ADMIN has access to everything
    if (userRole === "SUPER_ADMIN") {
      return next();
    }
    
    return res.status(403).json({ message: "Insufficient permissions" });
  };
};

/**
 * Middleware to check if user has minimum role level
 * @param {string} minimumRole - Minimum required role
 * @returns {Function} Express middleware
 */
export const minRoleMiddleware = (minimumRole) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
    
    if (userLevel >= requiredLevel) {
      return next();
    }
    
    return res.status(403).json({ message: "Insufficient permissions" });
  };
};

/**
 * Check if user can perform action on resource
 * @param {string} userRole - User's role
 * @param {string} action - Action to perform
 * @param {object} resource - Resource object (optional)
 * @returns {boolean}
 */
export function canPerformAction(userRole, action, resource = null) {
  const permissions = {
    SUPER_ADMIN: ["*"], // All permissions
    ADMIN: [
      "create_asset", "update_asset", "delete_asset",
      "assign_asset", "unassign_asset",
      "create_user", "update_user", "delete_user",
      "import_assets", "export_assets",
      "view_reports", "view_history",
    ],
    MANAGER: [
      "view_assets", "view_users",
      "approve_request", "view_reports",
      "view_history",
    ],
    EMPLOYEE: [
      "view_own_assets", "request_asset",
      "report_issue",
    ],
    AUDITOR: [
      "view_assets", "view_history",
      "view_reports", "export_reports",
    ],
  };
  
  const userPermissions = permissions[userRole] || [];
  
  // SUPER_ADMIN has all permissions
  if (userPermissions.includes("*")) {
    return true;
  }
  
  return userPermissions.includes(action);
}
