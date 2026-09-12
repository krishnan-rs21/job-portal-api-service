import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { sendResponse } from "../utils/responseHelper";
import redis from "../lib/redis";

const prisma = new PrismaClient();

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
    const postedById = (req as any).user.uuid; // This would need a lookup to get ID
    
    // Quick fix: Assuming user uuid is passed, but schema needs user id.
    // For now, lookup user by uuid to get internal id.
    const user = await prisma.user.findUnique({ where: { uuid: postedById } });
    if(!user) return sendResponse(res, 404, false, null, "User not found");

    const job = await prisma.job.create({
      data: { ...data, postedById: user.id },
    });

    await invalidateJobCache();
    sendResponse(res, 201, true, job, "Job created successfully");
  } catch (error) {
    sendResponse(res, 400, false, null, "Job creation failed", error as any);
  }
};

export const listJobs = async (req: Request, res: Response) => {
  const { page = "1", limit = "10", search, categoryId, experience } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (search) where.title = { contains: search as string, mode: "insensitive" };
  if (categoryId) where.categoryId = parseInt(categoryId as string);
  if (experience) where.experience = experience as string;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({ where, skip, take: parseInt(limit as string) }),
    prisma.job.count({ where }),
  ]);

  sendResponse(res, 200, true, jobs, "Jobs fetched", {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    total,
    totalPages: Math.ceil(total / parseInt(limit as string)),
  });
};

export const updateJob = async (req: Request, res: Response) => {
    const { uuid } = req.params;
    try {
        const data = createJobSchema.partial().parse(req.body);
        const job = await prisma.job.update({
            where: { uuid },
            data
        });
        await invalidateJobCache();
        sendResponse(res, 200, true, job, "Job updated");
    } catch (error) {
        sendResponse(res, 400, false, null, "Update failed", error as any);
    }
}

export const toggleJobStatus = async (req: Request, res: Response) => {
    const { uuid } = req.params;
    const { isActive } = req.body;
    const job = await prisma.job.update({
        where: { uuid },
        data: { isActive }
    });
    await invalidateJobCache();
    sendResponse(res, 200, true, job, "Job status updated");
}

export const deleteJob = async (req: Request, res: Response) => {
    const { uuid } = req.params;
    await prisma.job.delete({ where: { uuid } });
    await invalidateJobCache();
    sendResponse(res, 200, true, null, "Job deleted");
}
