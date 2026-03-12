import db from "../database/db.js";
import { AppError } from "./errors.js";

const STATUS_MAP = {
  ASSIGNED: "Assigned",
  IN_STOCK: "Available",
  AVAILABLE: "Available",
  REPAIR: "Repair",
  MISUSE: "Misuse",
  SCRAP: "Scrap",
  DISPOSED: "Disposed",
  MAINTENANCE: "Maintenance",
  RETIRED: "Retired",
  LOST: "Lost",
  NEW: "New",
};

export function normalizeStatus(value, fallback = "IN_STOCK") {
  if (!value) {
    return fallback;
  }

  const normalized = String(value).trim().toUpperCase();
  if (normalized === "AVAILABLE") {
    return "IN_STOCK";
  }
  return normalized;
}

export function displayStatus(value) {
  return STATUS_MAP[value] || value;
}

export function getActor(userId) {
  const actor = db.prepare(`
    SELECT
      u.user_id,
      u.username,
      u.department,
      u.business_unit,
      r.role_name AS role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = ? AND u.is_active = 1
  `).get(userId);

  if (!actor) {
    throw new AppError(401, "Authenticated user not found");
  }

  return actor;
}

export function buildAssetScope(actor, options = {}) {
  const where = [];
  const params = [];

  if (!options.includeDisposed) {
    where.push("a.status != 'DISPOSED'");
  }

  if (actor.role === "EMPLOYEE") {
    where.push("a.assigned_to = ?");
    params.push(actor.user_id);
  } else if (actor.role === "MANAGER") {
    where.push("(a.department = ? OR assigned_user.department = ?)");
    params.push(actor.department || "", actor.department || "");
  }

  return {
    clause: where.length ? ` AND ${where.join(" AND ")}` : "",
    params,
  };
}

export function assertAssetAccess(actor, asset) {
  if (!asset) {
    throw new AppError(404, "Asset not found");
  }

  if (actor.role === "EMPLOYEE" && asset.assigned_to !== actor.user_id) {
    throw new AppError(403, "You do not have access to this asset");
  }

  if (
    actor.role === "MANAGER" &&
    asset.department !== actor.department &&
    asset.assigned_to_department !== actor.department
  ) {
    throw new AppError(403, "You do not have access to this asset");
  }
}

export function mapAssetRow(asset) {
  return {
    id: asset.asset_id,
    assetId: asset.asset_id_custom || asset.asset_tag,
    name: asset.asset_name,
    category: asset.category_name || asset.category_id,
    status: asset.status,
    assetStatus: displayStatus(asset.status),
    assignedTo: asset.assigned_to,
    assigned_to_name: asset.assigned_to_name,
    assigned_to_username: asset.assigned_to_username,
    assigned_to_employee_id: asset.assigned_to_employee_id,
    assigned_to_department: asset.assigned_to_department,
    serialNumber: asset.serial_number,
    brand: asset.brand,
    make: asset.make,
    model: asset.model,
    modelNumber: asset.model_number,
    purchaseDate: asset.purchase_date,
    purchaseCost: asset.purchase_cost,
    price: asset.price,
    warranty: asset.warranty,
    warrantyExpiry: asset.warranty_expiry,
    department: asset.department,
    businessUnit: asset.business_unit,
    seatNo: asset.seat_no || asset.seat_asset || asset.seat,
    seatAsset: asset.seat_asset,
    seat: asset.seat,
    ownership: asset.ownership,
    ownerOfAsset: asset.owner_of_asset,
    retiredDate: asset.retired_date,
    eolDate: asset.eol_date,
    lifeCycle: asset.life_cycle,
    gen: asset.gen,
    ram: asset.ram,
    hardisk: asset.hardisk,
    hardiskHealth: asset.hardisk_health,
    condition: asset.condition,
    conditionPhysical: asset.condition_physical,
    physicalCondition: asset.physical_condition,
    vendor: asset.vendor_name || (asset.vendor_id ? `Vendor ID: ${asset.vendor_id}` : null),
    invoiceNo: asset.invoice_no,
    remark: asset.remark,
    solution: asset.solution,
    key: asset.key_field,
    dayShift: asset.day_shift,
    employeeCodeDay: asset.employee_code_day,
    nightShift: asset.night_shift,
    employeeCodeNight: asset.employee_code_night,
    splitShift: asset.split_shift,
    employeeCodeSplit: asset.employee_code_split,
    usage: asset.usage,
    empName: asset.emp_name,
    employeeId: asset.employee_id_field,
    location: asset.location,
    created_at: asset.created_at,
    updated_at: asset.updated_at,
  };
}

export function escapeCsv(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}
