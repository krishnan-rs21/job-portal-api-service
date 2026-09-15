export const ApplicationStatus = {
  PENDING: "PENDING",
  REVIEWING: "REVIEWING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;

export type ApplicationStatusType = typeof ApplicationStatus[keyof typeof ApplicationStatus];
