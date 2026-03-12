import express from "express";
import multer from "multer";
import { extname, join } from "path";
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetHistory,
  getAssetSummary,
  exportAssetsCsv,
} from "../controllers/assetController.js";
import {
  importAssets,
  getImportLogs,
  getImportErrors,
} from "../controllers/importController.js";
import {
  listAttachments,
  uploadAttachment,
  deleteAttachment,
} from "../controllers/attachmentController.js";
import {
  listCategories,
  createCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../utils/errors.js";

const router = express.Router();

const importUpload = multer({ storage: multer.memoryStorage() });
const attachmentUpload = multer({
  storage: multer.diskStorage({
    destination: join(process.cwd(), "backend", "uploads"),
    filename: (req, file, callback) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      callback(null, `${Date.now()}-${safeName}${extname(file.originalname) ? "" : ""}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authMiddleware);
router.get("/", asyncHandler(getAssets));
router.get("/categories", asyncHandler(listCategories));
router.post("/categories", roleMiddleware(["ADMIN", "SUPER_ADMIN"]), asyncHandler(createCategory));
router.delete("/categories/:categoryId", roleMiddleware(["ADMIN", "SUPER_ADMIN"]), asyncHandler(deleteCategory));
router.get("/summary", asyncHandler(getAssetSummary));
router.get("/export", asyncHandler(exportAssetsCsv));
router.get("/import/logs", roleMiddleware(["ADMIN", "SUPER_ADMIN", "AUDITOR"]), asyncHandler(getImportLogs));
router.get("/import/:importId/errors", roleMiddleware(["ADMIN", "SUPER_ADMIN", "AUDITOR"]), asyncHandler(getImportErrors));
router.post("/import", roleMiddleware(["ADMIN", "SUPER_ADMIN"]), importUpload.single("file"), asyncHandler(importAssets));

router.get("/:id", asyncHandler(getAssetById));
router.get("/:id/history", asyncHandler(getAssetHistory));
router.get("/:id/attachments", asyncHandler(listAttachments));
router.post("/:id/attachments", roleMiddleware(["ADMIN", "SUPER_ADMIN"]), attachmentUpload.single("file"), asyncHandler(uploadAttachment));
router.delete("/:id/attachments/:attachmentId", roleMiddleware(["ADMIN", "SUPER_ADMIN"]), asyncHandler(deleteAttachment));

router.post("/", roleMiddleware(["ADMIN", "SUPER_ADMIN"]), asyncHandler(createAsset));
router.put("/:id", roleMiddleware(["ADMIN", "SUPER_ADMIN"]), asyncHandler(updateAsset));
router.delete("/:id", roleMiddleware(["ADMIN", "SUPER_ADMIN"]), asyncHandler(deleteAsset));

export default router;
