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
import { asyncHandler } from "../utils/errors.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/", roleMiddleware(["ADMIN", "SUPER_ADMIN", "MANAGER", "EMPLOYEE"]), asyncHandler(getUsers));
router.get("/:id", roleMiddleware(["ADMIN", "SUPER_ADMIN", "MANAGER", "EMPLOYEE"]), asyncHandler(getUserById));
router.post("/", roleMiddleware(["ADMIN", "SUPER_ADMIN"]), asyncHandler(createUser));
router.put("/:id", roleMiddleware(["ADMIN", "SUPER_ADMIN"]), asyncHandler(updateUser));
router.delete("/:id", roleMiddleware(["ADMIN", "SUPER_ADMIN"]), asyncHandler(deleteUser));

export default router;
