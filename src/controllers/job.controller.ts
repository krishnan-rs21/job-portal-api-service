import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Job } from "../entities/Job";
import { User } from "../entities/User";
import { z } from "zod";
import { sendResponse } from "../utils/responseHelper";
import redis from "../lib/redis";
import { Messages } from "../config/messages";
import { Like, FindManyOptions } from "typeorm";

const jobRepository = AppDataSource.getRepository(Job);
const userRepository = AppDataSource.getRepository(User);

const createJobSchema = z.object({
  title: z.string(),
  description: z.string(),
  location: z.string(),
  type: z.string(),
  experience: z.string(),
  salaryRange: z.string().optional(),
  categoryId: z.number(),
});

const invalidateJobCache = async () => {
    // Invalidate all public job lists
    const keys = await redis.keys("jobs:*");
    if (keys.length > 0) await redis.del(...keys);
}

export const createJob = async (req: Request, res: Response) => {
  try {
    const data = createJobSchema.parse(req.body);
    const postedByUuid = (req as any).user.uuid;
    
    const user = await userRepository.findOne({ where: { uuid: postedByUuid } });
    if(!user) return sendResponse(res, 404, false, null, Messages.USER_NOT_FOUND);

    const job = jobRepository.create({ ...data, postedById: user.id });
    await jobRepository.save(job);

    await invalidateJobCache();
    sendResponse(res, 201, true, job, Messages.JOB_CREATED_SUCCESSFULLY);
  } catch (error) {
    sendResponse(res, 400, false, null, Messages.JOB_CREATION_FAILED, error as any);
  }
};

export const listJobs = async (req: Request, res: Response) => {
  const { page = "1", limit = "10", search, categoryId, experience } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (search) where.title = Like(`%${search}%`);
  if (categoryId) where.categoryId = parseInt(categoryId as string);
  if (experience) where.experience = experience as string;

  const [jobs, total] = await jobRepository.findAndCount({
    where,
    skip,
    take: limitNum,
  });

  sendResponse(res, 200, true, jobs, Messages.JOBS_FETCHED, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
};

export const updateJob = async (req: Request, res: Response) => {
    const uuid = String(req.params.uuid);
    try {
        const data = createJobSchema.partial().parse(req.body);
        const job = await jobRepository.findOne({ where: { uuid } });
        if (!job) return sendResponse(res, 404, false, null, Messages.JOB_NOT_FOUND);
        
        Object.assign(job, data);
        await jobRepository.save(job);
        
        await invalidateJobCache();
        sendResponse(res, 200, true, job, Messages.JOB_UPDATED);
    } catch (error) {
        sendResponse(res, 400, false, null, Messages.UPDATE_FAILED, error as any);
    }
}

export const toggleJobStatus = async (req: Request, res: Response) => {
    const uuid = String(req.params.uuid);
    const { isActive } = req.body;
    const job = await jobRepository.findOne({ where: { uuid } });
    if (!job) return sendResponse(res, 404, false, null, Messages.JOB_NOT_FOUND);
    
    job.isActive = isActive;
    await jobRepository.save(job);
    
    await invalidateJobCache();
    sendResponse(res, 200, true, job, Messages.JOB_STATUS_UPDATED);
}

export const deleteJob = async (req: Request, res: Response) => {
    const uuid = String(req.params.uuid);
    const result = await jobRepository.delete({ uuid });
    if (result.affected === 0) return sendResponse(res, 404, false, null, Messages.JOB_NOT_FOUND);
    
    await invalidateJobCache();
    sendResponse(res, 200, true, null, Messages.JOB_DELETED);
}
