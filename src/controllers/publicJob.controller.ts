import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Job } from "../entities/Job";
import { Category } from "../entities/Category";
import { sendResponse } from "../utils/responseHelper";
import redis from "../lib/redis";
import { Messages } from "../config/messages";
import { ILike } from "typeorm";
import { isUuid, resolveJobFilters } from "../utils/lookups";
import { toJobResponse } from "../utils/serializers";

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
      order: { createdAt: "DESC" },
      take: 5,
    });
    const categoryRows: { uuid: string; name: string; jobCount: string }[] = await categoryRepository
      .createQueryBuilder("category")
      .leftJoin("category.jobs", "job", "job.isActive = :isActive", { isActive: true })
      .select("category.uuid", "uuid")
      .addSelect("category.name", "name")
      .addSelect("COUNT(job.id)", "jobCount")
      .groupBy("category.id")
      .orderBy("category.id", "ASC")
      .getRawMany();

    const data = {
      featuredJobs: featuredJobs.map((job) => toJobResponse(job)),
      categoryCounts: categoryRows.map((row) => ({
        uuid: row.uuid,
        name: row.name,
        jobCount: Number(row.jobCount),
      })),
    };
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
  } = req.query;
  const cacheKey = `jobs:list:${JSON.stringify(req.query)}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    const cachedData = JSON.parse(cached);
    return sendResponse(
      res,
      200,
      true,
      cachedData.jobs,
      Messages.FETCHED_FROM_CACHE,
      cachedData.meta,
    );
  }

  try {
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const lookupWhere = await resolveJobFilters(req.query);
    if (!lookupWhere) {
      return sendResponse(res, 200, true, [], Messages.JOBS_FETCHED, {
        page: pageNum,
        limit: limitNum,
        total: 0,
        totalPages: 0,
      });
    }

    const where: any = { ...lookupWhere, isActive: true };
    if (search)
      where.title = ILike(`%${search}%`);

    const [jobs, total] = await jobRepository.findAndCount({
        where, skip, take: limitNum, order: { createdAt: "DESC" }
    });

    const data = {
      jobs: jobs.map((job) => toJobResponse(job)),
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
  if (!isUuid(uuid)) return sendResponse(res, 404, false, null, Messages.JOB_NOT_FOUND);
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

    const data = toJobResponse(job);
    await redis.set(cacheKey, JSON.stringify(data), "EX", 3600);
    sendResponse(res, 200, true, data, Messages.JOB_FETCHED);
  } catch (error) {
    sendResponse(res, 500, false, null, Messages.FAILED_TO_FETCH_JOB, error as any);
  }
};
