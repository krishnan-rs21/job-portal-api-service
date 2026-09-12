"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken =
  exports.verifyAccessToken =
  exports.generateRefreshToken =
  exports.generateAccessToken =
    void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY;
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY;
/**
 *
 * @param payload
 * @returns
 */
const generateAccessToken = (payload) => {
  return jsonwebtoken_1.default.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  });
};
exports.generateAccessToken = generateAccessToken;
/**
 *
 * @param payload
 * @returns
 */
const generateRefreshToken = (payload) => {
  return jsonwebtoken_1.default.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 *
 * @param token
 * @returns
 */
const verifyAccessToken = (token) => {
  try {
    return jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
  } catch {
    return null;
  }
};
exports.verifyAccessToken = verifyAccessToken;
/**
 *
 * @param token
 * @returns
 */
const verifyRefreshToken = (token) => {
  try {
    return jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
  } catch {
    return null;
  }
};
exports.verifyRefreshToken = verifyRefreshToken;
//# sourceMappingURL=jwt.js.map
