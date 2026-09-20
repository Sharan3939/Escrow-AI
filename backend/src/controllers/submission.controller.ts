import { Request, Response } from "express";
import { CreateSubmissionSchema, ReviewSubmissionSchema } from "../validators/index.js";
import * as submissionService from "../services/submission.service.js";
import type { APIResponse } from "../types/index.js";
import { APIError } from "../middleware/errors.js";

export async function createSubmission(req: Request, res: Response) {
  if (!req.userId) {
    throw new APIError(401, "Authentication required");
  }

  if (req.userRole && req.userRole !== "FREELANCER") {
    throw new APIError(403, "Only users with the FREELANCER role can submit project deliverables");
  }

  const data = CreateSubmissionSchema.parse(req.body);
  const submission = await submissionService.createOrResubmitSubmission(
    req.userId,
    data,
    req.walletAddress
  );

  res.status(201).json({
    success: true,
    data: submission,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function getSubmission(req: Request, res: Response) {
  const { projectId } = req.params;
  const submission = await submissionService.getSubmissionByProjectId(
    projectId
  );

  res.json({
    success: true,
    data: submission,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function reviewSubmission(req: Request, res: Response) {
  if (!req.userId) {
    throw new APIError(401, "Authentication required");
  }

  if (req.userRole && req.userRole !== "CLIENT") {
    throw new APIError(403, "Only users with the CLIENT role can review submissions");
  }

  const { id } = req.params;
  const data = ReviewSubmissionSchema.parse(req.body);

  const updatedSubmission = await submissionService.reviewSubmission(
    req.userId,
    id,
    data
  );

  res.json({
    success: true,
    data: updatedSubmission,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}
