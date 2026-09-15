import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Application } from "../entities/Application";
import { Job } from "../entities/Job";
import { User } from "../entities/User";
import { sendResponse } from "../utils/responseHelper";
import { Messages } from "../config/messages";
import { isUuid } from "../utils/lookups";
import { toApplicationResponse } from "../utils/serializers";

const applicationRepository = AppDataSource.getRepository(Application);
const jobRepository = AppDataSource.getRepository(Job);
const userRepository = AppDataSource.getRepository(User);

export const applyForJob = async (req: Request, res: Response) => {
  const jobUuid = String(req.params.uuid);
  const { uuid: userUuid } = (req as any).user;
  if (!isUuid(jobUuid)) return sendResponse(res, 404, false, null, Messages.JOB_OR_USER_NOT_FOUND);

  try {
    const [job, user] = await Promise.all([
      jobRepository.findOne({ where: { uuid: jobUuid } }),
      userRepository.findOne({ where: { uuid: userUuid } }),
    ]);

    if (!job || !user)
      return sendResponse(res, 404, false, null, Messages.JOB_OR_USER_NOT_FOUND);

    const application = applicationRepository.create({ jobId: job.id, userId: user.id });
    await applicationRepository.save(application);
    application.job = job;

    sendResponse(res, 201, true, toApplicationResponse(application), Messages.APPLICATION_SUBMITTED);
  } catch (error: any) {
    if (error.code === "23505") // Postgres unique violation
      return sendResponse(res, 400, false, null, Messages.ALREADY_APPLIED);
    sendResponse(res, 500, false, null, Messages.APPLICATION_FAILED, error as any);
  }
};

export const getMyApplications = async (req: Request, res: Response) => {
  const { uuid: userUuid } = (req as any).user;
  try {
    const user = await userRepository.findOne({ where: { uuid: userUuid } });
    if (!user) return sendResponse(res, 404, false, null, Messages.USER_NOT_FOUND);

    const applications = await applicationRepository.find({
      where: { userId: user.id },
      relations: { job: true },
      order: { createdAt: "DESC" },
    });

    sendResponse(
      res,
      200,
      true,
      applications.map(toApplicationResponse),
      Messages.APPLICATIONS_FETCHED,
    );
  } catch (error) {
    sendResponse(
      res,
      500,
      false,
      null,
      Messages.FAILED_TO_FETCH_APPLICATIONS,
      error as any,
    );
  }
};
