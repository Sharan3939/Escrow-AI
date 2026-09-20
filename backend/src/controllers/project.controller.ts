import { Request, Response } from "express";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
} from "../validators/index.js";
import * as projectService from "../services/project.service.js";
import type { APIResponse } from "../types/index.js";
import { APIError } from "../middleware/errors.js";

export async function createProject(req: Request, res: Response) {
  if (req.userRole && req.userRole !== "CLIENT") {
    throw new APIError(403, "Only users with the CLIENT role can create projects and escrows");
  }

  const data = CreateProjectSchema.parse(req.body);
  const project = await projectService.createProject(req.userId!, data);

  res.status(201).json({
    success: true,
    data: project,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function getProjects(req: Request, res: Response) {
  const { status, clientId, freelancerId } = req.query;
  const projects = await projectService.getProjects({
    status: status as string,
    clientId: clientId as string,
    freelancerId: freelancerId as string,
  });

  res.json({
    success: true,
    data: projects,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function getFreelancerProjects(req: Request, res: Response) {
  if (!req.userId) {
    throw new APIError(401, "Authentication required");
  }

  const projects = await projectService.getFreelancerProjects(req.userId);

  res.json({
    success: true,
    data: projects,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function acceptProject(req: Request, res: Response) {
  if (!req.userId) {
    throw new APIError(401, "Authentication required");
  }

  if (req.userRole && req.userRole !== "FREELANCER") {
    throw new APIError(403, "Only users with the FREELANCER role can accept projects");
  }

  const { id } = req.params;
  const walletAddress = req.walletAddress;

  if (!walletAddress) {
    throw new APIError(400, "Connect your freelancer Cardano wallet before accepting this project.");
  }

  const project = await projectService.acceptProject(
    id,
    req.userId,
    walletAddress
  );

  res.json({
    success: true,
    data: project,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function getProjectById(req: Request, res: Response) {
  const { id } = req.params;
  const project = await projectService.getProjectById(id);

  res.json({
    success: true,
    data: project,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function updateProject(req: Request, res: Response) {
  const { id } = req.params;
  const data = UpdateProjectSchema.parse(req.body);
  const project = await projectService.updateProject(id, req.userId!, data);

  res.json({
    success: true,
    data: project,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function deleteProject(req: Request, res: Response) {
  const { id } = req.params;
  const result = await projectService.deleteProject(id, req.userId!);

  res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}


