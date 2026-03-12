import db from "../database/db.js";
import { recordAssetHistory, getAssetHistory as fetchHistory } from "../database/auditTrail.js";
import { assertAssetAccess, buildAssetScope, escapeCsv, getActor, mapAssetRow, normalizeStatus } from "../utils/assetHelpers.js";
import { AppError } from "../utils/errors.js";

const BASE_ASSET_QUERY = `
  SELECT
    a.*,
    c.category_name,
    u.username AS assigned_to_username,
    u.full_name AS assigned_to_name,
    u.employee_id AS assigned_to_employee_id,
    u.department AS assigned_to_department,
    v.vendor_name,
    creator.username AS created_by_username
  FROM assets a
  LEFT JOIN asset_categories c ON a.category_id = c.category_id
  LEFT JOIN users u ON a.assigned_to = u.user_id
  LEFT JOIN vendors v ON a.vendor_id = v.vendor_id
  LEFT JOIN users creator ON a.created_by = creator.user_id
  WHERE 1=1
`;

function parseAssetId(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, "Invalid asset ID");
  }
  return parsed;
}

function sanitizeString(value) {
  return typeof value === "string" ? value.trim() || null : value ?? null;
}

function resolveCategoryId(category, categoryId) {
  if (categoryId) {
    return categoryId;
  }

  const categoryName = sanitizeString(category);
  if (!categoryName) {
    return null;
  }

  const existingCategory = db.prepare("SELECT category_id FROM asset_categories WHERE category_name = ?").get(categoryName);
  if (existingCategory) {
    return existingCategory.category_id;
  }

  const result = db.prepare("INSERT INTO asset_categories (category_name) VALUES (?)").run(categoryName);
  return result.lastInsertRowid;
}

function resolveVendorId(vendor, vendorId) {
  if (vendorId) {
    return vendorId;
  }

  const vendorName = sanitizeString(vendor);
  if (!vendorName) {
    return null;
  }

  const existingVendor = db.prepare("SELECT vendor_id FROM vendors WHERE vendor_name = ?").get(vendorName);
  if (existingVendor) {
    return existingVendor.vendor_id;
  }

  const result = db.prepare("INSERT INTO vendors (vendor_name) VALUES (?)").run(vendorName);
  return result.lastInsertRowid;
}

function fetchAssetRow(assetId) {
  return db.prepare(`${BASE_ASSET_QUERY} AND a.asset_id = ?`).get(assetId);
}

function ensureUniqueSerial(serialNumber, excludeAssetId = null) {
  const existing = db.prepare(`
    SELECT asset_id
    FROM assets
    WHERE serial_number = ?
      AND (? IS NULL OR asset_id != ?)
  `).get(serialNumber, excludeAssetId, excludeAssetId);

  if (existing) {
    throw new AppError(409, "Serial number already exists");
  }
}

function ensureUniqueAssetIdentifier(assetTag, assetIdCustom, excludeAssetId = null) {
  const existing = db.prepare(`
    SELECT asset_id
    FROM assets
    WHERE (asset_tag = ? OR asset_id_custom = ?)
      AND (? IS NULL OR asset_id != ?)
  `).get(assetTag, assetIdCustom, excludeAssetId, excludeAssetId);

  if (existing) {
    throw new AppError(409, "Asset tag or custom asset ID already exists");
  }
}

export const getAssets = async (req, res) => {
  const actor = getActor(req.user.id);
  const { status, category, assigned_to, search } = req.query;
  const scope = buildAssetScope(actor, { includeDisposed: true });

  let query = `${BASE_ASSET_QUERY} ${scope.clause}`;
  const params = [...scope.params];

  if (status) {
    query += " AND (a.status = ? OR a.status = ?)";
    params.push(status, status === "Assigned" ? "ASSIGNED" : status === "Available" ? "IN_STOCK" : status);
  }

  if (category) {
    query += " AND c.category_name = ?";
    params.push(category);
  }

  if (assigned_to) {
    query += " AND a.assigned_to = ?";
    params.push(assigned_to);
  }

  if (search) {
    query += `
      AND (
        a.asset_name LIKE ? OR
        a.asset_id_custom LIKE ? OR
        a.serial_number LIKE ? OR
        a.brand LIKE ? OR
        a.model LIKE ?
      )
    `;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  query += " ORDER BY a.created_at DESC";
  const assets = db.prepare(query).all(...params).map((asset) => mapAssetRow(asset));
  res.json(assets);
};

export const getAssetById = async (req, res) => {
  const actor = getActor(req.user.id);
  const assetId = parseAssetId(req.params.id);
  const asset = fetchAssetRow(assetId);
  assertAssetAccess(actor, asset);

  res.json({
    ...mapAssetRow(asset),
    vendorName: asset.vendor_name,
    createdByUsername: asset.created_by_username,
  });
};

export const createAsset = async (req, res) => {
  const actor = getActor(req.user.id);
  if (!["ADMIN", "SUPER_ADMIN"].includes(actor.role)) {
    throw new AppError(403, "Only administrators can create assets");
  }

  const {
    assetId,
    assetId_custom,
    name,
    category,
    category_id,
    status,
    assetStatus,
    serialNumber,
    brand,
    model,
    modelNumber,
    department,
    businessUnit,
    location,
    assignedTo,
    vendor,
    vendor_id,
    seatNo,
    seat,
  } = req.body;

  if (!serialNumber) {
    throw new AppError(400, "Serial Number is required");
  }

  ensureUniqueSerial(serialNumber);

  const finalCategoryId = resolveCategoryId(category, category_id);
  const finalVendorId = resolveVendorId(vendor, vendor_id);
  const assetTag = assetId || assetId_custom || `AST-${Date.now()}`;
  const customAssetId = assetId || assetId_custom || null;
  ensureUniqueAssetIdentifier(assetTag, customAssetId);

  const finalStatus = normalizeStatus(status || assetStatus, assignedTo ? "ASSIGNED" : "IN_STOCK");

  const result = db.prepare(`
    INSERT INTO assets (
      asset_tag, asset_id_custom, asset_name, category_id, brand, model, model_number,
      serial_number, status, assigned_to, created_by, vendor_id,
      seat_no, seat, business_unit, department, location
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    assetTag,
    customAssetId,
    sanitizeString(name) || customAssetId || assetTag || "Unnamed Asset",
    finalCategoryId,
    sanitizeString(brand),
    sanitizeString(model),
    sanitizeString(modelNumber),
    serialNumber,
    finalStatus,
    assignedTo || null,
    actor.user_id,
    finalVendorId,
    sanitizeString(seatNo),
    sanitizeString(seat) || sanitizeString(seatNo),
    sanitizeString(businessUnit),
    sanitizeString(department),
    sanitizeString(location)
  );

  const asset = fetchAssetRow(result.lastInsertRowid);

  recordAssetHistory(
    asset.asset_id,
    "CREATED",
    null,
    { assetId: asset.asset_id_custom || asset.asset_tag, name: asset.asset_name, status: asset.status },
    actor.user_id,
    "Asset created"
  );

  res.status(201).json({
    id: asset.asset_id,
    assetId: asset.asset_id_custom || asset.asset_tag,
    name: asset.asset_name,
    category: asset.category_name,
    status: asset.status,
    assetStatus: asset.status === "ASSIGNED" ? "Assigned" : asset.status === "IN_STOCK" ? "Available" : asset.status,
    ...asset,
  });
};

export const updateAsset = async (req, res) => {
  const actor = getActor(req.user.id);
  if (!["ADMIN", "SUPER_ADMIN"].includes(actor.role)) {
    throw new AppError(403, "Only administrators can update assets");
  }

  const assetId = parseAssetId(req.params.id);
  const currentAsset = db.prepare("SELECT * FROM assets WHERE asset_id = ?").get(assetId);
  if (!currentAsset) {
    throw new AppError(404, "Asset not found");
  }

  const body = req.body;
  const updates = [];
  const values = [];
  const changes = {};

  const fieldMapping = {
    assetId: "asset_id_custom",
    assetId_custom: "asset_id_custom",
    name: "asset_name",
    serialNumber: "serial_number",
    brand: "brand",
    model: "model",
    modelNumber: "model_number",
    make: "make",
    purchaseDate: "purchase_date",
    purchaseCost: "purchase_cost",
    price: "price",
    warranty: "warranty",
    warrantyExpiry: "warranty_expiry",
    department: "department",
    businessUnit: "business_unit",
    location: "location",
    ownership: "ownership",
    ownerOfAsset: "owner_of_asset",
    retiredDate: "retired_date",
    eolDate: "eol_date",
    lifeCycle: "life_cycle",
    gen: "gen",
    ram: "ram",
    hardisk: "hardisk",
    hardiskHealth: "hardisk_health",
    condition: "condition",
    conditionPhysical: "condition_physical",
    physicalCondition: "physical_condition",
    seatAsset: "seat_asset",
    seatNo: "seat_no",
    seat: "seat",
    invoiceNo: "invoice_no",
    remark: "remark",
    solution: "solution",
    key: "key_field",
    dayShift: "day_shift",
    employeeCodeDay: "employee_code_day",
    nightShift: "night_shift",
    employeeCodeNight: "employee_code_night",
    splitShift: "split_shift",
    employeeCodeSplit: "employee_code_split",
    usage: "usage",
    empName: "emp_name",
    employeeId: "employee_id_field",
  };

  if (body.serialNumber !== undefined) {
    ensureUniqueSerial(body.serialNumber, assetId);
  }

  if (body.assetId !== undefined || body.assetId_custom !== undefined) {
    const nextAssetId = sanitizeString(body.assetId) || sanitizeString(body.assetId_custom) || null;
    ensureUniqueAssetIdentifier(currentAsset.asset_tag, nextAssetId, assetId);
  }

  if (body.category !== undefined && body.category) {
    const nextCategoryId = resolveCategoryId(body.category, body.category_id);
    if (nextCategoryId !== currentAsset.category_id) {
      updates.push("category_id = ?");
      values.push(nextCategoryId);
      changes.category_id = { old: currentAsset.category_id, new: nextCategoryId };
    }
  }

  if (body.vendor !== undefined || body.vendor_id !== undefined) {
    const nextVendorId = resolveVendorId(body.vendor, body.vendor_id);
    if (nextVendorId !== currentAsset.vendor_id) {
      updates.push("vendor_id = ?");
      values.push(nextVendorId);
      changes.vendor_id = { old: currentAsset.vendor_id, new: nextVendorId };
    }
  }

  let statusUpdated = false;
  let assignedUpdated = false;

  if (body.status !== undefined || body.assetStatus !== undefined) {
    const nextStatus = normalizeStatus(body.status || body.assetStatus, currentAsset.status);
    if (nextStatus !== currentAsset.status) {
      updates.push("status = ?");
      values.push(nextStatus);
      changes.status = { old: currentAsset.status, new: nextStatus };
      statusUpdated = true;

      if (nextStatus === "IN_STOCK" && currentAsset.assigned_to) {
        updates.push("assigned_to = NULL");
        changes.assigned_to = { old: currentAsset.assigned_to, new: null };
        assignedUpdated = true;
      }
    }
  }

  if (body.assignedTo !== undefined && !assignedUpdated) {
    const nextAssignedTo = body.assignedTo === null || body.assignedTo === "" ? null : Number.parseInt(body.assignedTo, 10);
    if (nextAssignedTo !== currentAsset.assigned_to) {
      if (nextAssignedTo === null) {
        updates.push("assigned_to = NULL");
      } else {
        updates.push("assigned_to = ?");
        values.push(nextAssignedTo);
      }
      changes.assigned_to = { old: currentAsset.assigned_to, new: nextAssignedTo };
      assignedUpdated = true;

      if (!statusUpdated) {
        updates.push("status = ?");
        values.push(nextAssignedTo ? "ASSIGNED" : "IN_STOCK");
        changes.status = { old: currentAsset.status, new: nextAssignedTo ? "ASSIGNED" : "IN_STOCK" };
      }
    }
  }

  Object.keys(body).forEach((key) => {
    if (["id", "status", "assetStatus", "assignedTo", "category", "category_id", "vendor", "vendor_id"].includes(key)) {
      return;
    }

    const dbField = fieldMapping[key];
    if (!dbField) {
      return;
    }

    const nextValue = sanitizeString(body[key]);
    if (nextValue !== currentAsset[dbField]) {
      updates.push(`${dbField} = ?`);
      values.push(nextValue);
      changes[key] = { old: currentAsset[dbField], new: nextValue };
    }
  });

  if (updates.length === 0) {
    return res.json(mapAssetRow(fetchAssetRow(assetId)));
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(assetId);

  db.prepare(`UPDATE assets SET ${updates.join(", ")} WHERE asset_id = ?`).run(...values);

  const updatedAsset = fetchAssetRow(assetId);
  recordAssetHistory(assetId, "UPDATED", currentAsset, changes, actor.user_id, "Asset details updated");

  res.json({
    id: updatedAsset.asset_id,
    assetId: updatedAsset.asset_id_custom || updatedAsset.asset_tag,
    name: updatedAsset.asset_name,
    category: updatedAsset.category_name,
    status: updatedAsset.status,
    assetStatus: updatedAsset.status === "ASSIGNED" ? "Assigned" : updatedAsset.status === "IN_STOCK" ? "Available" : updatedAsset.status,
    assignedTo: updatedAsset.assigned_to,
    assigned_to_name: updatedAsset.assigned_to_name,
    assigned_to_username: updatedAsset.assigned_to_username,
    assigned_to_employee_id: updatedAsset.assigned_to_employee_id,
    assigned_to_department: updatedAsset.assigned_to_department,
    ...updatedAsset,
  });
};

export const deleteAsset = async (req, res) => {
  const actor = getActor(req.user.id);
  if (!["ADMIN", "SUPER_ADMIN"].includes(actor.role)) {
    throw new AppError(403, "Only administrators can delete assets");
  }

  const assetId = parseAssetId(req.params.id);
  const asset = db.prepare("SELECT * FROM assets WHERE asset_id = ?").get(assetId);
  if (!asset) {
    throw new AppError(404, "Asset not found");
  }

  db.prepare("UPDATE assets SET status = 'DISPOSED', updated_at = CURRENT_TIMESTAMP WHERE asset_id = ?").run(assetId);

  recordAssetHistory(
    assetId,
    "DELETED",
    asset,
    { status: "DISPOSED" },
    actor.user_id,
    "Asset deleted (disposed)"
  );

  res.json({ message: "Asset deleted successfully" });
};

export const getAssetHistory = async (req, res) => {
  const actor = getActor(req.user.id);
  const assetId = parseAssetId(req.params.id);
  const asset = fetchAssetRow(assetId);
  assertAssetAccess(actor, asset);
  res.json(fetchHistory(assetId));
};

export const getAssetSummary = async (req, res) => {
  const actor = getActor(req.user.id);
  const scope = buildAssetScope(actor, { includeDisposed: true });

  const byStatus = db.prepare(`
    SELECT a.status, COUNT(*) AS count
    FROM assets a
    LEFT JOIN users assigned_user ON a.assigned_to = assigned_user.user_id
    WHERE 1=1 ${scope.clause}
    GROUP BY a.status
    ORDER BY count DESC
  `).all(...scope.params);

  const byCategory = db.prepare(`
    SELECT c.category_name AS category, COUNT(*) AS count
    FROM assets a
    LEFT JOIN asset_categories c ON a.category_id = c.category_id
    LEFT JOIN users assigned_user ON a.assigned_to = assigned_user.user_id
    WHERE 1=1 ${scope.clause}
    GROUP BY c.category_name
    ORDER BY count DESC
  `).all(...scope.params);

  const expiringWarranty = db.prepare(`
    SELECT COUNT(*) AS count
    FROM assets a
    LEFT JOIN users assigned_user ON a.assigned_to = assigned_user.user_id
    WHERE a.warranty_expiry IS NOT NULL
      AND date(a.warranty_expiry) BETWEEN date('now') AND date('now', '+90 day')
      ${scope.clause}
  `).get(...scope.params);

  res.json({
    byStatus,
    byCategory,
    expiringWarrantyCount: expiringWarranty.count,
  });
};

export const exportAssetsCsv = async (req, res) => {
  const actor = getActor(req.user.id);
  const scope = buildAssetScope(actor, { includeDisposed: true });
  const rows = db.prepare(`${BASE_ASSET_QUERY} ${scope.clause} ORDER BY a.updated_at DESC`).all(...scope.params);
  const mapped = rows.map((asset) => mapAssetRow(asset));

  const headers = ["Asset ID", "Name", "Category", "Status", "Serial Number", "Department", "Business Unit", "Assigned To", "Warranty Expiry"];
  const dataRows = mapped.map((asset) => [
    asset.assetId,
    asset.name,
    asset.category,
    asset.assetStatus,
    asset.serialNumber,
    asset.department,
    asset.businessUnit,
    asset.assigned_to_name || asset.assigned_to_username,
    asset.warrantyExpiry,
  ]);

  const csv = [headers, ...dataRows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="asset-export-${Date.now()}.csv"`);
  res.send(csv);
};
