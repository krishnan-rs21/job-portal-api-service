import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import bcrypt from "bcrypt";
import { z } from "zod";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import redis from "../lib/redis";
import { sendResponse } from "../utils/responseHelper";
import { Messages } from "../config/messages";

const userRepository = AppDataSource.getRepository(User);
const roleRepository = AppDataSource.getRepository(Role);

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

    const roleRecord = await roleRepository.findOne({ where: { name: role } });
    if (!roleRecord) return sendResponse(res, 400, false, null, Messages.INVALID_ROLE);

    const user = userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId: roleRecord.id,
    });
    await userRepository.save(user);

    sendResponse(res, 201, true, { uuid: user.uuid, email: user.email, firstName: user.firstName, lastName: user.lastName }, Messages.REGISTRATION_SUCCESSFUL);
  } catch (error) {
    sendResponse(res, 400, false, null, Messages.REGISTRATION_FAILED, error as any);
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await userRepository.findOne({
    where: { email },
    relations: { role: true },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return sendResponse(res, 401, false, null, Messages.INVALID_CREDENTIALS);
  }

  const payload = { uuid: user.uuid, role: user.role.name };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await redis.set(`refresh:${user.uuid}`, refreshToken, "EX", 7 * 24 * 60 * 60);

  sendResponse(res, 200, true, { accessToken, refreshToken }, Messages.LOGIN_SUCCESSFUL);
};

export const refreshToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  const payload = verifyRefreshToken(token);

  if (!payload) return sendResponse(res, 401, false, null, Messages.INVALID_TOKEN);

  const storedToken = await redis.get(`refresh:${payload.uuid}`);
  if (storedToken !== token)
    return sendResponse(res, 401, false, null, Messages.TOKEN_ROTATED_OR_INVALID);

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
    Messages.TOKEN_REFRESHED,
  );
};

export const logout = async (req: Request, res: Response) => {
  const { uuid } = (req as any).user;
  await redis.del(`refresh:${uuid}`);
  sendResponse(res, 200, true, null, Messages.LOGGED_OUT);
};
