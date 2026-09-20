import prisma from "../config/database.js";
import { APIError } from "../middleware/errors.js";
import type { CreateProjectInput, UpdateProjectInput } from "../validators/index.js";

export async function createProject(
  clientId: string,
  data: CreateProjectInput
) {
  let initialFreelancerId: string | null = null;
  let initialStatus: "OPEN" | "ASSIGNED" = "OPEN";

  if (data.freelancerId) {
    const freelancer = await prisma.user.findUnique({
      where: { id: data.freelancerId },
    });
    if (freelancer) {
      initialFreelancerId = freelancer.id;
      initialStatus = "ASSIGNED";
    }
  } else if (data.freelancerAddress) {
    const freelancer = await prisma.user.findUnique({
      where: { walletAddress: data.freelancerAddress },
    });
    if (freelancer) {
      initialFreelancerId = freelancer.id;
      initialStatus = "ASSIGNED";
    }
  }

  // If milestones provided, prepare milestone creation data, else create single default milestone
  const milestonesToCreate =
    data.milestones && data.milestones.length > 0
      ? data.milestones.map((m, idx) => ({
          title: m.title,
          description: m.description,
          amount: parseFloat(m.amount.toString()),
          deadline: new Date(m.deadline),
          order: m.order || idx + 1,
          status: (idx === 0 ? "IN_PROGRESS" : "PENDING") as "IN_PROGRESS" | "PENDING",
        }))
      : [
          {
            title: "Milestone 1 - Initial Delivery",
            description: data.description,
            amount: parseFloat(data.budget),
            deadline: new Date(data.deadline),
            order: 1,
            status: "IN_PROGRESS" as const,
          },
        ];

  return prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      budget: parseFloat(data.budget),
      deadline: new Date(data.deadline),
      clientId,
      freelancerId: initialFreelancerId,
      freelancerWalletAddress: data.freelancerAddress || null,
      status: initialStatus,
      escrow: {
        create: {
          amount: parseFloat(data.budget),
          status: "CREATED",
        },
      },
      milestones: {
        create: milestonesToCreate,
      },
    },
    include: {
      escrow: true,
      milestones: {
        orderBy: { order: "asc" },
      },
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
    },
  });
}

export async function getProjects(filters?: {
  status?: string;
  clientId?: string;
  freelancerId?: string;
}) {
  const where: any = {};
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.clientId) {
    where.clientId = filters.clientId;
  }
  if (filters?.freelancerId) {
    where.freelancerId = filters.freelancerId;
  }

  return prisma.project.findMany({
    where,
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
      milestones: {
        include: {
          submissions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { order: "asc" },
      },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      review: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFreelancerProjects(freelancerId: string) {
  return prisma.project.findMany({
    where: {
      OR: [
        { freelancerId },
        { status: "OPEN" },
      ],
    },
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
      milestones: {
        include: {
          submissions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { order: "asc" },
      },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      review: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function acceptProject(
  projectId: string,
  freelancerId: string,
  freelancerWalletAddress: string
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { escrow: true },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  if (project.escrow?.status === "RELEASED") {
    throw new APIError(400, "Cannot accept project: Escrow funds have already been released.");
  }

  if (project.freelancerId && project.freelancerId !== freelancerId) {
    throw new APIError(403, "You are not the assigned freelancer for this project");
  }

  if (!freelancerWalletAddress || !freelancerWalletAddress.startsWith("addr")) {
    throw new APIError(400, "Connect your freelancer Cardano wallet before accepting this project.");
  }

  return prisma.project.update({
    where: { id: projectId },
    data: {
      freelancerId,
      freelancerWalletAddress,
      status: "ASSIGNED",
    },
    include: {
      client: {
        select: { id: true, username: true, walletAddress: true },
      },
      freelancer: {
        select: { id: true, username: true, walletAddress: true },
      },
      escrow: true,
    },
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
      milestones: {
        include: {
          submissions: {
            include: {
              freelancer: {
                select: { id: true, username: true, walletAddress: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { order: "asc" },
      },
      submissions: {
        include: {
          freelancer: {
            select: { id: true, username: true, walletAddress: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
      },
      review: {
        include: {
          client: {
            select: { id: true, username: true, walletAddress: true },
          },
        },
      },
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

export async function deleteProject(id: string, clientId: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      escrow: true,
      transactions: true,
    },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  if (project.clientId !== clientId) {
    throw new APIError(403, "Not authorized to delete this project");
  }

  const isEscrowFundedOrLocked =
    Boolean(project.escrow) &&
    (project.escrow!.status !== "CREATED" ||
      Boolean(project.escrow!.transactionHash) ||
      Boolean(project.escrow!.fundedAt) ||
      (Boolean(project.escrow!.blockchainStatus) &&
        project.escrow!.blockchainStatus !== "CREATED"));

  const hasTransactions =
    Boolean(project.transactions && project.transactions.length > 0);

  if (isEscrowFundedOrLocked || hasTransactions) {
    throw new APIError(
      400,
      "Cannot delete project: Escrow has already been funded or submitted on-chain."
    );
  }

  return prisma.$transaction(async (tx) => {
    if (project.escrow) {
      await tx.escrow.deleteMany({
        where: { projectId: id },
      });
    }
    await tx.submission.deleteMany({
      where: { projectId: id },
    });
    return tx.project.delete({
      where: { id },
    });
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

