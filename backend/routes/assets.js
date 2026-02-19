import express from "express";
import multer from "multer";
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetHistory,
} from "../controllers/assetController.js";
import {
  importAssets,
  getImportLogs,
  getImportErrors,
} from "../controllers/importController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Configure multer for file uploads (in memory)
const upload = multer({ storage: multer.memoryStorage() });

// All authenticated users can view assets
router.get("/", authMiddleware, getAssets);
router.get("/:id", authMiddleware, getAssetById);
// Only Admin and SUPER_ADMIN can view asset history
router.get("/:id/history", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN"]), getAssetHistory);

// Only admins and super admins can create, update, or delete assets
router.post("/", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN"]), createAsset);
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN"]), updateAsset);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN"]), deleteAsset);

// Excel import routes (Admin and Super Admin only)
router.post("/import", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN"]), upload.single("file"), importAssets);
router.get("/import/logs", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN", "AUDITOR"]), getImportLogs);
router.get("/import/:importId/errors", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN", "AUDITOR"]), getImportErrors);

export default router;
