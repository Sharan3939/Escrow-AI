import prisma from "../config/database.js";
import { APIError } from "../middleware/errors.js";

export async function getFreelancerProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      freelancerProfile: true,
      receivedReviews: {
        include: {
          client: {
            select: { id: true, username: true, walletAddress: true },
          },
          project: {
            select: { id: true, title: true, budget: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    throw new APIError(404, "Freelancer not found");
  }

  // Calculate real derived stats from database events
  const completedProjects = await prisma.project.count({
    where: {
      freelancerId: userId,
      status: "COMPLETED",
    },
  });

  // Released milestones aggregate
  const releasedMilestones = await prisma.milestone.findMany({
    where: {
      project: { freelancerId: userId },
      status: "RELEASED",
    },
    select: { amount: true },
  });

  // Released standalone escrows aggregate (for legacy projects without milestones)
  const releasedStandaloneEscrows = await prisma.escrow.findMany({
    where: {
      project: {
        freelancerId: userId,
        milestones: { none: {} },
      },
      status: "RELEASED",
    },
    select: { amount: true },
  });

  const totalMilestoneAda = releasedMilestones.reduce(
    (sum, m) => sum + Number(m.amount),
    0
  );
  const totalStandaloneAda = releasedStandaloneEscrows.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const totalAdaEarned = totalMilestoneAda + totalStandaloneAda;

  const disputedProjects = await prisma.project.count({
    where: {
      freelancerId: userId,
      OR: [
        { escrow: { status: "DISPUTED" } },
        { milestones: { some: { status: "DISPUTED" } } },
        { submissions: { some: { clientReviewStatus: "DISPUTED" } } },
      ],
    },
  });

  const successfulProjects = Math.max(0, completedProjects - disputedProjects);

  const reviews = user.receivedReviews || [];
  const ratingCount = reviews.length;
  const averageRating =
    ratingCount > 0
      ? Number(
          (
            reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount
          ).toFixed(2)
        )
      : 0;

  // Upsert profile
  const profile = await prisma.freelancerProfile.upsert({
    where: { userId },
    create: {
      userId,
      totalProjects: completedProjects,
      completedProjects,
      successfulProjects,
      disputedProjects,
      totalAdaEarned,
      averageRating,
      ratingCount,
    },
    update: {
      totalProjects: completedProjects,
      completedProjects,
      successfulProjects,
      disputedProjects,
      totalAdaEarned,
      averageRating,
      ratingCount,
    },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      walletAddress: user.walletAddress,
      role: user.role,
      bio: user.bio,
      profileImage: user.profileImage,
    },
    profile,
    reviews,
  };
}

export async function getFreelancerReviews(userId: string) {
  return prisma.freelancerReview.findMany({
    where: { freelancerUserId: userId },
    include: {
      client: {
        select: { id: true, username: true, walletAddress: true },
      },
      project: {
        select: { id: true, title: true, budget: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function recordProjectCompletion(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      milestones: true,
      escrow: true,
    },
  });

  if (!project || !project.freelancerId) {
    return null;
  }

  // Mark project COMPLETED
  await prisma.project.update({
    where: { id: projectId },
    data: { status: "COMPLETED" },
  });

  // Re-sync freelancer profile
  return getFreelancerProfile(project.freelancerId);
}

export async function submitProjectReview(
  clientUserId: string,
  projectId: string,
  rating: number,
  comment?: string
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      milestones: true,
      escrow: true,
      review: true,
    },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  if (project.freelancerId === clientUserId) {
    throw new APIError(400, "Freelancers cannot review themselves.");
  }

  if (project.clientId !== clientUserId) {
    throw new APIError(403, "Only the project client can submit a review.");
  }

  if (!project.freelancerId) {
    throw new APIError(400, "Cannot review a project without an assigned freelancer.");
  }

  if (project.review) {
    throw new APIError(400, "A client review has already been submitted for this project.");
  }

  // Verify project is completed
  const hasMilestones = project.milestones && project.milestones.length > 0;
  const allMilestonesReleased =
    hasMilestones &&
    project.milestones.every((m) => m.status === "RELEASED");
  const isEscrowReleased = project.escrow?.status === "RELEASED";

  const isCompleted =
    project.status === "COMPLETED" ||
    allMilestonesReleased ||
    isEscrowReleased;

  if (!isCompleted) {
    throw new APIError(
      400,
      "Cannot review freelancer before all project milestones or escrow funds are successfully released."
    );
  }

  if (rating < 1 || rating > 5) {
    throw new APIError(400, "Rating must be an integer between 1 and 5 stars.");
  }

  const review = await prisma.freelancerReview.create({
    data: {
      projectId,
      freelancerUserId: project.freelancerId,
      clientUserId,
      rating: Math.round(rating),
      comment: comment?.trim() || null,
    },
    include: {
      client: {
        select: { id: true, username: true, walletAddress: true },
      },
      freelancer: {
        select: { id: true, username: true, walletAddress: true },
      },
    },
  });

  // Refresh and update freelancer reputation stats
  await getFreelancerProfile(project.freelancerId);

  return review;
}
