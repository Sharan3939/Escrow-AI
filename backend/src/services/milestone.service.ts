import prisma from "../config/database.js";
import { APIError } from "../middleware/errors.js";
import type {
  CreateMilestoneSubmissionInput,
  ReviewMilestoneInput,
  ResolveDisputeInput,
} from "../validators/index.js";
import { geminiService } from "./gemini.service.js";
import { recordProjectCompletion } from "./reputation.service.js";

export interface MilestoneReleaseEligibility {
  canRelease: boolean;
  reason?: string;
  details?: {
    milestoneExists: boolean;
    isFunded: boolean;
    hasSubmission: boolean;
    aiStatus: string;
    clientReviewStatus: string;
    isDisputed: boolean;
    hasFreelancerAddress: boolean;
    alreadyReleased: boolean;
    freelancerAddress?: string;
    amount?: number;
    milestoneTitle?: string;
  };
}

export async function getMilestonesByProjectId(projectId: string) {
  return prisma.milestone.findMany({
    where: { projectId },
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { order: "asc" },
  });
}

export async function getMilestoneById(milestoneId: string) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      project: {
        include: {
          client: {
            select: { id: true, username: true, walletAddress: true },
          },
          freelancer: {
            select: { id: true, username: true, walletAddress: true },
          },
          escrow: true,
        },
      },
      submissions: {
        orderBy: { createdAt: "desc" },
        include: {
          freelancer: {
            select: { id: true, username: true, walletAddress: true },
          },
        },
      },
    },
  });

  if (!milestone) {
    throw new APIError(404, "Milestone not found");
  }

  return milestone;
}

export async function canReleaseMilestone(
  milestoneId: string
): Promise<MilestoneReleaseEligibility> {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      project: {
        include: {
          escrow: true,
          freelancer: {
            select: { id: true, walletAddress: true, username: true },
          },
        },
      },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!milestone) {
    return {
      canRelease: false,
      reason: "Milestone not found",
    };
  }

  const project = milestone.project;
  const escrow = project.escrow;

  const alreadyReleased =
    milestone.status === "RELEASED" || Boolean(milestone.releasedAt);

  if (alreadyReleased) {
    return {
      canRelease: false,
      reason: "Milestone funds have already been released.",
      details: {
        milestoneExists: true,
        isFunded: true,
        hasSubmission: Boolean(milestone.submissions[0]),
        aiStatus: milestone.submissions[0]?.aiVerificationStatus || "PENDING",
        clientReviewStatus:
          milestone.submissions[0]?.clientReviewStatus || "PENDING",
        isDisputed: false,
        hasFreelancerAddress: Boolean(
          project.freelancerWalletAddress || project.freelancer?.walletAddress
        ),
        alreadyReleased: true,
      },
    };
  }

  const isEscrowFunded =
    escrow &&
    (escrow.status === "FUNDED" ||
      escrow.status === "LOCKED" ||
      escrow.status === "PARTIALLY_RELEASED" ||
      Boolean(escrow.transactionHash) ||
      Boolean(escrow.fundedAt));

  const isMilestoneFunded =
    isEscrowFunded ||
    milestone.status === "FUNDED" ||
    milestone.status === "IN_PROGRESS" ||
    milestone.status === "SUBMITTED" ||
    milestone.status === "AI_REVIEW" ||
    milestone.status === "CLIENT_REVIEW" ||
    milestone.status === "APPROVED";

  if (!isMilestoneFunded) {
    return {
      canRelease: false,
      reason: "Escrow is not funded. Client must lock project funds on Cardano first.",
      details: {
        milestoneExists: true,
        isFunded: false,
        hasSubmission: Boolean(milestone.submissions[0]),
        aiStatus: milestone.submissions[0]?.aiVerificationStatus || "PENDING",
        clientReviewStatus:
          milestone.submissions[0]?.clientReviewStatus || "PENDING",
        isDisputed: false,
        hasFreelancerAddress: Boolean(
          project.freelancerWalletAddress || project.freelancer?.walletAddress
        ),
        alreadyReleased: false,
      },
    };
  }

  const submission = milestone.submissions[0];
  if (!submission) {
    return {
      canRelease: false,
      reason: "No freelancer deliverable has been submitted for this milestone.",
      details: {
        milestoneExists: true,
        isFunded: true,
        hasSubmission: false,
        aiStatus: "PENDING",
        clientReviewStatus: "PENDING",
        isDisputed: false,
        hasFreelancerAddress: Boolean(
          project.freelancerWalletAddress || project.freelancer?.walletAddress
        ),
        alreadyReleased: false,
      },
    };
  }

  const isDisputed =
    milestone.status === "DISPUTED" ||
    submission.clientReviewStatus === "DISPUTED" ||
    escrow?.status === "DISPUTED";

  if (isDisputed) {
    return {
      canRelease: false,
      reason: "Cannot release: Milestone or Escrow is in DISPUTED state. Requires dispute resolution.",
      details: {
        milestoneExists: true,
        isFunded: true,
        hasSubmission: true,
        aiStatus: submission.aiVerificationStatus,
        clientReviewStatus: submission.clientReviewStatus,
        isDisputed: true,
        hasFreelancerAddress: Boolean(
          project.freelancerWalletAddress || project.freelancer?.walletAddress
        ),
        alreadyReleased: false,
      },
    };
  }

  const aiPassed = submission.aiVerificationStatus === "PASS";
  if (!aiPassed) {
    return {
      canRelease: false,
      reason: `Gemini AI Verification status is '${submission.aiVerificationStatus}'. Must be 'PASS' to be eligible for release.`,
      details: {
        milestoneExists: true,
        isFunded: true,
        hasSubmission: true,
        aiStatus: submission.aiVerificationStatus,
        clientReviewStatus: submission.clientReviewStatus,
        isDisputed: false,
        hasFreelancerAddress: Boolean(
          project.freelancerWalletAddress || project.freelancer?.walletAddress
        ),
        alreadyReleased: false,
      },
    };
  }

  const clientApproved =
    submission.clientReviewStatus === "APPROVED" ||
    milestone.status === "APPROVED";

  if (!clientApproved) {
    return {
      canRelease: false,
      reason: `Client Satisfaction status is '${submission.clientReviewStatus}'. Client approval is required before milestone funds can be released.`,
      details: {
        milestoneExists: true,
        isFunded: true,
        hasSubmission: true,
        aiStatus: submission.aiVerificationStatus,
        clientReviewStatus: submission.clientReviewStatus,
        isDisputed: false,
        hasFreelancerAddress: Boolean(
          project.freelancerWalletAddress || project.freelancer?.walletAddress
        ),
        alreadyReleased: false,
      },
    };
  }

  const freelancerAddress =
    project.freelancerWalletAddress || project.freelancer?.walletAddress;

  if (!freelancerAddress) {
    return {
      canRelease: false,
      reason: "Assigned freelancer does not have a registered Cardano wallet address.",
      details: {
        milestoneExists: true,
        isFunded: true,
        hasSubmission: true,
        aiStatus: submission.aiVerificationStatus,
        clientReviewStatus: submission.clientReviewStatus,
        isDisputed: false,
        hasFreelancerAddress: false,
        alreadyReleased: false,
      },
    };
  }

  return {
    canRelease: true,
    details: {
      milestoneExists: true,
      isFunded: true,
      hasSubmission: true,
      aiStatus: submission.aiVerificationStatus,
      clientReviewStatus: submission.clientReviewStatus,
      isDisputed: false,
      hasFreelancerAddress: true,
      alreadyReleased: false,
      freelancerAddress,
      amount: Number(milestone.amount),
      milestoneTitle: milestone.title,
    },
  };
}

export async function submitMilestoneDeliverable(
  freelancerId: string,
  milestoneId: string,
  data: CreateMilestoneSubmissionInput,
  freelancerWalletAddress?: string
) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      project: {
        include: {
          escrow: true,
        },
      },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!milestone) {
    throw new APIError(404, "Milestone not found");
  }

  const project = milestone.project;

  if (project.clientId === freelancerId) {
    throw new APIError(403, "Clients cannot submit deliverables for their own projects.");
  }

  if (milestone.status === "RELEASED") {
    throw new APIError(400, "Cannot submit deliverable: Milestone has already been released.");
  }

  if (project.freelancerId && project.freelancerId !== freelancerId) {
    throw new APIError(403, "You are not the assigned freelancer for this milestone.");
  }

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

  if (!project.freelancerId || !project.freelancerWalletAddress) {
    await prisma.project.update({
      where: { id: project.id },
      data: {
        freelancerId,
        freelancerWalletAddress:
          freelancerWalletAddress || project.freelancerWalletAddress,
        status: "ASSIGNED",
      },
    });
  }

  const existingSubmission = milestone.submissions[0];
  let submission;

  if (existingSubmission && existingSubmission.freelancerId === freelancerId) {
    if (
      existingSubmission.clientReviewStatus === "APPROVED" &&
      (milestone.status as string) === "RELEASED"
    ) {
      throw new APIError(400, "Milestone has already been approved and released.");
    }

    const nextRevision = existingSubmission.revisionCount + 1;
    if (nextRevision > existingSubmission.maxRevisions) {
      throw new APIError(
        400,
        `Maximum revision limit (${existingSubmission.maxRevisions}) reached. Please contact client.`
      );
    }

    submission = await prisma.submission.update({
      where: { id: existingSubmission.id },
      data: {
        description: data.description,
        githubUrl: data.githubUrl || null,
        fileUrl: data.fileUrl || null,
        status: "SUBMITTED",
        aiVerificationStatus: "PENDING",
        clientReviewStatus: "PENDING",
        revisionCount: nextRevision,
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
        projectId: project.id,
        milestoneId: milestone.id,
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

  // Update milestone status to SUBMITTED & submittedAt
  await prisma.milestone.update({
    where: { id: milestone.id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  // Automatically trigger Gemini AI analysis
  triggerMilestoneAiAnalysisSafely(submission.id, project, milestone, {
    description: data.description,
    githubUrl: data.githubUrl,
    fileUrl: data.fileUrl,
    revisionCount: submission.revisionCount,
  });

  return submission;
}

async function triggerMilestoneAiAnalysisSafely(
  submissionId: string,
  project: { title: string; description: string },
  milestone: { id: string; title: string; description: string; amount: any; order: number },
  submissionData: {
    description: string;
    githubUrl?: string | null;
    fileUrl?: string | null;
    revisionCount: number;
  }
) {
  try {
    const report = await geminiService.analyzeSubmission(
      {
        title: project.title,
        description: project.description,
      },
      submissionData,
      {
        title: milestone.title,
        description: milestone.description,
        amount: milestone.amount,
        order: milestone.order,
      }
    );

    const aiStatusEnum =
      report.status === "PASS"
        ? "PASS"
        : report.status === "NEEDS_REVISION"
        ? "NEEDS_REVISION"
        : "FAIL";

    await prisma.submission.update({
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

    // Also update milestone status to AI_REVIEW or CLIENT_REVIEW if pass
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: {
        status: aiStatusEnum === "PASS" ? "CLIENT_REVIEW" : aiStatusEnum === "NEEDS_REVISION" ? "REVISION_REQUESTED" : "AI_REVIEW",
      },
    });
  } catch (err: any) {
    console.warn(
      `[Auto AI Verification] Gemini analysis skipped or failed for milestone submission ${submissionId}:`,
      err.message
    );
  }
}

export async function reviewMilestone(
  clientId: string,
  milestoneId: string,
  input: ReviewMilestoneInput
) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      project: {
        include: { escrow: true },
      },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!milestone) {
    throw new APIError(404, "Milestone not found");
  }

  if (milestone.project.clientId !== clientId) {
    throw new APIError(403, "Only the project client can review this milestone.");
  }

  if (milestone.status === "RELEASED") {
    throw new APIError(400, "Cannot review milestone: Funds have already been released.");
  }

  const latestSubmission = milestone.submissions[0];
  if (!latestSubmission) {
    throw new APIError(400, "No deliverable submitted yet to review.");
  }

  const { action, feedback } = input;

  if (action === "APPROVE") {
    if (latestSubmission.aiVerificationStatus !== "PASS") {
      throw new APIError(
        400,
        `Cannot approve milestone: Gemini AI Verification is '${latestSubmission.aiVerificationStatus}'. Only deliverables with AI Status 'PASS' can be approved.`
      );
    }

    await prisma.submission.update({
      where: { id: latestSubmission.id },
      data: {
        clientReviewStatus: "APPROVED",
        clientFeedback: feedback || "Client approved the milestone delivery.",
        clientReviewedAt: new Date(),
        clientReviewedBy: clientId,
        status: "APPROVED",
      },
    });

    return prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
      include: {
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  }

  if (action === "REQUEST_REVISION") {
    if (!feedback || feedback.trim().length === 0) {
      throw new APIError(400, "Client feedback is required when requesting a revision.");
    }

    await prisma.submission.update({
      where: { id: latestSubmission.id },
      data: {
        clientReviewStatus: "REVISION_REQUESTED",
        clientFeedback: feedback.trim(),
        clientReviewedAt: new Date(),
        clientReviewedBy: clientId,
        status: "REVIEWING",
      },
    });

    return prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: "REVISION_REQUESTED",
      },
      include: {
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  }

  if (action === "DISPUTE") {
    if (!feedback || feedback.trim().length === 0) {
      throw new APIError(400, "A reason is required when raising a dispute.");
    }

    await prisma.submission.update({
      where: { id: latestSubmission.id },
      data: {
        clientReviewStatus: "DISPUTED",
        clientFeedback: feedback.trim(),
        clientReviewedAt: new Date(),
        clientReviewedBy: clientId,
        status: "REVIEWING",
      },
    });

    return prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: "DISPUTED",
      },
      include: {
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  }

  throw new APIError(400, "Invalid milestone review action");
}

export async function releaseMilestone(milestoneId: string, txHash: string) {
  const eligibility = await canReleaseMilestone(milestoneId);
  if (!eligibility.canRelease) {
    throw new APIError(400, eligibility.reason || "Milestone is not eligible for release.");
  }

  if (!txHash || txHash.trim().length < 5) {
    throw new APIError(400, "A valid Cardano transaction hash is required to record release.");
  }

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      project: {
        include: {
          milestones: { orderBy: { order: "asc" } },
          escrow: true,
        },
      },
    },
  });

  if (!milestone) {
    throw new APIError(404, "Milestone not found");
  }

  // Update this milestone to RELEASED
  const updatedMilestone = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      status: "RELEASED",
      releasedAt: new Date(),
      releaseTxHash: txHash,
    },
  });

  // Activate next milestone if available
  const allMilestones = milestone.project.milestones;
  const nextMilestone = allMilestones.find(
    (m) => m.order === milestone.order + 1 && m.status === "PENDING"
  );

  if (nextMilestone) {
    await prisma.milestone.update({
      where: { id: nextMilestone.id },
      data: { status: "IN_PROGRESS" },
    });
  }

  // Check if ALL milestones for this project are now RELEASED
  const remainingUnreleased = allMilestones.filter(
    (m) => m.id !== milestoneId && m.status !== "RELEASED"
  );

  const allReleased = remainingUnreleased.length === 0;

  if (allReleased) {
    await prisma.project.update({
      where: { id: milestone.projectId },
      data: { status: "COMPLETED" },
    });

    if (milestone.project.escrow) {
      await prisma.escrow.update({
        where: { id: milestone.project.escrow.id },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
        },
      });
    }

    // Award reputation to freelancer
    await recordProjectCompletion(milestone.projectId);
  } else {
    // Project is in progress, escrow is partially released
    await prisma.project.update({
      where: { id: milestone.projectId },
      data: { status: "ASSIGNED" },
    });

    if (milestone.project.escrow) {
      await prisma.escrow.update({
        where: { id: milestone.project.escrow.id },
        data: { status: "PARTIALLY_RELEASED" },
      });
    }
  }

  return {
    milestone: updatedMilestone,
    projectCompleted: allReleased,
  };
}

export async function resolveMilestoneDispute(
  _adminUserId: string,
  milestoneId: string,
  input: ResolveDisputeInput
) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!milestone) {
    throw new APIError(404, "Milestone not found");
  }

  const latestSub = milestone.submissions[0];

  if (input.decision === "RELEASE_TO_FREELANCER") {
    if (latestSub) {
      await prisma.submission.update({
        where: { id: latestSub.id },
        data: {
          clientReviewStatus: "APPROVED",
          clientFeedback: `[Admin Dispute Resolution] ${input.notes || "Dispute resolved in favor of freelancer."}`,
          status: "APPROVED",
        },
      });
    }

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: "APPROVED", approvedAt: new Date() },
    });

    return {
      message: "Dispute resolved in favor of freelancer. Milestone is now APPROVED for on-chain release.",
      decision: input.decision,
    };
  }

  if (input.decision === "REFUND_TO_CLIENT") {
    if (latestSub) {
      await prisma.submission.update({
        where: { id: latestSub.id },
        data: {
          clientReviewStatus: "REVISION_REQUESTED",
          clientFeedback: `[Admin Dispute Resolution] Refund to client: ${input.notes || "Dispute resolved in favor of client."}`,
          status: "REJECTED",
        },
      });
    }

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: "FAILED" },
    });

    return {
      message: "Dispute resolved in favor of client.",
      decision: input.decision,
    };
  }

  throw new APIError(400, "Invalid dispute resolution decision");
}
