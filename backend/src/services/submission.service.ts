import prisma from "../config/database.js";
import { APIError } from "../middleware/errors.js";
import type { CreateSubmissionInput, ReviewSubmissionInput } from "../validators/index.js";
import type { AIReportType } from "../validators/aiReport.schema.js";
import { geminiService } from "./gemini.service.js";

export async function createOrResubmitSubmission(
  freelancerId: string,
  data: CreateSubmissionInput,
  freelancerWalletAddress?: string
) {
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    include: {
      escrow: true,
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  // Client cannot submit as a freelancer
  if (project.clientId === freelancerId) {
    throw new APIError(403, "Clients cannot submit deliverables for their own projects.");
  }

  // Check if escrow is released
  if (project.escrow?.status === "RELEASED") {
    throw new APIError(400, "Cannot submit deliverable: Escrow funds have already been released.");
  }

  // Authorization check: If project has an assigned freelancer, only they can submit
  if (project.freelancerId && project.freelancerId !== freelancerId) {
    throw new APIError(403, "You are not the assigned freelancer for this project");
  }

  // Wallet address match check if project has freelancerWalletAddress stored
  if (
    project.freelancerWalletAddress &&
    freelancerWalletAddress &&
    project.freelancerWalletAddress !== freelancerWalletAddress
  ) {
    throw new APIError(
      403,
      "Authenticated wallet address does not match the registered freelancer wallet for this project."
    );
  }

  // If project has no freelancer or wallet assigned yet, record this freelancer and wallet
  if (!project.freelancerId || !project.freelancerWalletAddress) {
    await prisma.project.update({
      where: { id: project.id },
      data: {
        freelancerId,
        freelancerWalletAddress: freelancerWalletAddress || project.freelancerWalletAddress,
        status: "ASSIGNED",
      },
    });
  }

  const existingSubmission = project.submissions[0];

  let submission;
  if (existingSubmission && existingSubmission.freelancerId === freelancerId) {
    // Prevent resubmission if already approved and released
    if (
      existingSubmission.clientReviewStatus === "APPROVED" &&
      (project.escrow?.status as string) === "RELEASED"
    ) {
      throw new APIError(400, "Milestone has already been approved and released.");
    }

    const nextRevisionCount = existingSubmission.revisionCount + 1;
    if (nextRevisionCount > existingSubmission.maxRevisions) {
      throw new APIError(
        400,
        `Maximum revision limit (${existingSubmission.maxRevisions}) reached. Please contact the client or support.`
      );
    }

    submission = await prisma.submission.update({
      where: { id: existingSubmission.id },
      data: {
        milestoneId: data.milestoneId || existingSubmission.milestoneId || null,
        description: data.description,
        githubUrl: data.githubUrl || null,
        fileUrl: data.fileUrl || null,
        status: "SUBMITTED",
        aiVerificationStatus: "PENDING",
        clientReviewStatus: "PENDING",
        revisionCount: nextRevisionCount,
        aiScore: null,
        aiReport: null,
        aiFeedback: null,
        aiAnalyzedAt: null,
        aiStatus: "PROCESSING",
      },
    });
  } else {
    submission = await prisma.submission.create({
      data: {
        projectId: data.projectId,
        milestoneId: data.milestoneId || null,
        freelancerId,
        description: data.description,
        githubUrl: data.githubUrl || null,
        fileUrl: data.fileUrl || null,
        status: "SUBMITTED",
        aiVerificationStatus: "PENDING",
        clientReviewStatus: "PENDING",
        revisionCount: 0,
        aiStatus: "PROCESSING",
      },
    });
  }

  // Update project status to SUBMITTED
  await prisma.project.update({
    where: { id: data.projectId },
    data: { status: "SUBMITTED" },
  });

  // Automatically trigger Gemini AI analysis in the background
  triggerAiAnalysisSafely(submission.id, project, {
    description: data.description,
    githubUrl: data.githubUrl,
    fileUrl: data.fileUrl,
    revisionCount: submission.revisionCount,
  });

  return submission;
}

async function triggerAiAnalysisSafely(
  submissionId: string,
  project: { title: string; description: string },
  submissionData: { description: string; githubUrl?: string | null; fileUrl?: string | null; revisionCount: number }
) {
  try {
    const report = await geminiService.analyzeSubmission(
      {
        title: project.title,
        description: project.description,
      },
      submissionData
    );

    await updateSubmissionAIReport(submissionId, report);
  } catch (err: any) {
    console.warn(`[Auto AI Verification] Gemini run skipped or failed for submission ${submissionId}:`, err.message);
    // Keep in pending or mark as pending for manual trigger if placeholder key
  }
}

export async function updateSubmissionAIReport(
  submissionId: string,
  report: AIReportType
) {
  const aiStatusEnum =
    report.status === "PASS"
      ? "PASS"
      : report.status === "NEEDS_REVISION"
      ? "NEEDS_REVISION"
      : "FAIL";

  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      aiScore: report.score ?? report.qualityScore ?? 0,
      aiFeedback: report.summary ?? report.projectSummary ?? "",
      aiReport: JSON.stringify(report),
      aiVerificationStatus: aiStatusEnum,
      aiAnalyzedAt: new Date(),
      aiStatus: "COMPLETED",
    },
  });
}

export async function reviewSubmission(
  clientId: string,
  submissionId: string,
  input: ReviewSubmissionInput
) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      project: {
        include: {
          escrow: true,
        },
      },
    },
  });

  if (!submission) {
    throw new APIError(404, "Submission not found");
  }

  if (submission.project.clientId !== clientId) {
    throw new APIError(403, "Only the project client can review this submission");
  }

  if (submission.project.escrow?.status === "RELEASED") {
    throw new APIError(400, "Cannot modify review status: Escrow has already been released.");
  }

  const { action, feedback } = input;

  if (action === "APPROVE") {
    if (submission.aiVerificationStatus !== "PASS") {
      throw new APIError(
        400,
        `Cannot approve submission: Gemini AI Verification is '${submission.aiVerificationStatus}'. Only submissions with AI Status 'PASS' can be approved.`
      );
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        clientReviewStatus: "APPROVED",
        clientFeedback: feedback || "Client approved the milestone delivery.",
        clientReviewedAt: new Date(),
        clientReviewedBy: clientId,
        status: "APPROVED",
      },
    });

    await prisma.project.update({
      where: { id: submission.projectId },
      data: { status: "APPROVED" },
    });

    return updated;
  }

  if (action === "REQUEST_REVISION") {
    if (!feedback || feedback.trim().length === 0) {
      throw new APIError(400, "Client feedback is required when requesting a revision.");
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        clientReviewStatus: "REVISION_REQUESTED",
        clientFeedback: feedback.trim(),
        clientReviewedAt: new Date(),
        clientReviewedBy: clientId,
        status: "REVIEWING",
      },
    });

    await prisma.project.update({
      where: { id: submission.projectId },
      data: { status: "IN_REVIEW" },
    });

    return updated;
  }

  if (action === "DISPUTE") {
    if (!feedback || feedback.trim().length === 0) {
      throw new APIError(400, "A reason is required when raising a dispute.");
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        clientReviewStatus: "DISPUTED",
        clientFeedback: feedback.trim(),
        clientReviewedAt: new Date(),
        clientReviewedBy: clientId,
        status: "REVIEWING",
      },
    });

    if (submission.project.escrow) {
      await prisma.escrow.update({
        where: { id: submission.project.escrow.id },
        data: { status: "DISPUTED" },
      });
    }

    return updated;
  }

  throw new APIError(400, "Invalid review action");
}

export async function getSubmissionByProjectId(projectId: string) {
  const submission = await prisma.submission.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
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
