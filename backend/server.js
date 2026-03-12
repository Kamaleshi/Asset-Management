import express from "express";
import cors from "cors";
import { mkdirSync } from "fs";
import { join } from "path";
import { initializeDatabase } from "./database/db.js";
import { env, isDefaultJwtSecret } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler, notFoundHandler } from "./utils/errors.js";
import { logger } from "./utils/logger.js";

import authRoutes from "./routes/auth.js";
import assetRoutes from "./routes/assets.js";
import userRoutes from "./routes/users.js";

const app = express();
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
  })
);
app.use(express.json());
app.use(requestLogger);

// Initialize database on startup
initializeDatabase();
const uploadsDir = join(process.cwd(), "backend", "uploads");
mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

if (env.nodeEnv !== "production" && isDefaultJwtSecret()) {
  logger.warn("Using default JWT secret. Set JWT_SECRET before production deployment.");
}

app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/users", userRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  logger.info("backend-started", { port: env.port });
});
