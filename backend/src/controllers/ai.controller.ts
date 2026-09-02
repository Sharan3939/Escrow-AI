import { Request, Response } from "express";
import prisma from "../config/database.js";
import { geminiService } from "../services/gemini.service.js";
import { APIError } from "../middleware/errors.js";
import type { APIResponse } from "../types/index.js";

export async function analyze(req: Request, res: Response) {
  const { submissionId } = req.body;

  if (!submissionId) {
    throw new APIError(400, "Submission ID is required");
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      project: true,
    },
  });

  if (!submission) {
    throw new APIError(404, "Submission not found");
  }

  const project = submission.project;

  // Authorization: Only client or authorized participant
  const isClient = project.clientId === req.userId;
  // If we also want to allow the freelancer to trigger it:
  const isFreelancer = submission.freelancerId === req.userId;

  if (!isClient && !isFreelancer) {
    throw new APIError(403, "Not authorized to trigger AI analysis for this submission");
  }

  // Update status to processing
  await prisma.submission.update({
    where: { id: submissionId },
    data: { aiStatus: "PROCESSING" },
  });

  try {
    const report = await geminiService.analyzeSubmission(
      {
        title: project.title,
        description: project.description,
        requirements: undefined, // Add requirements if available in Project schema
      },
      {
        description: submission.description,
        githubUrl: submission.githubUrl,
        fileUrl: submission.fileUrl,
      }
    );

    // Update submission with AI report
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        aiScore: report.qualityScore,
        aiReport: JSON.stringify(report),
        aiAnalyzedAt: new Date(),
        aiStatus: "COMPLETED",
      },
    });

    console.log(`[AI Analysis Success] Submission ID: ${submissionId} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    } satisfies APIResponse);
  } catch (error) {
    console.error(`[AI Analysis Failed] Submission ID: ${submissionId}`, error);
    
    await prisma.submission.update({
      where: { id: submissionId },
      data: { aiStatus: "FAILED" },
    });

    throw new APIError(500, "Failed to analyze submission with AI");
  }
}
