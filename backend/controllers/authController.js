import jwt from "jsonwebtoken";
import db from "../database/db.js";

export const login = (req, res) => {
  const { username, password } = req.body;

  try {
    // Trim whitespace from inputs
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedUsername || !trimmedPassword) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Get user with role information
    const user = db.prepare(`
      SELECT 
        u.*,
        r.role_name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.username = ? AND u.is_active = 1
    `).get(trimmedUsername);

    if (!user) {
      console.log(`Login attempt failed: User '${trimmedUsername}' not found or inactive`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user has no password set (needs to set password on first login)
    // Handle both NULL and empty string as "no password set"
    if (!user.password || user.password === null || user.password === "" || user.password.trim() === "") {
      return res.status(403).json({ 
        message: "Password not set. Please set your password first.",
        requiresPasswordSetup: true,
        username: user.username
      });
    }
    
    // Compare passwords (plain text for now)
    if (user.password !== trimmedPassword) {
      console.log(`Login attempt failed: Incorrect password for user '${trimmedUsername}'`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role, roleId: user.role_id },
      "SECRET_KEY",
      { expiresIn: "24h" }
    );

    console.log(`✅ Successful login: ${user.username} (${user.role})`);

    res.json({
      token,
      role: user.role,
      username: user.username,
      id: user.user_id,
      fullName: user.full_name,
      email: user.email,
      employeeId: user.employee_id,
      department: user.department,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Set password for first-time login
export const setPassword = (req, res) => {
  const { username, password, confirmPassword } = req.body;

  try {
    // Trim whitespace from inputs
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();
    const trimmedConfirmPassword = confirmPassword?.trim();

    if (!trimmedUsername || !trimmedPassword || !trimmedConfirmPassword) {
      return res.status(400).json({ message: "Username, password, and confirm password are required" });
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (trimmedPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Get user
    const user = db.prepare(`
      SELECT u.*, r.role_name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.username = ? AND u.is_active = 1
    `).get(trimmedUsername);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if password is already set (handle both NULL and empty string)
    if (user.password && user.password !== null && user.password !== "" && user.password.trim() !== "") {
      return res.status(400).json({ message: "Password is already set. Please use the login page." });
    }

    // Update password
    db.prepare("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?").run(
      trimmedPassword,
      trimmedUsername
    );

    console.log(`✅ Password set for user: ${trimmedUsername}`);

    // Generate token and log them in
    const token = jwt.sign(
      { id: user.user_id, role: user.role, roleId: user.role_id },
      "SECRET_KEY",
      { expiresIn: "24h" }
    );

    res.json({
      token,
      role: user.role,
      username: user.username,
      id: user.user_id,
      fullName: user.full_name,
      email: user.email,
      employeeId: user.employee_id,
      department: user.department,
      message: "Password set successfully. You are now logged in."
    });
  } catch (error) {
    console.error("Set password error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Reset password (forgot password)
export const resetPassword = (req, res) => {
  const { username, newPassword, confirmPassword } = req.body;

  try {
    // Trim whitespace from inputs
    const trimmedUsername = username?.trim();
    const trimmedNewPassword = newPassword?.trim();
    const trimmedConfirmPassword = confirmPassword?.trim();

    if (!trimmedUsername || !trimmedNewPassword || !trimmedConfirmPassword) {
      return res.status(400).json({ message: "Username, new password, and confirm password are required" });
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (trimmedNewPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Get user
    const user = db.prepare(`
      SELECT u.*, r.role_name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.username = ? AND u.is_active = 1
    `).get(trimmedUsername);

    if (!user) {
      return res.status(404).json({ message: "User not found or inactive" });
    }

    // Update password
    db.prepare("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?").run(
      trimmedNewPassword,
      trimmedUsername
    );

    console.log(`✅ Password reset for user: ${trimmedUsername}`);

    res.json({
      message: "Password reset successfully. You can now login with your new password."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Register new user
export const register = (req, res) => {
  const { username, password, confirmPassword, fullName, email, employeeId, department } = req.body;

  try {
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();
    const trimmedConfirm = confirmPassword?.trim();
    const trimmedFullName = fullName?.trim() || null;
    const trimmedEmail = email?.trim() || null;
    const trimmedEmployeeId = employeeId?.trim() || null;
    const trimmedDepartment = department?.trim() || null;

    if (!trimmedUsername || !trimmedPassword || !trimmedConfirm) {
      return res.status(400).json({ message: "Username, password and confirm password are required" });
    }

    if (trimmedPassword !== trimmedConfirm) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (trimmedPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if username or email already exists
    const existingUser = db.prepare(`SELECT * FROM users WHERE username = ? OR email = ?`).get(trimmedUsername, trimmedEmail);
    if (existingUser) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    // Insert new user. Role_id will default to EMPLOYEE (as defined in schema)
    const insert = db.prepare(`
      INSERT INTO users (username, password, full_name, email, employee_id, department, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(trimmedUsername, trimmedPassword, trimmedFullName, trimmedEmail, trimmedEmployeeId, trimmedDepartment);

    const newUserId = insert.lastInsertRowid || insert.lastInsertId || null;

    // Fetch the created user with role information
    const user = db.prepare(`
      SELECT u.*, r.role_name as role, r.role_id as role_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `).get(newUserId);

    // Generate token and return basic user info
    const token = jwt.sign(
      { id: user.user_id, role: user.role, roleId: user.role_id },
      "SECRET_KEY",
      { expiresIn: "24h" }
    );

    console.log(`✅ New user registered: ${user.username}`);

    res.status(201).json({
      token,
      id: user.user_id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
      email: user.email,
      employeeId: user.employee_id,
      department: user.department,
      message: "User registered and logged in"
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
