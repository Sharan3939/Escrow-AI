import prisma from "../config/database.js";
import { APIError } from "../middleware/errors.js";
import type { CreateSubmissionInput } from "../validators/index.js";

export async function createSubmission(
  freelancerId: string,
  data: CreateSubmissionInput
) {
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  return prisma.submission.create({
    data: {
      projectId: data.projectId,
      freelancerId,
      description: data.description,
      githubUrl: data.githubUrl,
      fileUrl: data.fileUrl,
      status: "SUBMITTED",
    },
  });
}

export async function getSubmissionByProjectId(projectId: string) {
  const submission = await prisma.submission.findFirst({
    where: { projectId },
    include: {
      freelancer: {
        select: { id: true, username: true, walletAddress: true },
      },
      project: true,
    },
  });

  if (!submission) {
    throw new APIError(404, "Submission not found");
  }

  return submission;
}

export async function updateSubmissionAIScore(
  submissionId: string,
  score: number,
  report: string
) {
  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      aiScore: score,
      aiReport: report,
      status: score >= 75 ? "APPROVED" : "REVIEWING",
    },
  });
}
