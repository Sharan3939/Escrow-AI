import { apiClient } from "./api";

export interface AIRequirementItem {
  requirement: string;
  status: "PASS" | "FAIL";
  reason: string;
}

export interface AIReportType {
  status?: "PASS" | "NEEDS_REVISION" | "FAIL";
  score?: number;
  summary?: string;
  requirements?: AIRequirementItem[];
  missingRequirements?: string[];
  suggestions?: string[];
  
  // Legacy / fallback fields
  projectSummary?: string;
  completionPercentage?: number;
  qualityScore?: number;
  riskLevel?: string;
  fraudIndicators?: string[];
}

export interface AnalyzeSubmissionResponse {
  success: boolean;
  data: AIReportType & { submission?: any };
  timestamp: string;
}

export const aiService = {
  analyzeSubmission: async (submissionId: string): Promise<AnalyzeSubmissionResponse> => {
    return apiClient.post<AnalyzeSubmissionResponse>("/ai/analyze", { submissionId });
  }
};
