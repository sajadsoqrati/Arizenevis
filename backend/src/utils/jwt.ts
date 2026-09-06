import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "@prisma/client";
import { config } from "../config/env";

export interface JwtPayload {
  userId: string;
  role: Role;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: "15m" };
  return jwt.sign(payload, config.jwt.accessSecret, options);
}

export function signRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: "7d" };
  return jwt.sign(payload, config.jwt.refreshSecret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
}

export function getRefreshTokenExpiry(): Date {
  const days = 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
