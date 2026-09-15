import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Category } from "../entities/Category";
import { Role } from "../entities/Role";
import { sendResponse } from "../utils/responseHelper";
import { Messages } from "../config/messages";

const categoryRepository = AppDataSource.getRepository(Category);
const roleRepository = AppDataSource.getRepository(Role);

export const getMetadata = async (req: Request, res: Response) => {
  try {
    const [categories, roles] = await Promise.all([
      categoryRepository.find({ select: { name: true } }),
      roleRepository.find({ select: { name: true } }),
    ]);

    sendResponse(
      res,
      200,
      true,
      {
        categories: categories.map((c) => c.name),
        roles: roles.map((r) => r.name),
        experienceLevels: ["Entry", "Mid", "Senior"],
        employmentTypes: ["Full-time", "Part-time", "Remote", "Contract"],
      },
      Messages.METADATA_FETCHED,
    );
  } catch (error) {
    sendResponse(
      res,
      500,
      false,
      null,
      Messages.FAILED_TO_FETCH_METADATA,
      error as any,
    );
  }
};
