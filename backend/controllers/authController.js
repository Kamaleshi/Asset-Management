import db from "../database/db.js";
import {
  hashPassword,
  hasPassword,
  isPasswordHash,
  signAuthToken,
  verifyPassword,
} from "../utils/auth.js";

function trimOrNull(value) {
  return value?.trim() || null;
}

function getUserByUsername(username) {
  return db.prepare(`
    SELECT
      u.*,
      r.role_name as role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.username = ? AND u.is_active = 1
  `).get(username);
}

function buildAuthResponse(user, extra = {}) {
  return {
    token: signAuthToken(user),
    role: user.role,
    username: user.username,
    id: user.user_id,
    fullName: user.full_name,
    email: user.email,
    employeeId: user.employee_id,
    department: user.department,
    ...extra,
  };
}

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedUsername || !trimmedPassword) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = getUserByUsername(trimmedUsername);

    if (!user) {
      console.log(`Login attempt failed: User '${trimmedUsername}' not found or inactive`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!hasPassword(user.password)) {
      return res.status(403).json({
        message: "Password not set. Please set your password first.",
        requiresPasswordSetup: true,
        username: user.username,
      });
    }

    const passwordMatches = await verifyPassword(trimmedPassword, user.password);
    if (!passwordMatches) {
      console.log(`Login attempt failed: Incorrect password for user '${trimmedUsername}'`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Migrate legacy plaintext passwords to bcrypt on successful login.
    if (!isPasswordHash(user.password)) {
      const migratedHash = await hashPassword(trimmedPassword);
      db.prepare("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").run(
        migratedHash,
        user.user_id
      );
    }

    console.log(`Login successful: ${user.username} (${user.role})`);
    res.json(buildAuthResponse(user));
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const setPassword = async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  try {
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

    const user = getUserByUsername(trimmedUsername);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (hasPassword(user.password)) {
      return res.status(400).json({ message: "Password is already set. Please use the login page." });
    }

    const hashedPassword = await hashPassword(trimmedPassword);
    db.prepare("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?").run(
      hashedPassword,
      trimmedUsername
    );

    console.log(`Password set for user: ${trimmedUsername}`);
    res.json(buildAuthResponse(user, { message: "Password set successfully. You are now logged in." }));
  } catch (error) {
    console.error("Set password error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { username, newPassword, confirmPassword } = req.body;

  try {
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

    const user = getUserByUsername(trimmedUsername);
    if (!user) {
      return res.status(404).json({ message: "User not found or inactive" });
    }

    const hashedPassword = await hashPassword(trimmedNewPassword);
    db.prepare("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?").run(
      hashedPassword,
      trimmedUsername
    );

    console.log(`Password reset for user: ${trimmedUsername}`);
    res.json({ message: "Password reset successfully. You can now login with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const register = async (req, res) => {
  const { username, password, confirmPassword, fullName, email, employeeId, department } = req.body;

  try {
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();
    const trimmedConfirm = confirmPassword?.trim();
    const trimmedFullName = trimOrNull(fullName);
    const trimmedEmail = trimOrNull(email);
    const trimmedEmployeeId = trimOrNull(employeeId);
    const trimmedDepartment = trimOrNull(department);

    if (!trimmedUsername || !trimmedPassword || !trimmedConfirm) {
      return res.status(400).json({ message: "Username, password and confirm password are required" });
    }

    if (trimmedPassword !== trimmedConfirm) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (trimmedPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = db.prepare("SELECT user_id FROM users WHERE username = ? OR email = ?").get(
      trimmedUsername,
      trimmedEmail
    );
    if (existingUser) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    const hashedPassword = await hashPassword(trimmedPassword);
    const insert = db.prepare(`
      INSERT INTO users (username, password, full_name, email, employee_id, department, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      trimmedUsername,
      hashedPassword,
      trimmedFullName,
      trimmedEmail,
      trimmedEmployeeId,
      trimmedDepartment
    );

    const newUserId = insert.lastInsertRowid || insert.lastInsertId || null;
    const user = db.prepare(`
      SELECT u.*, r.role_name as role, r.role_id as role_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `).get(newUserId);

    console.log(`New user registered: ${user.username}`);
    res.status(201).json(buildAuthResponse(user, { message: "User registered and logged in" }));
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
