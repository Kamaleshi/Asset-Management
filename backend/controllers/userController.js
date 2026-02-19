import db from "../database/db.js";

export const getUsers = (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.*,
        r.role_name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.is_active = 1
      ORDER BY u.created_at DESC
    `).all();
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => ({
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
    }));
    
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const getUserById = (req, res) => {
  try {
    const { id } = req.params;
    
    const user = db.prepare(`
      SELECT 
        u.*,
        r.role_name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ? AND u.is_active = 1
    `).get(parseInt(id));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = {
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
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

export const createUser = (req, res) => {
  try {
    const {
      username,
      password,
      role,
      category,
      empName,
      fullName,
      employeeId,
      department,
      businessUnit,
      businessHead,
      email,
    } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }
    
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }
    
    // Prevent creating users with SUPER_ADMIN role - only System Administrator can be SUPER_ADMIN
    if (role === "SUPER_ADMIN") {
      return res.status(403).json({ 
        message: "Cannot create users with SUPER_ADMIN role. Only System Administrator can have this role." 
      });
    }
    
    // Get role ID - map frontend role names to database role names
    let roleId = 4; // Default to EMPLOYEE
    if (role) {
      // Map frontend role names to database role names
      const roleMapping = {
        "USER": "EMPLOYEE",
        "EMPLOYEE": "EMPLOYEE",
        "ADMIN": "ADMIN",
        "MANAGER": "MANAGER",
        "AUDITOR": "AUDITOR",
      };
      const dbRoleName = roleMapping[role] || role;
      const roleRecord = db.prepare("SELECT role_id FROM roles WHERE role_name = ?").get(dbRoleName);
      if (roleRecord) {
        roleId = roleRecord.role_id;
      }
    }
    
    // If password is not provided, set to empty string - user must set password on first login
    // Using empty string instead of NULL for compatibility with existing database schema
    const userPassword = password || "";
    
    // Check if username already exists
    const existingUser = db.prepare("SELECT user_id FROM users WHERE username = ?").get(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // Check if employee ID already exists
    const existingEmployeeId = db.prepare("SELECT user_id FROM users WHERE employee_id = ?").get(employeeId);
    if (existingEmployeeId) {
      return res.status(400).json({ message: "Employee ID already exists" });
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = db.prepare("SELECT user_id FROM users WHERE email = ?").get(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }
    
    // Insert user (password can be NULL for first-time setup)
    // Handle NULL password explicitly for SQLite compatibility
    const stmt = db.prepare(`
      INSERT INTO users (
        username, password, full_name, email, employee_id,
        department, business_unit, business_head, category, role_id, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    // Insert user with empty string password if not provided (user will set password on first login)
    const result = stmt.run(
      username,
      userPassword, // Empty string if not provided - treated as "no password set"
      fullName || empName || username,
      email || null,
      employeeId,
      department || null,
      businessUnit || null,
      businessHead || null,
      category || null,
      roleId
    );
    
    const newUserId = result.lastInsertRowid;
    
    // Return created user
    const newUser = db.prepare(`
      SELECT 
        u.*,
        r.role_name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `).get(newUserId);
    
    const { password: _, ...userWithoutPassword } = {
      id: newUser.user_id,
      username: newUser.username,
      role: newUser.role,
      empName: newUser.full_name,
      employeeId: newUser.employee_id,
      department: newUser.department,
      businessUnit: newUser.business_unit,
      businessHead: newUser.business_head,
      category: newUser.category,
      email: newUser.email,
    };
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    const errorMessage = error.message || "Error creating user";
    
    // Provide more specific error messages
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || errorMessage.includes("UNIQUE constraint")) {
      if (errorMessage.includes("username") || errorMessage.toLowerCase().includes("username")) {
        return res.status(400).json({ message: "Username already exists" });
      } else if (errorMessage.includes("employee_id") || errorMessage.toLowerCase().includes("employee")) {
        return res.status(400).json({ message: "Employee ID already exists" });
      } else if (errorMessage.includes("email") || errorMessage.toLowerCase().includes("email")) {
        return res.status(400).json({ message: "Email already exists" });
      }
      return res.status(400).json({ message: "A unique constraint violation occurred. Please check username, employee ID, and email." });
    }
    
    if (error.code === "SQLITE_CONSTRAINT_NOTNULL" || errorMessage.includes("NOT NULL constraint")) {
      return res.status(400).json({ 
        message: "Required field is missing. Please ensure Username and Employee ID are provided.",
        error: errorMessage
      });
    }
    
    res.status(500).json({ 
      message: "Error creating user",
      error: errorMessage
    });
  }
};

export const updateUser = (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      role,
      category,
      empName,
      fullName,
      employeeId,
      department,
      businessUnit,
      businessHead,
      email,
      isActive,
    } = req.body;
    
    // Get current user with role information
    const currentUser = db.prepare(`
      SELECT u.*, r.role_name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `).get(parseInt(id));
    
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Prevent changing role of SUPER_ADMIN users
    if (currentUser.role === "SUPER_ADMIN" && role && role !== "SUPER_ADMIN") {
      return res.status(403).json({ 
        message: "Cannot change role of System Administrator. Super admin users must remain as SUPER_ADMIN." 
      });
    }
    
    // Build update query
    const updateFields = [];
    const updateValues = [];
    
    if (username !== undefined && username !== currentUser.username) {
      // Check if new username exists
      const existing = db.prepare("SELECT user_id FROM users WHERE username = ? AND user_id != ?").get(username, parseInt(id));
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      updateFields.push("username = ?");
      updateValues.push(username);
    }
    
    if (role !== undefined) {
      // Prevent changing role to SUPER_ADMIN or from SUPER_ADMIN
      if (role === "SUPER_ADMIN") {
        return res.status(403).json({ 
          message: "Cannot assign SUPER_ADMIN role. Only System Administrator can have this role." 
        });
      }
      
      // Map frontend role names to database role names
      const roleMapping = {
        "USER": "EMPLOYEE",
        "EMPLOYEE": "EMPLOYEE",
        "ADMIN": "ADMIN",
        "MANAGER": "MANAGER",
        "AUDITOR": "AUDITOR",
      };
      const dbRoleName = roleMapping[role] || role;
      const roleRecord = db.prepare("SELECT role_id FROM roles WHERE role_name = ?").get(dbRoleName);
      if (roleRecord) {
        updateFields.push("role_id = ?");
        updateValues.push(roleRecord.role_id);
      }
    }
    
    if (fullName !== undefined || empName !== undefined) {
      updateFields.push("full_name = ?");
      updateValues.push(fullName || empName);
    }
    
    if (email !== undefined) {
      if (email && email !== currentUser.email) {
        const existing = db.prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?").get(email, parseInt(id));
        if (existing) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      updateFields.push("email = ?");
      updateValues.push(email || null);
    }
    
    if (employeeId !== undefined && employeeId !== currentUser.employee_id) {
      const existing = db.prepare("SELECT user_id FROM users WHERE employee_id = ? AND user_id != ?").get(employeeId, parseInt(id));
      if (existing) {
        return res.status(400).json({ message: "Employee ID already exists" });
      }
      updateFields.push("employee_id = ?");
      updateValues.push(employeeId);
    }
    
    if (department !== undefined) {
      updateFields.push("department = ?");
      updateValues.push(department || null);
    }
    
    if (businessUnit !== undefined) {
      updateFields.push("business_unit = ?");
      updateValues.push(businessUnit || null);
    }
    
    if (businessHead !== undefined) {
      updateFields.push("business_head = ?");
      updateValues.push(businessHead || null);
    }
    
    if (category !== undefined) {
      updateFields.push("category = ?");
      updateValues.push(category || null);
    }
    
    if (isActive !== undefined) {
      // Prevent deactivating SUPER_ADMIN users
      if (currentUser.role === "SUPER_ADMIN" && !isActive) {
        return res.status(403).json({ 
          message: "Cannot deactivate System Administrator. Super admin users must remain active." 
        });
      }
      updateFields.push("is_active = ?");
      updateValues.push(isActive ? 1 : 0);
    }
    
    if (updateFields.length === 0) {
      // No changes, return current user
      return getUserById(req, res);
    }
    
    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(parseInt(id));
    
    // Execute update
    const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE user_id = ?`;
    db.prepare(updateQuery).run(...updateValues);
    
    // Return updated user
    return getUserById(req, res);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

export const deleteUser = (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    // Check if user exists and get their role
    const user = db.prepare(`
      SELECT u.user_id, u.username, r.role_name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `).get(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Prevent deletion of SUPER_ADMIN users
    if (user.role === "SUPER_ADMIN") {
      return res.status(403).json({ 
        message: "Cannot delete System Administrator. Super admin users are protected and cannot be deleted." 
      });
    }
    
    // Check if user has assigned assets
    const assignedAssets = db.prepare("SELECT COUNT(*) as count FROM assets WHERE assigned_to = ?").get(userId);
    if (assignedAssets.count > 0) {
      return res.status(400).json({ 
        message: `Cannot delete user. User has ${assignedAssets.count} assigned asset(s). Please unassign assets first.` 
      });
    }
    
    // Soft delete - set is_active to 0
    db.prepare("UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").run(userId);
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
};
