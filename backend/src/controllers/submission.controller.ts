import { Request, Response } from "express";
import { CreateSubmissionSchema } from "../validators/index.js";
import * as submissionService from "../services/submission.service.js";
import type { APIResponse } from "../types/index.js";

export async function createSubmission(req: Request, res: Response) {
  const data = CreateSubmissionSchema.parse(req.body);
  const submission = await submissionService.createSubmission(
    req.userId!,
    data
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
