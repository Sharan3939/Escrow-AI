import { Request, Response } from "express";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
} from "../validators/index.js";
import * as projectService from "../services/project.service.js";
import type { APIResponse } from "../types/index.js";

export async function createProject(req: Request, res: Response) {
  const data = CreateProjectSchema.parse(req.body);
  const project = await projectService.createProject(req.userId!, data);

  res.status(201).json({
    success: true,
    data: project,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function getProjects(req: Request, res: Response) {
  const { status } = req.query;
  const projects = await projectService.getProjects({
    status: status as string,
  });

  res.json({
    success: true,
    data: projects,
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
