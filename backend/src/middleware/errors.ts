import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { APIResponse } from "../types/index.js";

export class APIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

export function errorHandler(
  err: Error | APIError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[Error]", err);

  if (err instanceof ZodError) {
    const errorMsg = err.issues.map((i) => i.message).join(", ");
    res.status(400).json({
      success: false,
      error: errorMsg || "Validation error",
      timestamp: new Date().toISOString(),
    } satisfies APIResponse);
    return;
  }

  if (err instanceof APIError) {
    res.status(err.status).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    } satisfies APIResponse);
    return;
  }

  if (err.message && err.message.includes("Unique constraint failed")) {
    res.status(409).json({
      success: false,
      error: "Resource already exists",
      timestamp: new Date().toISOString(),
    } satisfies APIResponse);
    return;
  }

  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export function responseFormatter(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  const originalJson = res.json.bind(res);

  res.json = function (data: Record<string, unknown>) {
    if (!data.success && !data.error) {
      return originalJson({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      } satisfies APIResponse<Record<string, unknown>>);
    }
    return originalJson(data);
  };

  next();
}
