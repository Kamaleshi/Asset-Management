import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database
const dbPath = join(__dirname, "asset_management.db");
const db = new Database(dbPath);
const defaultAdminPasswordHash = bcrypt.hashSync("admin123", 10);
const defaultUserPasswordHash = bcrypt.hashSync("user123", 10);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize schema
export function initializeDatabase() {
  try {
    const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
    db.exec(schema);
    console.log("✅ Database initialized successfully");
    
    // Alter existing users table to allow NULL passwords (if table exists with old schema)
    try {
      // Check if password column has NOT NULL constraint
      const tableInfo = db.prepare("PRAGMA table_info(users)").all();
      const passwordColumn = tableInfo.find(col => col.name === "password");
      
      if (passwordColumn && passwordColumn.notnull === 1) {
        // SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
        // But for safety, we'll just ensure the constraint is handled in code
        // The INSERT will work if we pass NULL explicitly
        console.log("ℹ️  Note: Password column may have NOT NULL constraint. Using workaround for NULL passwords.");
      }
    } catch (error) {
      // Table might not exist yet, which is fine
      console.log("ℹ️  Users table structure check:", error.message);
    }
    
    // Ensure all required roles exist
    const requiredRoles = [
      { name: "SUPER_ADMIN", description: "Full system access - can manage all users, roles, and system settings" },
      { name: "ADMIN", description: "Asset & user management - can manage assets and users" },
      { name: "MANAGER", description: "Department-level access - can view team assets and approve requests" },
      { name: "EMPLOYEE", description: "Self asset access - can view own assigned assets" },
      { name: "AUDITOR", description: "Read-only audit access - can view reports and history" }
    ];
    
    requiredRoles.forEach(role => {
      const roleExists = db.prepare("SELECT role_id FROM roles WHERE role_name = ?").get(role.name);
      if (!roleExists) {
        try {
          db.prepare(`
            INSERT INTO roles (role_name, description)
            VALUES (?, ?)
          `).run(role.name, role.description);
          console.log(`✅ Role '${role.name}' created`);
        } catch (error) {
          console.error(`❌ Error creating role '${role.name}':`, error);
        }
      }
    });
    
    // Create default admin user if not exists
    const adminExists = db.prepare("SELECT user_id, is_active, role_id FROM users WHERE username = ?").get("admin");
    if (!adminExists) {
      const superAdminRole = db.prepare("SELECT role_id FROM roles WHERE role_name = ?").get("SUPER_ADMIN");
      if (superAdminRole) {
        try {
          db.prepare(`
            INSERT INTO users (username, password, full_name, email, employee_id, role_id, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            "admin",
            defaultAdminPasswordHash,
            "System Administrator",
            "admin@illuminei.com",
            "E001",
            superAdminRole.role_id,
            1
          );
          console.log("✅ Default admin user created (username: admin, password: admin123)");
        } catch (error) {
          console.error("Error creating admin user:", error);
        }
      } else {
        console.error("SUPER_ADMIN role not found. Cannot create default admin user.");
      }
    } else {
      // Admin user exists - check if it needs to be activated
      if (adminExists.is_active === 0 || adminExists.is_active === false) {
        try {
          const superAdminRole = db.prepare("SELECT role_id FROM roles WHERE role_name = ?").get("SUPER_ADMIN");
          if (superAdminRole) {
            db.prepare(`
              UPDATE users 
              SET is_active = 1, role_id = ?, password = ?
              WHERE username = 'admin'
            `).run(superAdminRole.role_id, defaultAdminPasswordHash);
            console.log("✅ Admin user activated (username: admin, password: admin123)");
            // Verify it was updated
            const updated = db.prepare("SELECT is_active FROM users WHERE username = ?").get("admin");
            console.log(`   Verification: Admin user is_active = ${updated.is_active}`);
          } else {
            console.error("❌ SUPER_ADMIN role not found. Cannot activate admin user.");
          }
        } catch (error) {
          console.error("❌ Error activating admin user:", error);
        }
      } else {
        console.log(`ℹ️  Admin user already exists and is active (is_active=${adminExists.is_active})`);
      }
    }
    
    // Create default regular user if not exists
    const userExists = db.prepare("SELECT user_id FROM users WHERE username = ?").get("user");
    if (!userExists) {
      const employeeRole = db.prepare("SELECT role_id FROM roles WHERE role_name = ?").get("EMPLOYEE");
      if (employeeRole) {
        try {
          db.prepare(`
            INSERT INTO users (username, password, full_name, email, employee_id, role_id, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            "user",
            defaultUserPasswordHash,
            "Regular User",
            "user@illuminei.com",
            "E002",
            employeeRole.role_id,
            1
          );
          console.log("✅ Default user created (username: user, password: user123)");
        } catch (error) {
          console.error("❌ Error creating default user:", error);
        }
      } else {
        console.error("❌ EMPLOYEE role not found. Cannot create default user.");
      }
    }
    
    // Ensure only System Administrator (username: "admin") is SUPER_ADMIN
    // Reset any other users with SUPER_ADMIN role to ADMIN
    const superAdminRole = db.prepare("SELECT role_id FROM roles WHERE role_name = ?").get("SUPER_ADMIN");
    const adminRole = db.prepare("SELECT role_id FROM roles WHERE role_name = ?").get("ADMIN");
    
    if (superAdminRole && adminRole) {
      const allSuperAdmins = db.prepare(`
        SELECT u.user_id, u.username, r.role_name as role
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name = 'SUPER_ADMIN' AND u.username != 'admin'
      `).all();
      
      if (allSuperAdmins.length > 0) {
        console.log(`⚠️  Found ${allSuperAdmins.length} user(s) with SUPER_ADMIN role that are not System Administrator. Resetting to ADMIN...`);
        allSuperAdmins.forEach(user => {
          try {
            db.prepare(`UPDATE users SET role_id = ? WHERE user_id = ?`).run(adminRole.role_id, user.user_id);
            console.log(`✅ Reset user '${user.username}' (ID: ${user.user_id}) from SUPER_ADMIN to ADMIN`);
          } catch (error) {
            console.error(`❌ Error resetting user '${user.username}':`, error);
          }
        });
      }
    }
    
    // Final verification - ensure admin user exists and is active
    const verifyAdmin = db.prepare("SELECT user_id, username, is_active, role_id FROM users WHERE username = ?").get("admin");
    if (verifyAdmin) {
      if (verifyAdmin.is_active === 1) {
        console.log(`✅ Admin user verified: ID=${verifyAdmin.user_id}, Active=${verifyAdmin.is_active}, RoleID=${verifyAdmin.role_id}`);
      } else {
        console.error(`❌ WARNING: Admin user exists but is INACTIVE (Active=${verifyAdmin.is_active}). Attempting to activate...`);
        try {
          db.prepare(`UPDATE users SET is_active = 1 WHERE username = 'admin'`).run();
          console.log("✅ Admin user activated successfully");
        } catch (error) {
          console.error("❌ Failed to activate admin user:", error);
        }
      }
    } else {
      console.error("❌ WARNING: Admin user does not exist! Attempting to create...");
      if (superAdminRole) {
        try {
          db.prepare(`
            INSERT INTO users (username, password, full_name, email, employee_id, role_id, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            "admin",
            defaultAdminPasswordHash,
            "System Administrator",
            "admin@illuminei.com",
            "E001",
            superAdminRole.role_id,
            1
          );
          console.log("✅ Admin user force-created successfully");
        } catch (error) {
          console.error("❌ Failed to force-create admin user:", error);
        }
      }
    }
    
    // Migrate assets table CHECK constraint to include new statuses (REPAIR, MISUSE, SCRAP)
    try {
      // Check if assets table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='assets'
      `).get();
      
      if (tableExists) {
        // Check if the constraint already includes the new statuses by trying to insert a test value
        // We'll recreate the table with the updated constraint
        console.log("🔄 Checking assets table status constraint...");
        
        // Get all columns from the current table
        const columns = db.prepare("PRAGMA table_info(assets)").all();
        const columnDefs = columns.map(col => {
          let def = `"${col.name}" ${col.type}`;
          if (col.pk) def += " PRIMARY KEY";
          if (col.notnull && col.name !== "asset_id") def += " NOT NULL";
          if (col.dflt_value !== null) {
            const defaultValue = col.dflt_value;
            def += ` DEFAULT ${defaultValue}`;
          }
          return def;
        });
        
        // Check if we need to update the constraint
        // Try to get the table schema
        const tableSchema = db.prepare(`
          SELECT sql FROM sqlite_master 
          WHERE type='table' AND name='assets'
        `).get();
        
        if (tableSchema && tableSchema.sql) {
          const hasNewStatuses = tableSchema.sql.includes("'REPAIR'") && 
                                 tableSchema.sql.includes("'MISUSE'") && 
                                 tableSchema.sql.includes("'SCRAP'");
          
          if (!hasNewStatuses) {
            console.log("🔄 Updating assets table CHECK constraint to include REPAIR, MISUSE, SCRAP...");
            
            // Temporarily disable foreign key constraints
            db.pragma("foreign_keys = OFF");
            
            // Create backup table
            db.exec(`
              CREATE TABLE IF NOT EXISTS assets_backup AS SELECT * FROM assets;
            `);
            
            // Drop the old table
            db.exec(`DROP TABLE assets;`);
            
            // Recreate with updated schema (from schema.sql)
            db.exec(`
              CREATE TABLE assets (
                asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_tag VARCHAR(50) UNIQUE,
                asset_name VARCHAR(100) NOT NULL,
                asset_id_custom VARCHAR(100),
                category_id INTEGER REFERENCES asset_categories(category_id),
                brand VARCHAR(100),
                model VARCHAR(100),
                model_number VARCHAR(100),
                serial_number VARCHAR(100) UNIQUE NOT NULL,
                purchase_date DATE,
                purchase_cost DECIMAL(10,2),
                warranty_expiry DATE,
                warranty VARCHAR(100),
                vendor_id INTEGER REFERENCES vendors(vendor_id),
                status VARCHAR(50) CHECK (
                  status IN ('NEW','IN_STOCK','ASSIGNED','MAINTENANCE','LOST','RETIRED','DISPOSED','REPAIR','MISUSE','SCRAP','Available','Assigned')
                ) DEFAULT 'IN_STOCK',
                location VARCHAR(100),
                assigned_to INTEGER REFERENCES users(user_id),
                created_by INTEGER REFERENCES users(user_id),
                ownership VARCHAR(100),
                owner_of_asset VARCHAR(100),
                retired_date DATE,
                eol_date DATE,
                life_cycle VARCHAR(100),
                price DECIMAL(10,2),
                make VARCHAR(100),
                gen VARCHAR(100),
                ram VARCHAR(100),
                hardisk VARCHAR(100),
                hardisk_health VARCHAR(100),
                condition VARCHAR(100),
                condition_physical VARCHAR(100),
                physical_condition VARCHAR(100),
                business_unit VARCHAR(100),
                department VARCHAR(100),
                department_head VARCHAR(100),
                seat_asset VARCHAR(100),
                seat_no VARCHAR(100),
                seat VARCHAR(100),
                invoice_no VARCHAR(100),
                remark TEXT,
                solution TEXT,
                key_field VARCHAR(100),
                day_shift VARCHAR(100),
                employee_code_day VARCHAR(100),
                night_shift VARCHAR(100),
                employee_code_night VARCHAR(100),
                split_shift VARCHAR(100),
                employee_code_split VARCHAR(100),
                usage VARCHAR(100),
                emp_name VARCHAR(100),
                employee_id_field VARCHAR(100),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );
            `);
            
            // Copy data back
            const columnNames = columns.map(col => `"${col.name}"`).join(", ");
            db.exec(`
              INSERT INTO assets (${columnNames})
              SELECT ${columnNames} FROM assets_backup;
            `);
            
            // Drop backup table
            db.exec(`DROP TABLE assets_backup;`);
            
            // Recreate indexes
            db.exec(`
              CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
              CREATE INDEX IF NOT EXISTS idx_assets_serial ON assets(serial_number);
              CREATE INDEX IF NOT EXISTS idx_assets_assigned_to ON assets(assigned_to);
            `);
            
            // Re-enable foreign key constraints
            db.pragma("foreign_keys = ON");
            
            console.log("✅ Assets table CHECK constraint updated successfully");
          } else {
            console.log("✅ Assets table CHECK constraint already includes new statuses");
          }
        }
      }
    } catch (error) {
      console.error("❌ Error migrating assets table constraint:", error);
      // Don't throw - allow the app to continue
    }
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}

// Export database instance
export default db;

