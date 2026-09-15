import { Request, Response } from "express";
import { z } from "zod";
import { AppDataSource } from "../data-source";
import { Application } from "../entities/Application";
import { Job } from "../entities/Job";
import { sendResponse } from "../utils/responseHelper";
import { Messages } from "../config/messages";
import { ApplicationStatus } from "../config/constants";
import { toApplicationResponse } from "../utils/serializers";

const applicationRepository = AppDataSource.getRepository(Application);
const jobRepository = AppDataSource.getRepository(Job);

const uuidSchema = z.string().uuid();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(Object.values(ApplicationStatus) as [string, ...string[]]).optional(),
  jobUuid: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(Object.values(ApplicationStatus) as [string, ...string[]]),
});


export const listApplications = async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse({
    ...req.query,
    jobUuid: req.params.uuid ?? req.query.jobUuid,
  });
  if (!parsed.success) {
    return sendResponse(res, 400, false, null, Messages.INVALID_QUERY, parsed.error as any);
  }
  const { page, limit, status, jobUuid, search } = parsed.data;

  try {
    if (jobUuid) {
      const job = await jobRepository.findOne({ where: { uuid: jobUuid } });
      if (!job) return sendResponse(res, 404, false, null, Messages.JOB_NOT_FOUND);
    }

    const baseQuery = () => {
      const query = applicationRepository
        .createQueryBuilder("application")
        .leftJoinAndSelect("application.job", "job")
        .leftJoinAndSelect("job.category", "category")
        .leftJoinAndSelect("job.employmentType", "employmentType")
        .leftJoinAndSelect("job.experienceLevel", "experienceLevel")
        .leftJoinAndSelect("application.user", "user");
      if (jobUuid) query.andWhere("job.uuid = :jobUuid", { jobUuid });
      if (search) {
        query.andWhere(
          "(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR job.title ILIKE :search)",
          { search: `%${search}%` },
        );
      }
      return query;
    };

    const listQuery = baseQuery();
    if (status) listQuery.andWhere("application.status = :status", { status });

    const [applications, total] = await listQuery
      .orderBy("application.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const statusRows: { status: string; count: string }[] = await baseQuery()
      .select("application.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("application.status")
      .getRawMany();

    const statusCounts = Object.values(ApplicationStatus).reduce<Record<string, number>>(
      (acc, key) => ({ ...acc, [key]: 0 }),
      {},
    );
    statusRows.forEach((row) => {
      statusCounts[row.status] = Number(row.count);
    });

    sendResponse(res, 200, true, applications.map(toApplicationResponse), Messages.APPLICATIONS_FETCHED, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      statusCounts,
    });
  } catch (error) {
    sendResponse(res, 500, false, null, Messages.FAILED_TO_FETCH_APPLICATIONS, error as any);
  }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
  const uuid = uuidSchema.safeParse(req.params.uuid);
  const body = updateStatusSchema.safeParse(req.body);
  if (!uuid.success) return sendResponse(res, 404, false, null, Messages.APPLICATION_NOT_FOUND);
  if (!body.success) return sendResponse(res, 400, false, null, Messages.INVALID_APPLICATION_STATUS, body.error as any);

  try {
    const application = await applicationRepository.findOne({
      where: { uuid: uuid.data },
      relations: { job: true, user: true },
    });
    if (!application) return sendResponse(res, 404, false, null, Messages.APPLICATION_NOT_FOUND);

    application.status = body.data.status as Application["status"];
    await applicationRepository.save(application);

    sendResponse(res, 200, true, toApplicationResponse(application), Messages.APPLICATION_STATUS_UPDATED);
  } catch (error) {
    sendResponse(res, 500, false, null, Messages.APPLICATION_STATUS_UPDATE_FAILED, error as any);
  }
};
