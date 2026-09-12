import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sendResponse } from "../utils/responseHelper";

const prisma = new PrismaClient();

export const getMetadata = async (req: Request, res: Response) => {
  try {
    const [categories, roles] = await Promise.all([
      prisma.category.findMany({ select: { name: true } }),
      prisma.role.findMany({ select: { name: true } }),
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
      "Metadata fetched successfully",
    );
  } catch (error) {
    sendResponse(
      res,
      500,
      false,
      null,
      "Failed to fetch metadata",
      error as any,
    );
  }
};
