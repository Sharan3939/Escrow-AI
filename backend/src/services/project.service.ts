import prisma from "../config/database.js";
import { APIError } from "../middleware/errors.js";
import type { CreateProjectInput, UpdateProjectInput } from "../validators/index.js";

export async function createProject(
  clientId: string,
  data: CreateProjectInput
) {
  return prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      budget: parseFloat(data.budget),
      deadline: new Date(data.deadline),
      clientId,
      status: "OPEN",
    },
  });
}

export async function getProjects(filters?: { status?: string }) {
  return prisma.project.findMany({
    where: filters?.status ? { status: filters.status as "OPEN" | "ASSIGNED" | "SUBMITTED" | "APPROVED" | "COMPLETED" } : {},
    include: {
      client: {
        select: {
          id: true,
          username: true,
          walletAddress: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          username: true,
          walletAddress: true,
        },
      },
      escrow: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectById(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: {
        select: { id: true, username: true, walletAddress: true },
      },
      freelancer: {
        select: { id: true, username: true, walletAddress: true },
      },
      escrow: true,
      submissions: true,
      transactions: true,
    },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  return project;
}

export async function updateProject(
  id: string,
  clientId: string,
  data: UpdateProjectInput
) {
  const project = await getProjectById(id);

  if (project.clientId !== clientId) {
    throw new APIError(403, "Not authorized to update this project");
  }

  return prisma.project.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      budget: data.budget ? parseFloat(data.budget) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    },
  });
}

export async function assignFreelancer(projectId: string, freelancerId: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      freelancerId,
      status: "ASSIGNED",
    },
  });
}
