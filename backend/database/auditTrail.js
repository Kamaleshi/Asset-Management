import db from "./db.js";

/**
 * Record asset history/audit trail
 * @param {number} assetId - Asset ID
 * @param {string} action - Action type (ASSIGNED, UNASSIGNED, STATUS_CHANGE, CREATED, UPDATED, DELETED)
 * @param {any} oldValue - Previous value
 * @param {any} newValue - New value
 * @param {number} performedBy - User ID who performed the action
 * @param {string} notes - Additional notes
 */
export function recordAssetHistory(assetId, action, oldValue, newValue, performedBy, notes = null) {
  try {
    const stmt = db.prepare(`
      INSERT INTO asset_history (asset_id, action, old_value, new_value, performed_by, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      assetId,
      action,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      performedBy,
      notes
    );
  } catch (error) {
    console.error("Error recording asset history:", error);
  }
}

/**
 * Get asset history
 * @param {number} assetId - Asset ID
 * @returns {Array} History records
 */
export function getAssetHistory(assetId) {
  try {
    const stmt = db.prepare(`
      SELECT 
        h.*,
        u.username,
        u.full_name
      FROM asset_history h
      LEFT JOIN users u ON h.performed_by = u.user_id
      WHERE h.asset_id = ?
      ORDER BY h.performed_at DESC
    `);
    
    return stmt.all(assetId).map(record => ({
      ...record,
      old_value: record.old_value ? JSON.parse(record.old_value) : null,
      new_value: record.new_value ? JSON.parse(record.new_value) : null,
    }));
  } catch (error) {
    console.error("Error fetching asset history:", error);
    return [];
  }
}

/**
 * Get all history records (for audit purposes)
 * @param {number} limit - Limit number of records
 * @param {number} offset - Offset for pagination
 * @returns {Array} History records
 */
export function getAllHistory(limit = 100, offset = 0) {
  try {
    const stmt = db.prepare(`
      SELECT 
        h.*,
        a.asset_name,
        a.asset_id_custom,
        u.username,
        u.full_name
      FROM asset_history h
      LEFT JOIN assets a ON h.asset_id = a.asset_id
      LEFT JOIN users u ON h.performed_by = u.user_id
      ORDER BY h.performed_at DESC
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(limit, offset).map(record => ({
      ...record,
      old_value: record.old_value ? JSON.parse(record.old_value) : null,
      new_value: record.new_value ? JSON.parse(record.new_value) : null,
    }));
  } catch (error) {
    console.error("Error fetching all history:", error);
    return [];
  }
}

