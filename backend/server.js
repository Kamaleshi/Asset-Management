import express from "express";
import cors from "cors";
import { initializeDatabase } from "./database/db.js";

import authRoutes from "./routes/auth.js";
import assetRoutes from "./routes/assets.js";
import userRoutes from "./routes/users.js";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase();

app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/users", userRoutes);

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
