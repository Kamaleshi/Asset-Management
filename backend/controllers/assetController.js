import db from "../database/db.js";
import { recordAssetHistory, getAssetHistory as fetchHistory } from "../database/auditTrail.js";

// Get all assets with filters
export const getAssets = (req, res) => {
  try {
    const { status, category, assigned_to, search } = req.query;
    let query = `
      SELECT 
        a.*,
        c.category_name,
        u.username as assigned_to_username,
        u.full_name as assigned_to_name,
        u.employee_id as assigned_to_employee_id,
        u.department as assigned_to_department
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.category_id
      LEFT JOIN users u ON a.assigned_to = u.user_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += ` AND (a.status = ? OR a.status = ?)`;
      params.push(status, status === "Assigned" ? "ASSIGNED" : status === "Available" ? "IN_STOCK" : status);
    }
    
    if (category) {
      query += ` AND c.category_name = ?`;
      params.push(category);
    }
    
    if (assigned_to) {
      query += ` AND a.assigned_to = ?`;
      params.push(assigned_to);
    }
    
    if (search) {
      query += ` AND (
        a.asset_name LIKE ? OR 
        a.asset_id_custom LIKE ? OR 
        a.serial_number LIKE ? OR
        a.brand LIKE ? OR
        a.model LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    query += ` ORDER BY a.created_at DESC`;
    
    let assets;
    try {
      assets = db.prepare(query).all(...params);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      // If query fails, try simpler query
      assets = db.prepare(`
        SELECT 
          a.*,
          c.category_name,
          u.username as assigned_to_username,
          u.full_name as assigned_to_name,
          u.employee_id as assigned_to_employee_id,
          u.department as assigned_to_department
        FROM assets a
        LEFT JOIN asset_categories c ON a.category_id = c.category_id
        LEFT JOIN users u ON a.assigned_to = u.user_id
        ORDER BY a.created_at DESC
      `).all();
    }
    
    // Format response to match frontend expectations
    const formattedAssets = assets.map(asset => ({
      id: asset.asset_id,
      assetId: asset.asset_id_custom || asset.asset_tag,
      name: asset.asset_name,
      category: asset.category_name || asset.category_id,
      status: asset.status,
      assetStatus: asset.status === "ASSIGNED" ? "Assigned" : asset.status === "IN_STOCK" ? "Available" : asset.status,
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
      vendor: asset.vendor_id ? "Vendor ID: " + asset.vendor_id : null,
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
    }));
    
    res.json(formattedAssets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ message: "Error fetching assets" });
  }
};

// Get asset by ID
export const getAssetById = (req, res) => {
  try {
    const { id } = req.params;
    
    const asset = db.prepare(`
      SELECT 
        a.*,
        c.category_name,
        u.username as assigned_to_username,
        u.full_name as assigned_to_name,
        u.employee_id as assigned_to_employee_id,
        u.department as assigned_to_department,
        v.vendor_name,
        creator.username as created_by_username
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.category_id
      LEFT JOIN users u ON a.assigned_to = u.user_id
      LEFT JOIN vendors v ON a.vendor_id = v.vendor_id
      LEFT JOIN users creator ON a.created_by = creator.user_id
      WHERE a.asset_id = ?
    `).get(parseInt(id));
    
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }
    
    // Format response
    const formattedAsset = {
      id: asset.asset_id,
      assetId: asset.asset_id_custom || asset.asset_tag,
      name: asset.asset_name,
      category: asset.category_name,
      status: asset.status,
      assetStatus: asset.status === "ASSIGNED" ? "Assigned" : asset.status === "IN_STOCK" ? "Available" : asset.status,
      assignedTo: asset.assigned_to,
      assigned_to_name: asset.assigned_to_name,
      assigned_to_username: asset.assigned_to_username,
      assigned_to_employee_id: asset.assigned_to_employee_id,
      assigned_to_department: asset.assigned_to_department,
      ...asset, // Include all other fields
    };
    
    res.json(formattedAsset);
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).json({ message: "Error fetching asset" });
  }
};

// Create asset
export const createAsset = (req, res) => {
  try {
    const userId = req.user.id;
    const {
      assetId, assetId_custom, name, category, status, assetStatus,
      serialNumber, brand, model, modelNumber, make,
      purchaseDate, purchaseCost, price, warranty, warrantyExpiry,
      department, businessUnit, location,
      assignedTo, category_id,
      // Additional fields
      ownership, ownerOfAsset, retiredDate, eolDate, lifeCycle,
      gen, ram, hardisk, hardiskHealth,
      condition, conditionPhysical, physicalCondition,
      seatAsset, seatNo, seat,
      vendor, vendor_id, invoiceNo,
      remark, solution, key,
      dayShift, employeeCodeDay, nightShift, employeeCodeNight,
      splitShift, employeeCodeSplit, usage,
      empName, employeeId,
    } = req.body;
    
    // Validate required fields
    if (!serialNumber) {
      return res.status(400).json({ message: "Serial Number is required" });
    }
    
    // Check for duplicate serial number
    const existing = db.prepare("SELECT asset_id FROM assets WHERE serial_number = ?").get(serialNumber);
    if (existing) {
      return res.status(400).json({ message: "Serial number already exists" });
    }
    
    // Get or create category
    let finalCategoryId = category_id;
    if (!finalCategoryId && category) {
      let cat = db.prepare("SELECT category_id FROM asset_categories WHERE category_name = ?").get(category);
      if (!cat) {
        // Create category if it doesn't exist
        const insertCat = db.prepare("INSERT INTO asset_categories (category_name) VALUES (?)");
        const result = insertCat.run(category);
        finalCategoryId = result.lastInsertRowid;
      } else {
        finalCategoryId = cat.category_id;
      }
    }
    
    // Get vendor ID if vendor name provided
    let finalVendorId = vendor_id;
    if (!finalVendorId && vendor) {
      let vend = db.prepare("SELECT vendor_id FROM vendors WHERE vendor_name = ?").get(vendor);
      if (!vend) {
        const insertVend = db.prepare("INSERT INTO vendors (vendor_name) VALUES (?)");
        const result = insertVend.run(vendor);
        finalVendorId = result.lastInsertRowid;
      } else {
        finalVendorId = vend.vendor_id;
      }
    }
    
    // Generate asset tag if not provided
    const assetTag = assetId || assetId_custom || `AST-${Date.now()}`;

    // Check for duplicate asset tag or custom asset id
    const checkTagValue = assetId || assetId_custom || assetTag;
    const existingTag = db.prepare("SELECT asset_id FROM assets WHERE asset_tag = ? OR asset_id_custom = ?").get(assetTag, checkTagValue);
    if (existingTag) {
      return res.status(409).json({ message: "Asset tag or custom asset ID already exists" });
    }
    
    // Determine status - map frontend values to database values
    let finalStatus = status || assetStatus || (assignedTo ? "ASSIGNED" : "IN_STOCK");
    if (finalStatus === "Assigned") {
      finalStatus = "ASSIGNED";
    } else if (finalStatus === "Available") {
      finalStatus = "IN_STOCK";
    } else if (finalStatus === "Repair") {
      finalStatus = "REPAIR";
    } else if (finalStatus === "Misuse") {
      finalStatus = "MISUSE";
    } else if (finalStatus === "Scrap") {
      finalStatus = "SCRAP";
    } else if (finalStatus && !finalStatus.includes("_")) {
      finalStatus = finalStatus.toUpperCase();
    }
    
    // Insert asset - using only essential fields
    const stmt = db.prepare(`
      INSERT INTO assets (
        asset_tag, asset_id_custom, asset_name, category_id, brand, model, model_number,
        serial_number, status, assigned_to, created_by,
        seat_no, seat, business_unit, department
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      assetTag || null, 
      assetId || assetId_custom || null, 
      name || assetId || assetTag || "Unnamed Asset", 
      finalCategoryId || null, 
      brand || null, 
      model || null, 
      modelNumber || null,
      serialNumber, 
      finalStatus || "IN_STOCK", 
      assignedTo || null, 
      userId,
      seatNo || null, 
      seat || seatNo || null,
      businessUnit || null, 
      department || null
    );
    
    if (!result || !result.lastInsertRowid) {
      throw new Error("Failed to insert asset into database");
    }
    
    const newAssetId = result.lastInsertRowid;
    
    // Record history
    recordAssetHistory(
      newAssetId,
      "CREATED",
      null,
      { assetId: assetTag, name: name || assetId, status: finalStatus },
      userId,
      "Asset created"
    );
    
    // Return created asset
    const createdAsset = db.prepare(`
      SELECT 
        a.*,
        c.category_name,
        u.username as assigned_to_username,
        u.full_name as assigned_to_name
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.category_id
      LEFT JOIN users u ON a.assigned_to = u.user_id
      WHERE a.asset_id = ?
    `).get(newAssetId);
    
    res.status(201).json({
      id: createdAsset.asset_id,
      assetId: createdAsset.asset_id_custom || createdAsset.asset_tag,
      name: createdAsset.asset_name,
      category: createdAsset.category_name,
      status: createdAsset.status,
      assetStatus: createdAsset.status === "ASSIGNED" ? "Assigned" : createdAsset.status === "IN_STOCK" ? "Available" : createdAsset.status,
      ...createdAsset,
    });
  } catch (error) {
    console.error("Error creating asset:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    const errorMessage = error.message || "Error creating asset";
    res.status(500).json({ 
      message: "Error creating asset", 
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// Update asset
export const updateAsset = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const body = req.body;
    
    // Get current asset
    const currentAsset = db.prepare("SELECT * FROM assets WHERE asset_id = ?").get(parseInt(id));
    if (!currentAsset) {
      return res.status(404).json({ message: "Asset not found" });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    const changes = {};
    
    // Map frontend field names to database column names
    const fieldMapping = {
      assetId: "asset_id_custom",
      assetId_custom: "asset_id_custom",
      name: "asset_name",
      category: "category_id", // Will need special handling
      status: "status",
      assetStatus: "status",
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
      assignedTo: "assigned_to",
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
    
    // Handle status and assignedTo specially
    let statusUpdated = false;
    let assignedToUpdated = false;
    
    if (body.status !== undefined || body.assetStatus !== undefined) {
      const newStatus = body.status || body.assetStatus;
      // Map frontend status values to database values (handle both capitalized and uppercase)
      let dbStatus;
      const statusLower = (newStatus || "").toLowerCase();
      
      if (statusLower === "assigned" || newStatus === "ASSIGNED") {
        dbStatus = "ASSIGNED";
      } else if (statusLower === "available" || newStatus === "IN_STOCK" || newStatus === "AVAILABLE") {
        dbStatus = "IN_STOCK";
      } else if (statusLower === "repair" || newStatus === "REPAIR") {
        dbStatus = "REPAIR";
      } else if (statusLower === "misuse" || newStatus === "MISUSE") {
        dbStatus = "MISUSE";
      } else if (statusLower === "scrap" || newStatus === "SCRAP") {
        dbStatus = "SCRAP";
      } else if (newStatus) {
        // If it's already in database format, use it; otherwise convert to uppercase
        dbStatus = newStatus.toUpperCase();
      } else {
        dbStatus = currentAsset.status; // Keep current status if no valid status provided
      }
      
      if (dbStatus !== currentAsset.status) {
        updateFields.push("status = ?");
        updateValues.push(dbStatus);
        changes.status = { old: currentAsset.status, new: dbStatus };
        statusUpdated = true;
        
        // If changing to Available/IN_STOCK, unassign
        if (dbStatus === "IN_STOCK" || dbStatus === "AVAILABLE") {
          if (currentAsset.assigned_to) {
            updateFields.push("assigned_to = NULL");
            changes.assigned_to = { old: currentAsset.assigned_to, new: null };
            assignedToUpdated = true;
          }
        }
      }
    }
    
    if (body.assignedTo !== undefined && !assignedToUpdated) {
      const newAssignedTo = body.assignedTo === null || body.assignedTo === "" ? null : parseInt(body.assignedTo);
      if (newAssignedTo !== currentAsset.assigned_to) {
        if (newAssignedTo === null) {
          updateFields.push("assigned_to = NULL");
        } else {
          updateFields.push("assigned_to = ?");
          updateValues.push(newAssignedTo);
        }
        changes.assigned_to = { old: currentAsset.assigned_to, new: newAssignedTo };
        assignedToUpdated = true;
        
        // Auto-update status based on assignment
        if (newAssignedTo && !statusUpdated) {
          updateFields.push("status = ?");
          updateValues.push("ASSIGNED");
          changes.status = { old: currentAsset.status, new: "ASSIGNED" };
        } else if (!newAssignedTo && !statusUpdated) {
          updateFields.push("status = ?");
          updateValues.push("IN_STOCK");
          changes.status = { old: currentAsset.status, new: "IN_STOCK" };
        }
      }
    }
    
    // Handle category specially
    if (body.category !== undefined && body.category) {
      let cat = db.prepare("SELECT category_id FROM asset_categories WHERE category_name = ?").get(body.category);
      if (cat && cat.category_id !== currentAsset.category_id) {
        updateFields.push("category_id = ?");
        updateValues.push(cat.category_id);
        changes.category_id = { old: currentAsset.category_id, new: cat.category_id };
      }
    }
    
    // Handle other fields
    Object.keys(body).forEach((key) => {
      if (key !== "id" && key !== "status" && key !== "assetStatus" && key !== "assignedTo" && key !== "category" && fieldMapping[key]) {
        const dbField = fieldMapping[key];
        const newValue = body[key] !== undefined ? (body[key] || null) : undefined;
        
        if (newValue !== undefined && newValue !== currentAsset[dbField]) {
          updateFields.push(`${dbField} = ?`);
          updateValues.push(newValue);
          changes[key] = { old: currentAsset[dbField], new: newValue };
        }
      }
    });
    
    if (updateFields.length === 0) {
      return res.json(currentAsset);
    }
    
    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(parseInt(id));
    
    // Execute update
    const updateQuery = `UPDATE assets SET ${updateFields.join(", ")} WHERE asset_id = ?`;
    
    try {
      db.prepare(updateQuery).run(...updateValues);
    } catch (dbError) {
      console.error("Database update error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
    
    // Record history for significant changes
    if (changes.status || changes.assigned_to) {
      const action = changes.assigned_to ? 
        (changes.assigned_to.new ? "ASSIGNED" : "UNASSIGNED") : 
        "STATUS_CHANGE";
      
      recordAssetHistory(
        parseInt(id),
        action,
        changes.assigned_to ? { assigned_to: changes.assigned_to.old } : { status: changes.status.old },
        changes.assigned_to ? { assigned_to: changes.assigned_to.new } : { status: changes.status.new },
        userId,
        action === "ASSIGNED" ? "Asset assigned to user" : action === "UNASSIGNED" ? "Asset unassigned" : "Status changed"
      );
    } else {
      recordAssetHistory(
        parseInt(id),
        "UPDATED",
        currentAsset,
        body,
        userId,
        "Asset details updated"
      );
    }
    
    // Return updated asset
    const updatedAsset = db.prepare(`
      SELECT 
        a.*,
        c.category_name,
        u.username as assigned_to_username,
        u.full_name as assigned_to_name,
        u.employee_id as assigned_to_employee_id,
        u.department as assigned_to_department
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.category_id
      LEFT JOIN users u ON a.assigned_to = u.user_id
      WHERE a.asset_id = ?
    `).get(parseInt(id));
    
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
  } catch (error) {
    console.error("Error updating asset:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    console.error("Asset ID:", req.params.id);
    const errorMessage = error.message || "Error updating asset";
    res.status(500).json({ 
      message: "Error updating asset", 
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// Delete asset (soft delete by setting status to DISPOSED)
export const deleteAsset = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const asset = db.prepare("SELECT * FROM assets WHERE asset_id = ?").get(parseInt(id));
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }
    
    // Soft delete - set status to DISPOSED
    db.prepare("UPDATE assets SET status = 'DISPOSED', updated_at = CURRENT_TIMESTAMP WHERE asset_id = ?").run(parseInt(id));
    
    // Record history
    recordAssetHistory(
      parseInt(id),
      "DELETED",
      asset,
      { status: "DISPOSED" },
      userId,
      "Asset deleted (disposed)"
    );
    
    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ message: "Error deleting asset" });
  }
};

// Get asset history
export const getAssetHistory = (req, res) => {
  try {
    const { id } = req.params;
    const history = fetchHistory(parseInt(id));
    res.json(history);
  } catch (error) {
    console.error("Error fetching asset history:", error);
    res.status(500).json({ message: "Error fetching asset history" });
  }
};
