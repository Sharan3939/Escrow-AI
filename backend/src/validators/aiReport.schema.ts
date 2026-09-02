import { z } from "zod";

export const aiReportSchema = z.object({
  projectSummary: z.string(),
  completionPercentage: z.number().min(0).max(100),
  qualityScore: z.number().min(0).max(100),
  riskLevel: z.string(),
  missingRequirements: z.array(z.string()),
  fraudIndicators: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type AIReportType = z.infer<typeof aiReportSchema>;
