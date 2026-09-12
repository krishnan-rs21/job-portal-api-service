import { Response } from "express";

export interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  data: T | null = null,
  message: string = "",
  meta: Meta | null = null,
) => {
  const response: any = {
    success,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
};
