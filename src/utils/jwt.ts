import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me";
const ACCESS_EXPIRY = (process.env.JWT_ACCESS_EXPIRY || "15m") as jwt.SignOptions["expiresIn"];
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || "7d") as jwt.SignOptions["expiresIn"];

export interface TokenPayload {
  uuid: string;
  role: string;
}

/**
 *
 * @param payload
 * @returns
 */
export const generateAccessToken = (payload: TokenPayload) => {
  return jwt.sign(payload, ACCESS_SECRET!, { expiresIn: ACCESS_EXPIRY });
};

/**
 *
 * @param payload
 * @returns
 */
export const generateRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(payload, REFRESH_SECRET!, { expiresIn: REFRESH_EXPIRY });
};

/**
 *
 * @param token
 * @returns
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, ACCESS_SECRET!) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 *
 * @param token
 * @returns
 */
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, REFRESH_SECRET!) as TokenPayload;
  } catch {
    return null;
  }
};
