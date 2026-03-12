import { basename } from "path";
import { unlink } from "fs/promises";
import db from "../database/db.js";
import { AppError } from "../utils/errors.js";
import { assertAssetAccess, getActor } from "../utils/assetHelpers.js";

function getAssetForScope(assetId) {
  return db.prepare(`
    SELECT
      a.*,
      assigned_user.department AS assigned_to_department
    FROM assets a
    LEFT JOIN users assigned_user ON a.assigned_to = assigned_user.user_id
    WHERE a.asset_id = ?
  `).get(assetId);
}

export const listAttachments = async (req, res) => {
  const actor = getActor(req.user.id);
  const assetId = Number.parseInt(req.params.id, 10);
  const asset = getAssetForScope(assetId);
  assertAssetAccess(actor, asset);

  const attachments = db.prepare(`
    SELECT attachment_id, file_name, file_path, file_type, uploaded_at, uploaded_by
    FROM asset_attachments
    WHERE asset_id = ?
    ORDER BY uploaded_at DESC
  `).all(assetId);

  res.json(attachments.map((attachment) => ({
    id: attachment.attachment_id,
    fileName: attachment.file_name,
    fileType: attachment.file_type,
    uploadedAt: attachment.uploaded_at,
    uploadedBy: attachment.uploaded_by,
    url: `/uploads/${basename(attachment.file_path)}`,
  })));
};

export const uploadAttachment = async (req, res) => {
  const actor = getActor(req.user.id);
  if (!["ADMIN", "SUPER_ADMIN"].includes(actor.role)) {
    throw new AppError(403, "Only administrators can upload attachments");
  }

  const assetId = Number.parseInt(req.params.id, 10);
  const asset = getAssetForScope(assetId);
  if (!asset) {
    throw new AppError(404, "Asset not found");
  }

  if (!req.file) {
    throw new AppError(400, "Attachment file is required");
  }

  const result = db.prepare(`
    INSERT INTO asset_attachments (asset_id, file_name, file_path, file_type, uploaded_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    assetId,
    req.file.originalname,
    req.file.path,
    req.file.mimetype,
    actor.user_id
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    url: `/uploads/${basename(req.file.path)}`,
  });
};

export const deleteAttachment = async (req, res) => {
  const actor = getActor(req.user.id);
  if (!["ADMIN", "SUPER_ADMIN"].includes(actor.role)) {
    throw new AppError(403, "Only administrators can delete attachments");
  }

  const attachmentId = Number.parseInt(req.params.attachmentId, 10);
  const attachment = db.prepare("SELECT * FROM asset_attachments WHERE attachment_id = ?").get(attachmentId);
  if (!attachment) {
    throw new AppError(404, "Attachment not found");
  }

  db.prepare("DELETE FROM asset_attachments WHERE attachment_id = ?").run(attachmentId);
  try {
    await unlink(attachment.file_path);
  } catch {
    // Ignore missing files but remove database record.
  }

  res.json({ message: "Attachment deleted successfully" });
};
