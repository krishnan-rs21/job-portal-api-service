import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import redis from "../lib/redis";
import { sendResponse } from "../utils/responseHelper";

const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string().default("USER"),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = registerSchema.parse(
      req.body,
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    // Default role ID lookup (assuming Role table has standard roles)
    const roleRecord = await prisma.role.findUnique({ where: { name: role } });
    if (!roleRecord) return sendResponse(res, 400, false, null, "Invalid role");

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roleId: roleRecord.id,
      },
      select: { uuid: true, email: true, firstName: true, lastName: true },
    });

    sendResponse(res, 201, true, user, "Registration successful");
  } catch (error) {
    sendResponse(res, 400, false, null, "Registration failed", error as any);
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return sendResponse(res, 401, false, null, "Invalid credentials");
  }

  const payload = { uuid: user.uuid, role: user.role.name };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await redis.set(`refresh:${user.uuid}`, refreshToken, "EX", 7 * 24 * 60 * 60);

  sendResponse(res, 200, true, { accessToken, refreshToken }, "Login successful");
};

export const refreshToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  const payload = verifyRefreshToken(token);

  if (!payload) return sendResponse(res, 401, false, null, "Invalid token");

  const storedToken = await redis.get(`refresh:${payload.uuid}`);
  if (storedToken !== token)
    return sendResponse(res, 401, false, null, "Token rotated or invalid");

  const newAccessToken = generateAccessToken({
    uuid: payload.uuid,
    role: payload.role,
  });
  const newRefreshToken = generateRefreshToken({
    uuid: payload.uuid,
    role: payload.role,
  });

  await redis.del(`refresh:${payload.uuid}`);
  await redis.set(
    `refresh:${payload.uuid}`,
    newRefreshToken,
    "EX",
    7 * 24 * 60 * 60,
  );

  sendResponse(
    res,
    200,
    true,
    { accessToken: newAccessToken, refreshToken: newRefreshToken },
    "Token refreshed",
  );
};

export const logout = async (req: Request, res: Response) => {
  const { uuid } = (req as any).user;
  await redis.del(`refresh:${uuid}`);
  sendResponse(res, 200, true, null, "Logged out");
};
