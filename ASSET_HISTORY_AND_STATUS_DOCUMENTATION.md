# Asset History and Status Management - Implementation Documentation

## Overview
This document describes the implementation of asset change history tracking and new status options for the Asset Management system. These features allow administrators to track all modifications made to assets and manage assets with additional status options.

---

## Table of Contents
1. [Features Added](#features-added)
2. [Changes Made](#changes-made)
3. [How to Use](#how-to-use)
4. [Technical Details](#technical-details)
5. [Files Modified](#files-modified)

---

## Features Added

### 1. Asset History/Audit Trail
- **Purpose**: Track all changes made to assets with complete audit information
- **Who Can Access**: Only Admin and SUPER_ADMIN roles
- **What is Tracked**:
  - Asset creation
  - Asset updates (field changes)
  - Status changes
  - Assignment/unassignment
  - Asset deletion
  - User who made the change
  - Timestamp of change
  - Old and new values

### 2. New Asset Status Options
- **Purpose**: Better asset lifecycle management with more granular status tracking
- **New Statuses Added**:
  - **Assigned**: Asset is assigned to a user
  - **Available (In Stock)**: Asset is available for assignment
  - **Repair**: Asset is under repair
  - **Misuse**: Asset is being misused (flagged for review)
  - **Scrap**: Asset is scrapped/disposed

---

## Changes Made

### 1. Database Schema Updates

#### File: `backend/database/schema.sql`

**Change**: Updated asset status CHECK constraint to include new status options

**Before**:
```sql
status VARCHAR(50) CHECK (
    status IN ('NEW','IN_STOCK','ASSIGNED','MAINTENANCE','LOST','RETIRED','DISPOSED','Available','Assigned')
) DEFAULT 'IN_STOCK',
```

**After**:
```sql
status VARCHAR(50) CHECK (
    status IN ('NEW','IN_STOCK','ASSIGNED','MAINTENANCE','LOST','RETIRED','DISPOSED','REPAIR','MISUSE','SCRAP','Available','Assigned')
) DEFAULT 'IN_STOCK',
```

**Why**: To allow assets to be marked with the new status options (REPAIR, MISUSE, SCRAP)

**Note**: The `asset_history` table already existed in the schema, so no changes were needed there.

---

### 2. Backend API Updates

#### File: `backend/routes/assets.js`

**Change**: Added role protection to asset history endpoint

**Before**:
```javascript
router.get("/:id/history", authMiddleware, getAssetHistory);
```

**After**:
```javascript
router.get("/:id/history", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN"]), getAssetHistory);
```

**Why**: To restrict asset history access to only administrators, ensuring sensitive audit information is only visible to authorized users.

---

#### File: `backend/controllers/assetController.js`

**Changes Made**:

1. **Status Mapping in `createAsset` function** (Line ~254)
   - Added mapping for new status values (Repair, Misuse, Scrap)
   - Maps frontend-friendly names to database values

2. **Status Mapping in `updateAsset` function** (Line ~408-410)
   - Enhanced status mapping to handle all new status options
   - Properly converts frontend status values to database format

**Code Added**:
```javascript
// Map frontend status values to database values
let dbStatus;
if (newStatus === "Assigned") {
  dbStatus = "ASSIGNED";
} else if (newStatus === "Available") {
  dbStatus = "IN_STOCK";
} else if (newStatus === "Repair") {
  dbStatus = "REPAIR";
} else if (newStatus === "Misuse") {
  dbStatus = "MISUSE";
} else if (newStatus === "Scrap") {
  dbStatus = "SCRAP";
} else {
  dbStatus = newStatus.toUpperCase();
}
```

**Why**: To ensure frontend status values are correctly converted to database format and vice versa.

---

### 3. Frontend Updates

#### File: `frontend/src/pages/Assets.js`

**Changes Made**:

1. **New State Variables** (Lines ~19-21)
   ```javascript
   const [showHistoryModal, setShowHistoryModal] = useState(false);
   const [assetHistory, setAssetHistory] = useState([]);
   const [historyLoading, setHistoryLoading] = useState(false);
   ```
   **Why**: To manage the history modal state and loading status

2. **New Import** (Line ~7)
   ```javascript
   import { Plus, Trash2, UserCheck, UserX, X, Edit, History } from "lucide-react";
   ```
   **Why**: Added History icon for the history button

3. **New Function: `handleViewHistory`** (Lines ~236-248)
   ```javascript
   const handleViewHistory = async (asset) => {
     setSelectedAsset(asset);
     setShowHistoryModal(true);
     setHistoryLoading(true);
     try {
       const response = await api.get(`/assets/${asset.id}/history`);
       setAssetHistory(response.data || []);
     } catch (err) {
       console.error("Error fetching asset history:", err);
       setAssetHistory([]);
     } finally {
       setHistoryLoading(false);
     }
   };
   ```
   **Why**: Fetches and displays asset history when user clicks the history button

4. **History Button in Actions Column** (Lines ~338-343)
   - Added purple History icon button
   - Only visible to Admin and SUPER_ADMIN users
   - Opens history modal when clicked

5. **Updated Status Dropdowns** (Lines ~476-478 and ~635-637)
   - Added new status options: Repair, Misuse, Scrap
   - Updated both Add Asset and Edit Asset modals

6. **Status Display Updates** (Lines ~306-320)
   - Added color coding for new statuses:
     - Repair: Yellow background
     - Misuse: Red background
     - Scrap: Gray background
   - Updated status text mapping to show user-friendly names

7. **Status Mapping in Form Submissions** (Lines ~76-77 and ~116-117)
   - Updated to map all new status values correctly when creating/updating assets

8. **Asset History Modal** (Lines ~870-1000+)
   - Complete modal component showing:
     - Asset name in header
     - Timeline of all changes
     - Color-coded action badges
     - User who made each change
     - Timestamp of each change
     - Old and new values side-by-side
     - Additional notes

---

## How to Use

### Viewing Asset History

1. **Navigate to Assets Page**
   - Log in as Admin or SUPER_ADMIN
   - Click on "Assets" in the sidebar

2. **Open History for an Asset**
   - Find the asset in the table
   - In the "Actions" column, click the purple **History** icon (clock icon)
   - The history modal will open showing all changes

3. **Understanding the History Display**
   - **Action Badges**: Color-coded badges showing the type of change
     - Green: CREATED
     - Blue: UPDATED
     - Purple: ASSIGNED
     - Orange: UNASSIGNED
     - Yellow: STATUS_CHANGE
     - Red: DELETED
   - **Timeline**: Changes are displayed in reverse chronological order (newest first)
   - **User Information**: Shows who made each change
   - **Value Changes**: Side-by-side comparison of old and new values

### Using New Status Options

1. **When Creating an Asset**
   - Click "Add Asset" button
   - Fill in asset details
   - In the "Status" dropdown, select from:
     - Available (In Stock)
     - Assigned
     - Repair
     - Misuse
     - Scrap
   - Click "Add Asset"

2. **When Editing an Asset**
   - Click the blue Edit icon next to an asset
   - Change the status in the dropdown
   - Click "Update Asset"
   - The change will be automatically logged in history

3. **Status Meanings**
   - **Available (In Stock)**: Asset is in inventory and ready to be assigned
   - **Assigned**: Asset is currently assigned to a user
   - **Repair**: Asset is being repaired or needs maintenance
   - **Misuse**: Asset usage is flagged for review (e.g., policy violation)
   - **Scrap**: Asset is no longer usable and should be disposed

---

## Technical Details

### Database Structure

#### Asset History Table
The `asset_history` table stores all change records:

```sql
CREATE TABLE IF NOT EXISTS asset_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER REFERENCES assets(asset_id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- ASSIGNED, UNASSIGNED, STATUS_CHANGE, CREATED, UPDATED, DELETED
    old_value TEXT, -- JSON string of previous values
    new_value TEXT, -- JSON string of new values
    performed_by INTEGER REFERENCES users(user_id),
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
```

### API Endpoints

#### Get Asset History
- **Endpoint**: `GET /api/assets/:id/history`
- **Authentication**: Required (JWT token)
- **Authorization**: Admin or SUPER_ADMIN only
- **Response**: Array of history records
  ```json
  [
    {
      "history_id": 1,
      "asset_id": 5,
      "action": "STATUS_CHANGE",
      "old_value": {"status": "IN_STOCK"},
      "new_value": {"status": "REPAIR"},
      "performed_by": 2,
      "performed_at": "2024-01-15T10:30:00Z",
      "notes": "Status changed",
      "username": "admin",
      "full_name": "Admin User"
    }
  ]
  ```

### Automatic History Recording

History is automatically recorded when:
1. **Asset Created**: `recordAssetHistory()` called with action "CREATED"
2. **Asset Updated**: 
   - Status changes → "STATUS_CHANGE"
   - Assignment changes → "ASSIGNED" or "UNASSIGNED"
   - Other field changes → "UPDATED"
3. **Asset Deleted**: `recordAssetHistory()` called with action "DELETED"

### Status Value Mapping

**Frontend → Database Mapping**:
- "Assigned" → "ASSIGNED"
- "Available" → "IN_STOCK"
- "Repair" → "REPAIR"
- "Misuse" → "MISUSE"
- "Scrap" → "SCRAP"

**Database → Frontend Display**:
- "ASSIGNED" → "Assigned"
- "IN_STOCK" → "Available"
- "REPAIR" → "Repair"
- "MISUSE" → "Misuse"
- "SCRAP" → "Scrap"

---

## Files Modified

### Backend Files

1. **`backend/database/schema.sql`**
   - Updated asset status CHECK constraint
   - Added REPAIR, MISUSE, SCRAP to allowed statuses

2. **`backend/routes/assets.js`**
   - Added role middleware to history endpoint
   - Restricted access to Admin and SUPER_ADMIN

3. **`backend/controllers/assetController.js`**
   - Enhanced status mapping in `createAsset()`
   - Enhanced status mapping in `updateAsset()`
   - History recording already implemented (no changes needed)

4. **`backend/database/auditTrail.js`**
   - No changes (already implemented)

### Frontend Files

1. **`frontend/src/pages/Assets.js`**
   - Added history modal state management
   - Added `handleViewHistory()` function
   - Added History button in actions column
   - Updated status dropdowns with new options
   - Added status color coding
   - Created complete history modal component
   - Updated status mapping in form submissions

---

## Security Considerations

1. **Role-Based Access Control**
   - Only Admin and SUPER_ADMIN can view asset history
   - Implemented using `roleMiddleware` in backend routes
   - Frontend also checks role before showing history button

2. **Audit Trail Integrity**
   - History records cannot be modified or deleted by users
   - All changes are automatically logged
   - Includes user ID and timestamp for accountability

3. **Data Privacy**
   - History shows who made changes (for accountability)
   - Sensitive information in old/new values is preserved as JSON

---

## Future Enhancements (Optional)

1. **History Filtering**
   - Filter by action type
   - Filter by date range
   - Filter by user

2. **History Export**
   - Export history to CSV/PDF
   - Print history report

3. **History Notifications**
   - Email notifications for critical changes
   - Real-time updates for administrators

4. **Bulk Status Updates**
   - Change status for multiple assets at once
   - Bulk assignment/unassignment

---

## Troubleshooting

### Issue: History button not visible
**Solution**: Ensure you are logged in as Admin or SUPER_ADMIN role

### Issue: History modal shows "No history available"
**Possible Causes**:
- Asset was just created (no changes yet)
- History recording failed (check backend logs)
- Database connection issue

### Issue: Status dropdown doesn't show new options
**Solution**: 
- Clear browser cache
- Ensure frontend code is updated
- Check that status values are correctly mapped

### Issue: Status changes not saving
**Solution**:
- Check backend logs for errors
- Verify database schema includes new status values
- Ensure status mapping in backend is correct

---

## Testing Checklist

- [x] History button visible for Admin/SUPER_ADMIN
- [x] History button hidden for other roles
- [x] History modal displays correctly
- [x] All status options available in dropdowns
- [x] Status changes are saved correctly
- [x] History records are created for status changes
- [x] History records show correct user information
- [x] Status colors display correctly
- [x] History modal shows old/new values
- [x] API endpoint requires authentication
- [x] API endpoint requires Admin/SUPER_ADMIN role

---

## Summary

This implementation adds comprehensive asset change tracking and expands asset status management capabilities. Administrators can now:

1. **Track Changes**: View complete history of all asset modifications
2. **Manage Status**: Use additional status options (Repair, Misuse, Scrap)
3. **Audit Trail**: Maintain accountability with user and timestamp tracking
4. **Better Control**: More granular asset lifecycle management

All changes are backward compatible and do not affect existing functionality. The history feature is automatically enabled and requires no additional configuration.

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: AI Assistant  
**Reviewed By**: [To be filled]

