import { Job } from "../entities/Job";
import { Application } from "../entities/Application";

export const toJobResponse = (job: Job, extra: Record<string, unknown> = {}) => ({
  uuid: job.uuid,
  title: job.title,
  description: job.description,
  location: job.location,
  salaryRange: job.salaryRange,
  isActive: job.isActive,
  category: job.category?.name ?? null,
  categoryUuid: job.category?.uuid ?? null,
  type: job.employmentType?.name ?? null,
  employmentTypeUuid: job.employmentType?.uuid ?? null,
  experience: job.experienceLevel?.name ?? null,
  experienceLevelUuid: job.experienceLevel?.uuid ?? null,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
  ...extra,
});

export const toApplicationResponse = (application: Application) => ({
  uuid: application.uuid,
  status: application.status,
  resumeUrl: application.resumeUrl,
  createdAt: application.createdAt,
  updatedAt: application.updatedAt,
  job: application.job ? toJobResponse(application.job) : null,
  applicant: application.user
    ? {
        uuid: application.user.uuid,
        email: application.user.email,
        firstName: application.user.firstName,
        lastName: application.user.lastName,
      }
    : null,
});

export const toOption = (item: { uuid: string; name: string }) => ({
  uuid: item.uuid,
  name: item.name,
});
