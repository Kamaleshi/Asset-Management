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
