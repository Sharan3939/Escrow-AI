import { Request, Response } from "express";
import * as milestoneService from "../services/milestone.service.js";
import {
  CreateMilestoneSubmissionSchema,
  ReviewMilestoneSchema,
  ResolveDisputeSchema,
} from "../validators/index.js";
import type { APIResponse } from "../types/index.js";
import { APIError } from "../middleware/errors.js";

export async function getMilestones(req: Request, res: Response) {
  const { projectId } = req.params;
  if (!projectId) {
    throw new APIError(400, "Project ID is required");
  }

  const milestones = await milestoneService.getMilestonesByProjectId(projectId);
  res.json({
    success: true,
    data: milestones,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function getMilestone(req: Request, res: Response) {
  const { milestoneId } = req.params;
  const milestone = await milestoneService.getMilestoneById(milestoneId);

  res.json({
    success: true,
    data: milestone,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function checkCanRelease(req: Request, res: Response) {
  const { milestoneId } = req.params;
  const eligibility = await milestoneService.canReleaseMilestone(milestoneId);

  res.json({
    success: true,
    data: eligibility,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function submitMilestone(req: Request, res: Response) {
  if (!req.userId) {
    throw new APIError(401, "Authentication required");
  }

  const { milestoneId } = req.params;
  const data = CreateMilestoneSubmissionSchema.parse(req.body);

  const submission = await milestoneService.submitMilestoneDeliverable(
    req.userId,
    milestoneId,
    data,
    req.walletAddress
  );

  res.status(201).json({
    success: true,
    data: submission,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function reviewMilestone(req: Request, res: Response) {
  if (!req.userId) {
    throw new APIError(401, "Authentication required");
  }

  const { milestoneId } = req.params;
  const data = ReviewMilestoneSchema.parse(req.body);

  const result = await milestoneService.reviewMilestone(
    req.userId,
    milestoneId,
    data
  );

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function releaseMilestone(req: Request, res: Response) {
  const { milestoneId } = req.params;
  const { txHash } = req.body;

  if (!txHash) {
    throw new APIError(400, "Transaction hash is required to record release.");
  }

  const result = await milestoneService.releaseMilestone(milestoneId, txHash);

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function resolveDispute(req: Request, res: Response) {
  if (!req.userId) {
    throw new APIError(401, "Authentication required");
  }

  const { milestoneId } = req.params;
  const data = ResolveDisputeSchema.parse(req.body);

  const result = await milestoneService.resolveMilestoneDispute(
    req.userId,
    milestoneId,
    data
  );

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}
