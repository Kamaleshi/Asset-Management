import db from "../database/db.js";
import { AppError } from "../utils/errors.js";
import { hashPassword } from "../utils/auth.js";

function getActor(userId) {
  return db.prepare(`
    SELECT
      u.user_id,
      u.username,
      u.department,
      r.role_name AS role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = ?
  `).get(userId);
}

function toUserResponse(user) {
  return {
    id: user.user_id,
    username: user.username,
    role: user.role,
    empName: user.full_name || user.emp_name,
    employeeId: user.employee_id,
    department: user.department,
    businessUnit: user.business_unit,
    businessHead: user.business_head,
    category: user.category,
    email: user.email,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

function resolveRoleId(role) {
  const roleMapping = {
    USER: "EMPLOYEE",
    EMPLOYEE: "EMPLOYEE",
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    AUDITOR: "AUDITOR",
  };

  const dbRoleName = roleMapping[role] || role || "EMPLOYEE";
  const roleRecord = db.prepare("SELECT role_id, role_name FROM roles WHERE role_name = ?").get(dbRoleName);
  if (!roleRecord) {
    throw new AppError(400, "Invalid role");
  }
  if (roleRecord.role_name === "SUPER_ADMIN") {
    throw new AppError(403, "Cannot assign SUPER_ADMIN role");
  }

  return roleRecord.role_id;
}

function buildUserScope(actor, requestedId = null) {
  if (actor.role === "SUPER_ADMIN" || actor.role === "ADMIN") {
    return { clause: "", params: [] };
  }

  if (actor.role === "MANAGER") {
    if (requestedId) {
      return { clause: "AND u.user_id = ? AND u.department = ?", params: [requestedId, actor.department || ""] };
    }
    return { clause: "AND u.department = ?", params: [actor.department || ""] };
  }

  if (requestedId && Number(requestedId) !== actor.user_id) {
    throw new AppError(403, "You do not have access to this user");
  }

  return { clause: "AND u.user_id = ?", params: [actor.user_id] };
}

export const getUsers = async (req, res) => {
  const actor = getActor(req.user.id);
  const scope = buildUserScope(actor);

  const users = db.prepare(`
    SELECT
      u.*,
      r.role_name AS role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.is_active = 1 ${scope.clause}
    ORDER BY u.created_at DESC
  `).all(...scope.params);

  res.json(users.map(toUserResponse));
};

export const getUserById = async (req, res) => {
  const actor = getActor(req.user.id);
  const userId = Number.parseInt(req.params.id, 10);
  const scope = buildUserScope(actor, userId);

  const user = db.prepare(`
    SELECT
      u.*,
      r.role_name AS role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.is_active = 1 ${scope.clause}
  `).get(...scope.params);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  res.json(toUserResponse(user));
};

export const createUser = async (req, res) => {
  const actor = getActor(req.user.id);
  if (!["ADMIN", "SUPER_ADMIN"].includes(actor.role)) {
    throw new AppError(403, "Only administrators can create users");
  }

  const username = req.body.username?.trim();
  const employeeId = req.body.employeeId?.trim();
  if (!username || !employeeId) {
    throw new AppError(400, "Username and Employee ID are required");
  }

  if (db.prepare("SELECT user_id FROM users WHERE username = ?").get(username)) {
    throw new AppError(409, "Username already exists");
  }
  if (db.prepare("SELECT user_id FROM users WHERE employee_id = ?").get(employeeId)) {
    throw new AppError(409, "Employee ID already exists");
  }
  if (req.body.email && db.prepare("SELECT user_id FROM users WHERE email = ?").get(req.body.email.trim())) {
    throw new AppError(409, "Email already exists");
  }

  const password = req.body.password ? await hashPassword(req.body.password.trim()) : "";
  const roleId = resolveRoleId(req.body.role);

  const result = db.prepare(`
    INSERT INTO users (
      username, password, full_name, email, employee_id, department,
      business_unit, business_head, category, role_id, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    username,
    password,
    req.body.fullName?.trim() || req.body.empName?.trim() || username,
    req.body.email?.trim() || null,
    employeeId,
    req.body.department?.trim() || null,
    req.body.businessUnit?.trim() || null,
    req.body.businessHead?.trim() || null,
    req.body.category?.trim() || null,
    roleId
  );

  const user = db.prepare(`
    SELECT u.*, r.role_name AS role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(toUserResponse(user));
};

export const updateUser = async (req, res) => {
  const actor = getActor(req.user.id);
  if (!["ADMIN", "SUPER_ADMIN"].includes(actor.role)) {
    throw new AppError(403, "Only administrators can update users");
  }

  const userId = Number.parseInt(req.params.id, 10);
  const currentUser = db.prepare(`
    SELECT u.*, r.role_name AS role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = ?
  `).get(userId);

  if (!currentUser) {
    throw new AppError(404, "User not found");
  }

  if (currentUser.role === "SUPER_ADMIN") {
    throw new AppError(403, "System Administrator is protected");
  }

  const updates = [];
  const values = [];

  const fields = {
    username: "username",
    fullName: "full_name",
    empName: "full_name",
    email: "email",
    employeeId: "employee_id",
    department: "department",
    businessUnit: "business_unit",
    businessHead: "business_head",
    category: "category",
  };

  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] === undefined) {
      continue;
    }

    const nextValue = req.body[key]?.trim?.() || null;
    if (nextValue !== currentUser[column]) {
      if (column === "username" && nextValue && db.prepare("SELECT user_id FROM users WHERE username = ? AND user_id != ?").get(nextValue, userId)) {
        throw new AppError(409, "Username already exists");
      }
      if (column === "email" && nextValue && db.prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?").get(nextValue, userId)) {
        throw new AppError(409, "Email already exists");
      }
      if (column === "employee_id" && nextValue && db.prepare("SELECT user_id FROM users WHERE employee_id = ? AND user_id != ?").get(nextValue, userId)) {
        throw new AppError(409, "Employee ID already exists");
      }

      updates.push(`${column} = ?`);
      values.push(nextValue);
    }
  }

  if (req.body.role !== undefined) {
    updates.push("role_id = ?");
    values.push(resolveRoleId(req.body.role));
  }

  if (req.body.isActive !== undefined) {
    updates.push("is_active = ?");
    values.push(req.body.isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.json(toUserResponse(currentUser));
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(userId);
  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`).run(...values);

  const updatedUser = db.prepare(`
    SELECT u.*, r.role_name AS role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = ?
  `).get(userId);

  res.json(toUserResponse(updatedUser));
};

export const deleteUser = async (req, res) => {
  const actor = getActor(req.user.id);
  if (!["ADMIN", "SUPER_ADMIN"].includes(actor.role)) {
    throw new AppError(403, "Only administrators can delete users");
  }

  const userId = Number.parseInt(req.params.id, 10);
  const user = db.prepare(`
    SELECT u.user_id, u.username, r.role_name AS role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = ?
  `).get(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }
  if (user.role === "SUPER_ADMIN") {
    throw new AppError(403, "System Administrator cannot be deleted");
  }

  const assignedAssets = db.prepare("SELECT COUNT(*) AS count FROM assets WHERE assigned_to = ? AND status != 'DISPOSED'").get(userId);
  if (assignedAssets.count > 0) {
    throw new AppError(400, `Cannot delete user with ${assignedAssets.count} assigned asset(s)`);
  }

  db.prepare("UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").run(userId);
  res.json({ message: "User deleted successfully" });
};
