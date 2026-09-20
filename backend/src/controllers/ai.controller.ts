import { Request, Response } from "express";
import prisma from "../config/database.js";
import { geminiService } from "../services/gemini.service.js";
import { updateSubmissionAIReport } from "../services/submission.service.js";
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
      },
      {
        description: submission.description,
        githubUrl: submission.githubUrl,
        fileUrl: submission.fileUrl,
        revisionCount: submission.revisionCount,
      }
    );

    // Update submission with structured AI report and status
    const updated = await updateSubmissionAIReport(submissionId, report);

    console.log(`[AI Analysis Success] Submission ID: ${submissionId} - Status: ${report.status} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      data: {
        ...report,
        submission: updated,
      },
      timestamp: new Date().toISOString(),
    } satisfies APIResponse);
  } catch (error) {
    console.error(`[AI Analysis Failed] Submission ID: ${submissionId}`, error);
    
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        aiStatus: "FAILED",
        aiVerificationStatus: "FAIL",
      },
    });

    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(500, "Failed to analyze submission with AI");
  }
}
