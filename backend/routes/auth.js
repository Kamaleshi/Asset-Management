import express from "express";
import { login, setPassword, resetPassword, register } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/set-password", setPassword);
router.post("/reset-password", resetPassword);
router.post("/register", register);

export default router;
