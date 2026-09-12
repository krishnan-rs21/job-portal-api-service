import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sendResponse } from "../utils/responseHelper";
import redis from "../lib/redis";

const prisma = new PrismaClient();

export const getLandingData = async (req: Request, res: Response) => {
  const cacheKey = "jobs:landing";
  const cached = await redis.get(cacheKey);
  if (cached)
    return sendResponse(
      res,
      200,
      true,
      JSON.parse(cached),
      "Fetched from cache",
    );

  try {
    const featuredJobs = await prisma.job.findMany({
      where: { isActive: true },
      take: 5,
    });
    const categoryCounts = await prisma.category.findMany({
      include: { _count: { select: { jobs: { where: { isActive: true } } } } },
    });

    const data = { featuredJobs, categoryCounts };
    await redis.set(cacheKey, JSON.stringify(data), "EX", 3600);
    sendResponse(res, 200, true, data, "Landing data fetched");
  } catch (error) {
    sendResponse(
      res,
      500,
      false,
      null,
      "Failed to fetch landing data",
      error as any,
    );
  }
};

export const listJobs = async (req: Request, res: Response) => {
  const {
    page = "1",
    limit = "10",
    search,
    categoryId,
    experience,
  } = req.query;
  const cacheKey = `jobs:list:${JSON.stringify(req.query)}`;
  const cached = await redis.get(cacheKey);
  if (cached)
    return sendResponse(
      res,
      200,
      true,
      JSON.parse(cached),
      "Fetched from cache",
    );

  try {
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = { isActive: true };
    if (search)
      where.title = { contains: search as string, mode: "insensitive" };
    if (categoryId) where.categoryId = parseInt(categoryId as string);
    if (experience) where.experience = experience as string;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({ where, skip, take: parseInt(limit as string) }),
      prisma.job.count({ where }),
    ]);

    const data = {
      jobs,
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    };
    await redis.set(cacheKey, JSON.stringify(data), "EX", 600);
    sendResponse(res, 200, true, data.jobs, "Jobs fetched", data.meta);
  } catch (error) {
    sendResponse(res, 500, false, null, "Failed to fetch jobs", error as any);
  }
};

export const getJobByUuid = async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const cacheKey = `jobs:${uuid}`;
  const cached = await redis.get(cacheKey);
  if (cached)
    return sendResponse(
      res,
      200,
      true,
      JSON.parse(cached),
      "Fetched from cache",
    );

  try {
    const job = await prisma.job.findUnique({ where: { uuid } });
    if (!job || !job.isActive)
      return sendResponse(res, 404, false, null, "Job not found");

    await redis.set(cacheKey, JSON.stringify(job), "EX", 3600);
    sendResponse(res, 200, true, job, "Job fetched");
  } catch (error) {
    sendResponse(res, 500, false, null, "Failed to fetch job", error as any);
  }
};
