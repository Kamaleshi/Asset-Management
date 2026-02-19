import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All user routes require admin or super admin role
router.get("/", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN"]), getUsers);
router.get("/:id", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN"]), getUserById);
router.post("/", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN"]), createUser);
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN"]), updateUser);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN", "SUPER_ADMIN"]), deleteUser);

export default router;
