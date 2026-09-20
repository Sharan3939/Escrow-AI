import { Request, Response } from "express";
import * as reputationService from "../services/reputation.service.js";
import { CreateFreelancerReviewSchema } from "../validators/index.js";
import type { APIResponse } from "../types/index.js";
import { APIError } from "../middleware/errors.js";

export async function getFreelancerProfile(req: Request, res: Response) {
  const { userId } = req.params;
  if (!userId) {
    throw new APIError(400, "User ID is required");
  }

  const profile = await reputationService.getFreelancerProfile(userId);

  res.json({
    success: true,
    data: profile,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function getFreelancerReviews(req: Request, res: Response) {
  const { userId } = req.params;
  if (!userId) {
    throw new APIError(400, "User ID is required");
  }

  const reviews = await reputationService.getFreelancerReviews(userId);

  res.json({
    success: true,
    data: reviews,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function submitProjectReview(req: Request, res: Response) {
  if (!req.userId) {
    throw new APIError(401, "Authentication required");
  }

  const { projectId } = req.params;
  const data = CreateFreelancerReviewSchema.parse(req.body);

  const review = await reputationService.submitProjectReview(
    req.userId,
    projectId,
    data.rating,
    data.comment
  );

  res.status(201).json({
    success: true,
    data: review,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}
