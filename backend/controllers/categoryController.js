import db from "../database/db.js";
import { AppError } from "../utils/errors.js";

export const listCategories = async (req, res) => {
  const categories = db.prepare(`
    SELECT category_id, category_name, description, created_at
    FROM asset_categories
    ORDER BY category_name ASC
  `).all();

  res.json(categories.map((category) => ({
    id: category.category_id,
    name: category.category_name,
    description: category.description,
    createdAt: category.created_at,
  })));
};

export const createCategory = async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) {
    throw new AppError(400, "Category name is required");
  }

  const existing = db.prepare("SELECT category_id FROM asset_categories WHERE category_name = ?").get(name);
  if (existing) {
    throw new AppError(409, "Category already exists");
  }

  const result = db.prepare(`
    INSERT INTO asset_categories (category_name, description)
    VALUES (?, ?)
  `).run(name, req.body.description?.trim() || null);

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    description: req.body.description?.trim() || null,
  });
};

export const deleteCategory = async (req, res) => {
  const categoryId = Number.parseInt(req.params.categoryId, 10);
  const usage = db.prepare("SELECT COUNT(*) AS count FROM assets WHERE category_id = ? AND status != 'DISPOSED'").get(categoryId);
  if (usage.count > 0) {
    throw new AppError(400, "Cannot delete a category that is assigned to active assets");
  }

  db.prepare("DELETE FROM asset_categories WHERE category_id = ?").run(categoryId);
  res.json({ message: "Category deleted successfully" });
};
