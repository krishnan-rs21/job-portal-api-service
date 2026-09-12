import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sendResponse } from "../utils/responseHelper";

const prisma = new PrismaClient();

export const applyForJob = async (req: Request, res: Response) => {
  const { uuid: jobUuid } = req.params;
  const { uuid: userUuid } = (req as any).user;

  try {
    const [job, user] = await Promise.all([
      prisma.job.findUnique({ where: { uuid: jobUuid } }),
      prisma.user.findUnique({ where: { uuid: userUuid } }),
    ]);

    if (!job || !user)
      return sendResponse(res, 404, false, null, "Job or User not found");

    const application = await prisma.application.create({
      data: { jobId: job.id, userId: user.id },
    });

    sendResponse(res, 201, true, application, "Application submitted");
  } catch (error: any) {
    if (error.code === "P2002")
      return sendResponse(res, 400, false, null, "Already applied");
    sendResponse(res, 500, false, null, "Application failed", error as any);
  }
};

export const getMyApplications = async (req: Request, res: Response) => {
  const { uuid: userUuid } = (req as any).user;
  try {
    const user = await prisma.user.findUnique({ where: { uuid: userUuid } });
    if (!user) return sendResponse(res, 404, false, null, "User not found");

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: { job: { select: { title: true, uuid: true } } },
    });

    sendResponse(res, 200, true, applications, "Applications fetched");
  } catch (error) {
    sendResponse(
      res,
      500,
      false,
      null,
      "Failed to fetch applications",
      error as any,
    );
  }
};
