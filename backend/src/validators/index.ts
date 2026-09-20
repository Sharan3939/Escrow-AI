import { z } from "zod";

export const CreateUserSchema = z.object({
  walletAddress: z
    .string()
    .min(10, "Invalid wallet address")
    .refine(
      (addr) =>
        addr.startsWith("addr") ||
        addr.startsWith("0x") ||
        addr.startsWith("stake"),
      { message: "Must be a valid Cardano or EVM address" }
    ),
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  role: z.enum(["CLIENT", "FREELANCER"]),
});

export const UpdateUserRoleSchema = z.object({
  role: z.enum(["CLIENT", "FREELANCER"]),
});

export const MilestoneItemSchema = z.object({
  title: z.string().min(3, "Milestone title must be at least 3 characters").max(200),
  description: z.string().min(10, "Milestone description must be at least 10 characters").max(5000),
  amount: z.union([
    z.string().regex(/^\d+\.?\d*$/, "Amount must be a valid number"),
    z.number().positive("Amount must be greater than 0").transform((val) => val.toString()),
  ]),
  deadline: z.string().refine(
    (val) => !isNaN(new Date(val).getTime()),
    { message: "Deadline must be a valid date format" }
  ).transform((val) => new Date(val).toISOString()),
  order: z.number().int().positive().optional(),
});

export const CreateProjectSchemaBase = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters").max(5000),
  budget: z.union([
    z.string().regex(/^\d+\.?\d*$/, "Budget must be a valid positive number"),
    z.number().positive("Budget must be greater than 0").transform((val) => val.toString()),
  ]),
  deadline: z.string().refine(
    (val) => !isNaN(new Date(val).getTime()),
    { message: "Deadline must be a valid date format" }
  ).transform((val) => new Date(val).toISOString()),
  freelancerId: z.string().optional(),
  freelancerAddress: z.string().optional(),
  milestones: z.array(MilestoneItemSchema).optional(),
});

export const CreateProjectSchema = CreateProjectSchemaBase.refine(
  (data) => {
    if (data.milestones && data.milestones.length > 0) {
      const budgetNum = parseFloat(data.budget);
      const totalMilestones = data.milestones.reduce(
        (sum, m) => sum + parseFloat(m.amount.toString()),
        0
      );
      return Math.abs(budgetNum - totalMilestones) < 0.0001;
    }
    return true;
  },
  {
    message: "Sum of milestone amounts must exactly equal the total project budget.",
    path: ["milestones"],
  }
);

export const UpdateProjectSchema = CreateProjectSchemaBase.partial();

export const CreateSubmissionSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  milestoneId: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  githubUrl: z.string().url().optional().or(z.literal("")),
  fileUrl: z.string().url().optional().or(z.literal("")),
});

export const CreateMilestoneSubmissionSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  githubUrl: z.string().url().optional().or(z.literal("")),
  fileUrl: z.string().url().optional().or(z.literal("")),
});

export const ReviewSubmissionSchema = z.object({
  action: z.enum(["APPROVE", "REQUEST_REVISION", "DISPUTE"]),
  feedback: z.string().max(2000).optional(),
});

export const ReviewMilestoneSchema = z.object({
  action: z.enum(["APPROVE", "REQUEST_REVISION", "DISPUTE"]),
  feedback: z.string().max(2000).optional(),
});

export const CreateFreelancerReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  comment: z.string().max(2000).optional(),
});

export const ResolveDisputeSchema = z.object({
  decision: z.enum(["RELEASE_TO_FREELANCER", "REFUND_TO_CLIENT"]),
  notes: z.string().max(2000).optional(),
});

export const CreateEscrowSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  amount: z.union([
    z.string().regex(/^\d+\.?\d*$/),
    z.number().transform((val) => val.toString()),
  ]),
  escrowAddress: z.string().optional(),
});

export const CreateTransactionSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  txHash: z.string().min(5, "Transaction hash is required"),
  type: z.enum(["DEPOSIT", "LOCK", "RELEASE", "REFUND", "PENALTY"]),
  amount: z.union([
    z.string().regex(/^\d+\.?\d*$/),
    z.number().transform((val) => val.toString()),
  ]),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
export type MilestoneItemInput = z.infer<typeof MilestoneItemSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreateSubmissionInput = z.infer<typeof CreateSubmissionSchema>;
export type CreateMilestoneSubmissionInput = z.infer<typeof CreateMilestoneSubmissionSchema>;
export type ReviewSubmissionInput = z.infer<typeof ReviewSubmissionSchema>;
export type ReviewMilestoneInput = z.infer<typeof ReviewMilestoneSchema>;
export type CreateFreelancerReviewInput = z.infer<typeof CreateFreelancerReviewSchema>;
export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>;
export type CreateEscrowInput = z.infer<typeof CreateEscrowSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
