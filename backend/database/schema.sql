-- Asset Management Database Schema
-- SQLite compatible

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT OR IGNORE INTO roles (role_name, description) VALUES
('SUPER_ADMIN', 'Full system access - can manage all users, roles, and system settings'),
('ADMIN', 'Asset & user management - can manage assets and users'),
('MANAGER', 'Department-level access - can view team assets and approve requests'),
('EMPLOYEE', 'Self asset access - can view own assigned assets'),
('AUDITOR', 'Read-only audit access - can view reports and history');

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255), -- Can be NULL for first-time password setup
    full_name VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    business_unit VARCHAR(100),
    business_head VARCHAR(100),
    category VARCHAR(100),
    role_id INTEGER REFERENCES roles(role_id) DEFAULT 4,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Asset Categories Table
CREATE TABLE IF NOT EXISTS asset_categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    custom_fields TEXT, -- JSON string for dynamic fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT OR IGNORE INTO asset_categories (category_name, description) VALUES
('Laptop', 'Laptop computers'),
('Desktop', 'Desktop computers'),
('Monitor', 'Computer monitors'),
('Server', 'Server equipment'),
('Mobile Device', 'Mobile phones and tablets'),
('Network Device', 'Network equipment'),
('Accessory', 'Keyboards, mice, etc.');

-- 4. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    contact_email VARCHAR(150),
    contact_phone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Assets Table (CORE TABLE)
CREATE TABLE IF NOT EXISTS assets (
    asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_tag VARCHAR(50) UNIQUE,
    asset_name VARCHAR(100) NOT NULL,
    asset_id_custom VARCHAR(100), -- Custom asset ID field
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
    -- Additional fields
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

-- 6. Asset History Table (AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS asset_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER REFERENCES assets(asset_id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- ASSIGNED, UNASSIGNED, STATUS_CHANGE, CREATED, UPDATED, DELETED
    old_value TEXT,
    new_value TEXT,
    performed_by INTEGER REFERENCES users(user_id),
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 7. Asset Requests Table
CREATE TABLE IF NOT EXISTS asset_requests (
    request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    requested_by INTEGER REFERENCES users(user_id),
    category_id INTEGER REFERENCES asset_categories(category_id),
    reason TEXT,
    status VARCHAR(50) CHECK (
        status IN ('PENDING','APPROVED','REJECTED','FULFILLED')
    ) DEFAULT 'PENDING',
    approved_by INTEGER REFERENCES users(user_id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Maintenance Records Table
CREATE TABLE IF NOT EXISTS asset_maintenance (
    maintenance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER REFERENCES assets(asset_id),
    issue_description TEXT,
    maintenance_date DATE,
    cost DECIMAL(10,2),
    vendor_id INTEGER REFERENCES vendors(vendor_id),
    status VARCHAR(50) CHECK (
        status IN ('OPEN','IN_PROGRESS','COMPLETED')
    ) DEFAULT 'OPEN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Excel Import Logs Table
CREATE TABLE IF NOT EXISTS asset_import_logs (
    import_id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name VARCHAR(255) NOT NULL,
    uploaded_by INTEGER REFERENCES users(user_id),
    total_records INTEGER DEFAULT 0,
    success_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    status VARCHAR(50) CHECK (
        status IN ('PROCESSING','COMPLETED','FAILED')
    ) DEFAULT 'PROCESSING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Import Error Details Table
CREATE TABLE IF NOT EXISTS asset_import_errors (
    error_id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_id INTEGER REFERENCES asset_import_logs(import_id) ON DELETE CASCADE,
    row_number INTEGER,
    error_message TEXT,
    row_data TEXT -- JSON string of the row data
);

-- 11. Attachments Table
CREATE TABLE IF NOT EXISTS asset_attachments (
    attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER REFERENCES assets(asset_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    uploaded_by INTEGER REFERENCES users(user_id),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(user_id),
    message TEXT NOT NULL,
    type VARCHAR(50), -- WARRANTY_EXPIRY, ASSIGNMENT, REQUEST, etc.
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_serial ON assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_assets_assigned_to ON assets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_asset_history_asset ON asset_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_user ON asset_history(performed_by);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

