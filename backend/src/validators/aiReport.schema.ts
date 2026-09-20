import { z } from "zod";

export const aiRequirementItemSchema = z.object({
  requirement: z.string(),
  status: z.enum(["PASS", "FAIL"]),
  reason: z.string(),
});

export const aiReportSchema = z.object({
  status: z.enum(["PASS", "NEEDS_REVISION", "FAIL"]),
  score: z.number().min(0).max(100),
  summary: z.string(),
  requirements: z.array(aiRequirementItemSchema).default([]),
  missingRequirements: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  
  // Backward compatibility fields
  projectSummary: z.string().optional(),
  qualityScore: z.number().optional(),
  completionPercentage: z.number().optional(),
  riskLevel: z.string().optional(),
  fraudIndicators: z.array(z.string()).default([]),
});

export type AIRequirementItem = z.infer<typeof aiRequirementItemSchema>;
export type AIReportType = z.infer<typeof aiReportSchema>;
