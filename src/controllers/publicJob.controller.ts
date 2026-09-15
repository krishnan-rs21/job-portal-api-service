import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Job } from "../entities/Job";
import { Category } from "../entities/Category";
import { sendResponse } from "../utils/responseHelper";
import redis from "../lib/redis";
import { Messages } from "../config/messages";
import { Like } from "typeorm";

const jobRepository = AppDataSource.getRepository(Job);
const categoryRepository = AppDataSource.getRepository(Category);

export const getLandingData = async (req: Request, res: Response) => {
  const cacheKey = "jobs:landing";
  const cached = await redis.get(cacheKey);
  if (cached)
    return sendResponse(
      res,
      200,
      true,
      JSON.parse(cached),
      Messages.FETCHED_FROM_CACHE,
    );

  try {
    const featuredJobs = await jobRepository.find({
      where: { isActive: true },
      take: 5,
    });
    const categoryCounts = await categoryRepository.find({
      relations: { jobs: true },
      // TypeORM doesn't have a direct equivalent to `_count` easily available here,
      // simplifying to return categories, the client can handle count if needed.
    });

    const data = { featuredJobs, categoryCounts };
    await redis.set(cacheKey, JSON.stringify(data), "EX", 3600);
    sendResponse(res, 200, true, data, Messages.LANDING_DATA_FETCHED);
  } catch (error) {
    sendResponse(
      res,
      500,
      false,
      null,
      Messages.FAILED_TO_FETCH_LANDING_DATA,
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
      Messages.FETCHED_FROM_CACHE,
    );

  try {
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = { isActive: true };
    if (search)
      where.title = Like(`%${search}%`);
    if (categoryId) where.categoryId = parseInt(categoryId as string);
    if (experience) where.experience = experience as string;

    const [jobs, total] = await jobRepository.findAndCount({
        where, skip, take: limitNum
    });

    const data = {
      jobs,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
    await redis.set(cacheKey, JSON.stringify(data), "EX", 600);
    sendResponse(res, 200, true, data.jobs, Messages.JOBS_FETCHED, data.meta);
  } catch (error) {
    sendResponse(res, 500, false, null, Messages.FAILED_TO_FETCH_JOBS, error as any);
  }
};

export const getJobByUuid = async (req: Request, res: Response) => {
  const uuid = String(req.params.uuid);
  const cacheKey = `jobs:${uuid}`;
  const cached = await redis.get(cacheKey);
  if (cached)
    return sendResponse(
      res,
      200,
      true,
      JSON.parse(cached),
      Messages.FETCHED_FROM_CACHE,
    );

  try {
    const job = await jobRepository.findOne({ where: { uuid, isActive: true } });
    if (!job)
      return sendResponse(res, 404, false, null, Messages.JOB_NOT_FOUND);

    await redis.set(cacheKey, JSON.stringify(job), "EX", 3600);
    sendResponse(res, 200, true, job, Messages.JOB_FETCHED);
  } catch (error) {
    sendResponse(res, 500, false, null, Messages.FAILED_TO_FETCH_JOB, error as any);
  }
};
