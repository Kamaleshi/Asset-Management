const DEFAULT_PORT = 5000;
const DEFAULT_JWT_EXPIRES_IN = "24h";
const DEFAULT_JWT_SECRET = "dev-only-secret-change-me";

function parsePort(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function parseCorsOrigins(value) {
  if (!value) {
    return ["http://localhost:3000"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parsePort(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN,
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
};

export function isDefaultJwtSecret() {
  return env.jwtSecret === DEFAULT_JWT_SECRET;
}
