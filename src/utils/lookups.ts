import { AppDataSource } from "../data-source";
import { Category } from "../entities/Category";
import { EmploymentType } from "../entities/EmploymentType";
import { ExperienceLevel } from "../entities/ExperienceLevel";
import { Messages } from "../config/messages";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

const findIdByUuid = async (
  entity: typeof Category | typeof EmploymentType | typeof ExperienceLevel,
  uuid: unknown,
) => {
  if (!isUuid(uuid)) return null;
  const record = await AppDataSource.getRepository(entity).findOne({
    where: { uuid },
    select: { id: true },
  });
  return record?.id ?? null;
};

export interface LookupUuids {
  categoryUuid?: string;
  employmentTypeUuid?: string;
  experienceLevelUuid?: string;
}

export const resolveJobLookups = async (data: LookupUuids) => {
  const ids: { categoryId?: number; employmentTypeId?: number; experienceLevelId?: number } = {};

  if (data.categoryUuid !== undefined) {
    const id = await findIdByUuid(Category, data.categoryUuid);
    if (!id) return { error: Messages.INVALID_CATEGORY, ids };
    ids.categoryId = id;
  }
  if (data.employmentTypeUuid !== undefined) {
    const id = await findIdByUuid(EmploymentType, data.employmentTypeUuid);
    if (!id) return { error: Messages.INVALID_EMPLOYMENT_TYPE, ids };
    ids.employmentTypeId = id;
  }
  if (data.experienceLevelUuid !== undefined) {
    const id = await findIdByUuid(ExperienceLevel, data.experienceLevelUuid);
    if (!id) return { error: Messages.INVALID_EXPERIENCE_LEVEL, ids };
    ids.experienceLevelId = id;
  }

  return { error: null, ids };
};

export const resolveJobFilters = async (query: Record<string, unknown>) => {
  const where: Record<string, number> = {};
  const filters: [keyof LookupUuids, "categoryId" | "employmentTypeId" | "experienceLevelId", Parameters<typeof findIdByUuid>[0]][] = [
    ["categoryUuid", "categoryId", Category],
    ["employmentTypeUuid", "employmentTypeId", EmploymentType],
    ["experienceLevelUuid", "experienceLevelId", ExperienceLevel],
  ];

  for (const [param, column, entity] of filters) {
    if (!query[param]) continue;
    const id = await findIdByUuid(entity, query[param]);
    if (!id) return null;
    where[column] = id;
  }

  return where;
};
