import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Job } from "../entities/Job";
import { User } from "../entities/User";
import { Application } from "../entities/Application";
import { z } from "zod";
import { sendResponse } from "../utils/responseHelper";
import redis from "../lib/redis";
import { Messages } from "../config/messages";
import { ILike } from "typeorm";
import { resolveJobFilters, resolveJobLookups } from "../utils/lookups";
import { toJobResponse } from "../utils/serializers";

const jobRepository = AppDataSource.getRepository(Job);
const userRepository = AppDataSource.getRepository(User);

const createJobSchema = z.object({
  title: z.string(),
  description: z.string(),
  location: z.string(),
  employmentTypeUuid: z.string(),
  experienceLevelUuid: z.string(),
  salaryRange: z.string().optional(),
  categoryUuid: z.string(),
});

const invalidateJobCache = async () => {
    // Invalidate all public job lists
    const keys = await redis.keys("jobs:*");
    if (keys.length > 0) await redis.del(...keys);
}

const emptyMeta = (page: number, limit: number) => ({ page, limit, total: 0, totalPages: 0 });

export const createJob = async (req: Request, res: Response) => {
  try {
    const { categoryUuid, employmentTypeUuid, experienceLevelUuid, ...data } = createJobSchema.parse(req.body);
    const { error, ids } = await resolveJobLookups({ categoryUuid, employmentTypeUuid, experienceLevelUuid });
    if (error) return sendResponse(res, 400, false, null, error);
    const postedByUuid = (req as any).user.uuid;

    const user = await userRepository.findOne({ where: { uuid: postedByUuid } });
    if(!user) return sendResponse(res, 404, false, null, Messages.USER_NOT_FOUND);

    const job = jobRepository.create({ ...data, ...ids, postedById: user.id });
    await jobRepository.save(job);
    const createdJob = await jobRepository.findOneOrFail({ where: { id: job.id } });

    await invalidateJobCache();
    sendResponse(res, 201, true, toJobResponse(createdJob), Messages.JOB_CREATED_SUCCESSFULLY);
  } catch (error) {
    sendResponse(res, 400, false, null, Messages.JOB_CREATION_FAILED, error as any);
  }
};

export const listJobs = async (req: Request, res: Response) => {
  const { page = "1", limit = "10", search } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const lookupWhere = await resolveJobFilters(req.query);
  if (!lookupWhere) {
    return sendResponse(res, 200, true, [], Messages.JOBS_FETCHED, emptyMeta(pageNum, limitNum));
  }

  const where: any = { ...lookupWhere };
  if (search) where.title = ILike(`%${search}%`);

  const [jobs, total] = await jobRepository.findAndCount({
    where,
    skip,
    take: limitNum,
  });

  const jobIds = jobs.map((job) => job.id);
  const counts: { jobId: number; count: string }[] = jobIds.length
    ? await AppDataSource.getRepository(Application)
        .createQueryBuilder("application")
        .select("application.jobId", "jobId")
        .addSelect("COUNT(*)", "count")
        .where("application.jobId IN (:...jobIds)", { jobIds })
        .groupBy("application.jobId")
        .getRawMany()
    : [];
  const countMap = new Map(counts.map((row) => [Number(row.jobId), Number(row.count)]));
  const jobsWithCounts = jobs.map((job) =>
    toJobResponse(job, { applicationCount: countMap.get(job.id) ?? 0 }),
  );

  sendResponse(res, 200, true, jobsWithCounts, Messages.JOBS_FETCHED, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
};

export const updateJob = async (req: Request, res: Response) => {
    const uuid = String(req.params.uuid);
    try {
        const { categoryUuid, employmentTypeUuid, experienceLevelUuid, ...data } = createJobSchema.partial().parse(req.body);
        const { error, ids } = await resolveJobLookups({ categoryUuid, employmentTypeUuid, experienceLevelUuid });
        if (error) return sendResponse(res, 400, false, null, error);
        const job = await jobRepository.findOne({ where: { uuid } });
        if (!job) return sendResponse(res, 404, false, null, Messages.JOB_NOT_FOUND);

        Object.assign(job, data, ids);
        if (ids.categoryId !== undefined) delete (job as Partial<Job>).category;
        if (ids.employmentTypeId !== undefined) delete (job as Partial<Job>).employmentType;
        if (ids.experienceLevelId !== undefined) delete (job as Partial<Job>).experienceLevel;
        await jobRepository.save(job);
        const updatedJob = await jobRepository.findOneOrFail({ where: { id: job.id } });

        await invalidateJobCache();
        sendResponse(res, 200, true, toJobResponse(updatedJob), Messages.JOB_UPDATED);
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
    sendResponse(res, 200, true, toJobResponse(job), Messages.JOB_STATUS_UPDATED);
}

export const deleteJob = async (req: Request, res: Response) => {
    const uuid = String(req.params.uuid);
    try {
        const job = await jobRepository.findOne({ where: { uuid } });
        if (!job) return sendResponse(res, 404, false, null, Messages.JOB_NOT_FOUND);

        await AppDataSource.transaction(async (manager) => {
            await manager.getRepository(Application).delete({ jobId: job.id });
            await manager.getRepository(Job).delete({ id: job.id });
        });

        await invalidateJobCache();
        sendResponse(res, 200, true, null, Messages.JOB_DELETED);
    } catch (error) {
        sendResponse(res, 500, false, null, Messages.JOB_DELETION_FAILED, error as any);
    }
}
