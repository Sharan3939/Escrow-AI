import { apiClient } from "./api";

export interface AIReportType {
  projectSummary: string;
  completionPercentage: number;
  qualityScore: number;
  riskLevel: string;
  missingRequirements: string[];
  fraudIndicators: string[];
  suggestions: string[];
}

export interface AnalyzeSubmissionResponse {
  success: boolean;
  data: AIReportType;
  timestamp: string;
}

export const aiService = {
  analyzeSubmission: async (submissionId: string): Promise<AnalyzeSubmissionResponse> => {
    return apiClient.post<AnalyzeSubmissionResponse>("/ai/analyze", { submissionId });
  }
};
