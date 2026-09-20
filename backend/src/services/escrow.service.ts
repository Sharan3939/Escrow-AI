import prisma from "../config/database.js";
import { APIError } from "../middleware/errors.js";
import type { CreateEscrowInput, ResolveDisputeInput } from "../validators/index.js";

export interface ReleaseEligibilityResult {
  canRelease: boolean;
  reason?: string;
  details?: {
    escrowExists: boolean;
    isFunded: boolean;
    hasSubmission: boolean;
    aiStatus: string;
    clientReviewStatus: string;
    isDisputed: boolean;
    hasFreelancerAddress: boolean;
    alreadyReleased: boolean;
    freelancerAddress?: string;
    amount?: number;
  };
}

export async function canReleaseEscrow(projectId: string): Promise<ReleaseEligibilityResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      escrow: true,
      freelancer: {
        select: { id: true, walletAddress: true, username: true },
      },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) {
    return {
      canRelease: false,
      reason: "Project not found",
    };
  }

  const escrow = project.escrow;
  if (!escrow) {
    return {
      canRelease: false,
      reason: "Escrow contract record does not exist for this project.",
      details: {
        escrowExists: false,
        isFunded: false,
        hasSubmission: false,
        aiStatus: "PENDING",
        clientReviewStatus: "PENDING",
        isDisputed: false,
        hasFreelancerAddress: false,
        alreadyReleased: false,
      },
    };
  }

  const alreadyReleased = escrow.status === "RELEASED";
  if (alreadyReleased) {
    return {
      canRelease: false,
      reason: "Escrow funds have already been released.",
      details: {
        escrowExists: true,
        isFunded: true,
        hasSubmission: Boolean(project.submissions[0]),
        aiStatus: project.submissions[0]?.aiVerificationStatus || "PENDING",
        clientReviewStatus: project.submissions[0]?.clientReviewStatus || "PENDING",
        isDisputed: false,
        hasFreelancerAddress: Boolean(project.freelancer?.walletAddress),
        alreadyReleased: true,
      },
    };
  }

  const isFunded =
    escrow.status === "FUNDED" ||
    escrow.status === "LOCKED" ||
    Boolean(escrow.transactionHash) ||
    Boolean(escrow.fundedAt);

  if (!isFunded) {
    return {
      canRelease: false,
      reason: "Escrow is not funded. Client must lock funds on Cardano first.",
      details: {
        escrowExists: true,
        isFunded: false,
        hasSubmission: Boolean(project.submissions[0]),
        aiStatus: project.submissions[0]?.aiVerificationStatus || "PENDING",
        clientReviewStatus: project.submissions[0]?.clientReviewStatus || "PENDING",
        isDisputed: false,
        hasFreelancerAddress: Boolean(project.freelancer?.walletAddress),
        alreadyReleased: false,
      },
    };
  }

  const submission = project.submissions[0];
  if (!submission) {
    return {
      canRelease: false,
      reason: "No freelancer deliverable has been submitted for this escrow.",
      details: {
        escrowExists: true,
        isFunded: true,
        hasSubmission: false,
        aiStatus: "PENDING",
        clientReviewStatus: "PENDING",
        isDisputed: false,
        hasFreelancerAddress: Boolean(project.freelancer?.walletAddress),
        alreadyReleased: false,
      },
    };
  }

  const isDisputed =
    escrow.status === "DISPUTED" ||
    submission.clientReviewStatus === "DISPUTED";

  if (isDisputed) {
    return {
      canRelease: false,
      reason: "Cannot release: Escrow is in DISPUTED state. Requires dispute resolution.",
      details: {
        escrowExists: true,
        isFunded: true,
        hasSubmission: true,
        aiStatus: submission.aiVerificationStatus,
        clientReviewStatus: submission.clientReviewStatus,
        isDisputed: true,
        hasFreelancerAddress: Boolean(project.freelancer?.walletAddress),
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
        escrowExists: true,
        isFunded: true,
        hasSubmission: true,
        aiStatus: submission.aiVerificationStatus,
        clientReviewStatus: submission.clientReviewStatus,
        isDisputed: false,
        hasFreelancerAddress: Boolean(project.freelancer?.walletAddress),
        alreadyReleased: false,
      },
    };
  }

  const clientApproved = submission.clientReviewStatus === "APPROVED";
  if (!clientApproved) {
    return {
      canRelease: false,
      reason: `Client Satisfaction status is '${submission.clientReviewStatus}'. Client approval is required before funds can be released.`,
      details: {
        escrowExists: true,
        isFunded: true,
        hasSubmission: true,
        aiStatus: submission.aiVerificationStatus,
        clientReviewStatus: submission.clientReviewStatus,
        isDisputed: false,
        hasFreelancerAddress: Boolean(project.freelancer?.walletAddress),
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
        escrowExists: true,
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
      escrowExists: true,
      isFunded: true,
      hasSubmission: true,
      aiStatus: submission.aiVerificationStatus,
      clientReviewStatus: submission.clientReviewStatus,
      isDisputed: false,
      hasFreelancerAddress: true,
      alreadyReleased: false,
      freelancerAddress,
      amount: Number(escrow.amount),
    },
  };
}

export async function createEscrow(data: CreateEscrowInput) {
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  return prisma.escrow.create({
    data: {
      projectId: data.projectId,
      amount: parseFloat(data.amount),
      escrowAddress: data.escrowAddress,
      status: "CREATED",
    },
  });
}

export async function getEscrowByProjectId(projectId: string) {
  const escrow = await prisma.escrow.findUnique({
    where: { projectId },
    include: {
      project: {
        include: {
          client: true,
          freelancer: true,
          submissions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!escrow) {
    throw new APIError(404, "Escrow not found");
  }

  return escrow;
}

export async function updateEscrowStatus(
  projectId: string,
  status: string
) {
  return prisma.escrow.update({
    where: { projectId },
    data: {
      status: status as "CREATED" | "FUNDED" | "LOCKED" | "RELEASED" | "DISPUTED",
    },
  });
}

export async function fundEscrow(projectId: string, txHash: string) {
  return prisma.escrow.update({
    where: { projectId },
    data: {
      status: "FUNDED",
      transactionHash: txHash,
      fundedAt: new Date(),
    },
  });
}

export async function resolveDispute(
  _adminUserId: string,
  projectId: string,
  input: ResolveDisputeInput
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      escrow: true,
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project || !project.escrow) {
    throw new APIError(404, "Project or Escrow not found");
  }

  const latestSubmission = project.submissions[0];

  if (input.decision === "RELEASE_TO_FREELANCER") {
    // Override submission status to APPROVED so release transaction can proceed
    if (latestSubmission) {
      await prisma.submission.update({
        where: { id: latestSubmission.id },
        data: {
          clientReviewStatus: "APPROVED",
          clientFeedback: `[Admin Resolution] ${input.notes || "Dispute resolved in favor of freelancer."}`,
          status: "APPROVED",
        },
      });
    }

    await prisma.escrow.update({
      where: { id: project.escrow.id },
      data: { status: "LOCKED" }, // reset out of disputed so release is unlocked
    });

    return {
      message: "Dispute resolved in favor of freelancer. Release transaction is now permitted.",
      decision: input.decision,
    };
  }

  if (input.decision === "REFUND_TO_CLIENT") {
    if (latestSubmission) {
      await prisma.submission.update({
        where: { id: latestSubmission.id },
        data: {
          clientReviewStatus: "REVISION_REQUESTED",
          clientFeedback: `[Admin Resolution] Refund approved to client: ${input.notes || "Dispute resolved in favor of client."}`,
          status: "REJECTED",
        },
      });
    }

    return {
      message: "Dispute resolved in favor of client. Refund transaction is permitted.",
      decision: input.decision,
    };
  }

  throw new APIError(400, "Invalid dispute resolution decision");
}
