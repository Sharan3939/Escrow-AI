import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "./index.js";
import type { JWTPayload } from "../types/index.js";

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as SignOptions);
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
}
