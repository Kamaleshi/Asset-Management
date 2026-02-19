import db from "../database/db.js";
import { recordAssetHistory } from "../database/auditTrail.js";
import * as XLSX from "xlsx/xlsx.mjs";

/**
 * Import assets from Excel file
 * POST /api/assets/import
 */
export const importAssets = (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Read Excel file
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    
    if (jsonData.length === 0) {
      return res.status(400).json({ message: "Excel file is empty" });
    }
    
    // Create import log
    const importLogStmt = db.prepare(`
      INSERT INTO asset_import_logs (file_name, uploaded_by, total_records, status)
      VALUES (?, ?, ?, 'PROCESSING')
    `);
    const importResult = importLogStmt.run(file.originalname, userId, jsonData.length);
    const importId = importResult.lastInsertRowid;
    
    const results = {
      success: [],
      errors: [],
    };
    
    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and header is row 1
      
      try {
        // Map Excel columns to database fields
        const assetData = mapExcelRowToAsset(row);
        
        // Validate required fields
        if (!assetData.serialNumber) {
          throw new Error("Serial Number is required");
        }
        
        // Check for duplicate serial number
        const existing = db.prepare("SELECT asset_id FROM assets WHERE serial_number = ?").get(assetData.serialNumber);
        if (existing) {
          throw new Error(`Serial number ${assetData.serialNumber} already exists`);
        }
        
        // Get or create category
        let categoryId = null;
        if (assetData.category) {
          let cat = db.prepare("SELECT category_id FROM asset_categories WHERE category_name = ?").get(assetData.category);
          if (!cat) {
            const insertCat = db.prepare("INSERT INTO asset_categories (category_name) VALUES (?)");
            const result = insertCat.run(assetData.category);
            categoryId = result.lastInsertRowid;
          } else {
            categoryId = cat.category_id;
          }
        }
        
        // Get or create vendor
        let vendorId = null;
        if (assetData.vendor) {
          let vend = db.prepare("SELECT vendor_id FROM vendors WHERE vendor_name = ?").get(assetData.vendor);
          if (!vend) {
            const insertVend = db.prepare("INSERT INTO vendors (vendor_name) VALUES (?)");
            const result = insertVend.run(assetData.vendor);
            vendorId = result.lastInsertRowid;
          } else {
            vendorId = vend.vendor_id;
          }
        }
        
        // Get assigned user if email provided
        let assignedTo = null;
        if (assetData.assignedToEmail) {
          const user = db.prepare("SELECT user_id FROM users WHERE email = ?").get(assetData.assignedToEmail);
          if (user) {
            assignedTo = user.user_id;
          }
        }
        
        // Generate asset tag
        const assetTag = assetData.assetId || assetData.assetTag || `AST-${Date.now()}-${i}`;
        
        // Determine status
        const status = assignedTo ? "ASSIGNED" : (assetData.status || "IN_STOCK");
        
        // Insert asset
        const insertStmt = db.prepare(`
          INSERT INTO assets (
            asset_tag, asset_id_custom, asset_name, category_id, brand, model, model_number,
            serial_number, purchase_date, purchase_cost, price, warranty, warranty_expiry,
            vendor_id, status, location, assigned_to, created_by,
            ownership, business_unit, department
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const insertResult = insertStmt.run(
          assetTag,
          assetData.assetId || assetTag,
          assetData.name || assetData.assetName || assetTag,
          categoryId,
          assetData.brand,
          assetData.model,
          assetData.modelNumber,
          assetData.serialNumber,
          assetData.purchaseDate || null,
          assetData.purchaseCost || assetData.cost || assetData.price || null,
          assetData.price || assetData.purchaseCost || assetData.cost || null,
          assetData.warranty,
          assetData.warrantyExpiry || null,
          vendorId,
          status,
          assetData.location,
          assignedTo,
          userId,
          assetData.ownership,
          assetData.businessUnit,
          assetData.department
        );
        
        const newAssetId = insertResult.lastInsertRowid;
        
        // Record history
        recordAssetHistory(
          newAssetId,
          "CREATED",
          null,
          { assetId: assetTag, name: assetData.name, status: status, source: "Excel Import" },
          userId,
          `Imported from Excel - Row ${rowNumber}`
        );
        
        results.success.push({
          row: rowNumber,
          assetId: assetTag,
          assetName: assetData.name || assetTag,
        });
      } catch (error) {
        // Record error
        const errorStmt = db.prepare(`
          INSERT INTO asset_import_errors (import_id, row_number, error_message, row_data)
          VALUES (?, ?, ?, ?)
        `);
        errorStmt.run(importId, rowNumber, error.message, JSON.stringify(row));
        
        results.errors.push({
          row: rowNumber,
          error: error.message,
          data: row,
        });
      }
    }
    
    // Update import log
    const updateLogStmt = db.prepare(`
      UPDATE asset_import_logs 
      SET success_records = ?, failed_records = ?, status = ?
      WHERE import_id = ?
    `);
    updateLogStmt.run(
      results.success.length,
      results.errors.length,
      results.errors.length === jsonData.length ? "FAILED" : "COMPLETED",
      importId
    );
    
    res.json({
      importId,
      totalRecords: jsonData.length,
      successCount: results.success.length,
      failedCount: results.errors.length,
      success: results.success,
      errors: results.errors,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ message: "Error importing assets", error: error.message });
  }
};

/**
 * Map Excel row to asset data structure
 */
function mapExcelRowToAsset(row) {
  const mapping = {
    // Asset identification
    "Asset Name": "name",
    "Asset ID": "assetId",
    "Asset Tag": "assetTag",
    "Serial Number": "serialNumber",
    "Serial No": "serialNumber",
    
    // Category and type
    "Category": "category",
    "Type": "category",
    
    // Brand and model
    "Brand": "brand",
    "Make": "brand",
    "Model": "model",
    "Model Number": "modelNumber",
    
    // Dates and costs
    "Purchase Date": "purchaseDate",
    "Purchase Cost": "purchaseCost",
    "Cost": "cost",
    "Price": "price",
    "Warranty": "warranty",
    "Warranty Expiry": "warrantyExpiry",
    
    // Assignment
    "Assigned To": "assignedToEmail",
    "Assigned To (Email)": "assignedToEmail",
    "Email": "assignedToEmail",
    
    // Location
    "Location": "location",
    "Department": "department",
    "Business Unit": "businessUnit",
    
    // Vendor
    "Vendor": "vendor",
    "Vendor Name": "vendor",
    
    // Status
    "Status": "status",
    
    // Ownership
    "Ownership": "ownership",
  };
  
  const assetData = {};
  
  // Map known columns
  Object.keys(row).forEach((key) => {
    const normalizedKey = key.trim();
    const mappedField = mapping[normalizedKey];
    if (mappedField) {
      assetData[mappedField] = row[key];
    }
  });
  
  // Also try case-insensitive matching
  Object.keys(mapping).forEach((excelCol) => {
    const lowerExcelCol = excelCol.toLowerCase();
    Object.keys(row).forEach((key) => {
      if (key.toLowerCase() === lowerExcelCol && !assetData[mapping[excelCol]]) {
        assetData[mapping[excelCol]] = row[key];
      }
    });
  });
  
  return assetData;
}

/**
 * Get import logs
 * GET /api/assets/import/logs
 */
export const getImportLogs = (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT 
        il.*,
        u.username,
        u.full_name
      FROM asset_import_logs il
      LEFT JOIN users u ON il.uploaded_by = u.user_id
      ORDER BY il.created_at DESC
      LIMIT 50
    `).all();
    
    res.json(logs);
  } catch (error) {
    console.error("Error fetching import logs:", error);
    res.status(500).json({ message: "Error fetching import logs" });
  }
};

/**
 * Get import errors for a specific import
 * GET /api/assets/import/:importId/errors
 */
export const getImportErrors = (req, res) => {
  try {
    const { importId } = req.params;
    
    const errors = db.prepare(`
      SELECT *
      FROM asset_import_errors
      WHERE import_id = ?
      ORDER BY row_number
    `).all(parseInt(importId));
    
    // Parse row_data JSON
    const formattedErrors = errors.map(err => ({
      ...err,
      row_data: err.row_data ? JSON.parse(err.row_data) : null,
    }));
    
    res.json(formattedErrors);
  } catch (error) {
    console.error("Error fetching import errors:", error);
    res.status(500).json({ message: "Error fetching import errors" });
  }
};

