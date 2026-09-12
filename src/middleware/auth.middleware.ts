import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { sendResponse } from "../utils/responseHelper";

export const authenticate = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendResponse(
        res,
        401,
        false,
        null,
        "Unauthorized: No token provided",
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token)
      return sendResponse(
        res,
        401,
        false,
        null,
        "Unauthorized: No token provided",
      );
    const payload = verifyAccessToken(token);

    if (!payload) {
      return sendResponse(res, 401, false, null, "Unauthorized: Invalid token");
    }

    if (roles.length > 0 && !roles.includes(payload.role)) {
      return sendResponse(
        res,
        403,
        false,
        null,
        "Forbidden: Insufficient permissions",
      );
    }

    (req as any).user = payload;
    next();
  };
};
