import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Category } from "../entities/Category";
import { Role } from "../entities/Role";
import { ExperienceLevel } from "../entities/ExperienceLevel";
import { EmploymentType } from "../entities/EmploymentType";
import { sendResponse } from "../utils/responseHelper";
import { Messages } from "../config/messages";
import { toOption } from "../utils/serializers";

const categoryRepository = AppDataSource.getRepository(Category);
const roleRepository = AppDataSource.getRepository(Role);
const experienceLevelRepository = AppDataSource.getRepository(ExperienceLevel);
const employmentTypeRepository = AppDataSource.getRepository(EmploymentType);

export const getMetadata = async (req: Request, res: Response) => {
  try {
    const [categories, roles, experienceLevels, employmentTypes] = await Promise.all([
      categoryRepository.find({ select: { uuid: true, name: true }, order: { id: "ASC" } }),
      roleRepository.find({ select: { name: true } }),
      experienceLevelRepository.find({
        select: { uuid: true, name: true },
        order: { sortOrder: "ASC", name: "ASC" },
      }),
      employmentTypeRepository.find({
        select: { uuid: true, name: true },
        order: { sortOrder: "ASC", name: "ASC" },
      }),
    ]);

    sendResponse(
      res,
      200,
      true,
      {
        categories: categories.map((c) => c.name),
        roles: roles.map((r) => r.name),
        experienceLevels: experienceLevels.map((e) => e.name),
        employmentTypes: employmentTypes.map((t) => t.name),
        categoryOptions: categories.map(toOption),
        experienceLevelOptions: experienceLevels.map(toOption),
        employmentTypeOptions: employmentTypes.map(toOption),
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
