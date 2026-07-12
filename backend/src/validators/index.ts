import { z } from "zod";

export const CreateUserSchema = z.object({
  walletAddress: z.string().startsWith("addr1").or(z.string().startsWith("0x")),
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  role: z.enum(["CLIENT", "FREELANCER"]),
});

export const CreateProjectSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  budget: z.string().regex(/^\d+\.?\d*$/),
  deadline: z.string().datetime(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const CreateSubmissionSchema = z.object({
  projectId: z.string().cuid(),
  description: z.string().min(10).max(5000),
  githubUrl: z.string().url().optional(),
  fileUrl: z.string().url().optional(),
});

export const CreateEscrowSchema = z.object({
  projectId: z.string().cuid(),
  amount: z.string().regex(/^\d+\.?\d*$/),
  escrowAddress: z.string().optional(),
});

export const CreateTransactionSchema = z.object({
  projectId: z.string().cuid(),
  txHash: z.string().min(10),
  type: z.enum(["DEPOSIT", "LOCK", "RELEASE", "REFUND", "PENALTY"]),
  amount: z.string().regex(/^\d+\.?\d*$/),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreateSubmissionInput = z.infer<typeof CreateSubmissionSchema>;
export type CreateEscrowInput = z.infer<typeof CreateEscrowSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
