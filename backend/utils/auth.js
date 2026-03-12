import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const BCRYPT_PREFIX = /^\$2[aby]\$/;
const PASSWORD_SALT_ROUNDS = 10;

export function hasPassword(password) {
  return typeof password === "string" && password.trim() !== "";
}

export function isPasswordHash(password) {
  return typeof password === "string" && BCRYPT_PREFIX.test(password);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(plainTextPassword, storedPassword) {
  if (!hasPassword(storedPassword)) {
    return false;
  }

  if (isPasswordHash(storedPassword)) {
    return bcrypt.compare(plainTextPassword, storedPassword);
  }

  return storedPassword === plainTextPassword;
}

export function signAuthToken(user) {
  return jwt.sign(
    { id: user.user_id, role: user.role, roleId: user.role_id },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}
