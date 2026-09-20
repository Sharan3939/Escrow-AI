import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";
import { aiReportSchema, AIReportType } from "../validators/aiReport.schema.js";
import { APIError } from "../middleware/errors.js";

const isPlaceholderKey =
  !config.gemini.apiKey ||
  config.gemini.apiKey.includes("placeholder") ||
  config.gemini.apiKey.includes("your-") ||
  config.gemini.apiKey.includes("your_") ||
  config.gemini.apiKey.includes("PASTE_YOUR");

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (!isPlaceholderKey) {
      try {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({
          model: config.gemini.model,
          generationConfig: {
            responseMimeType: "application/json",
          },
        });
      } catch (e: any) {
        console.warn("[Gemini Service] Initialization warning:", e.message);
      }
    }
  }

  private buildPrompt(
    projectData: { title: string; description: string; requirements?: string },
    submissionData: { description: string; githubUrl?: string | null; fileUrl?: string | null; revisionCount?: number },
    milestoneData?: { title: string; description: string; amount: number | string; order?: number } | null
  ): string {
    const milestoneSection = milestoneData
      ? `
TARGET MILESTONE SPECIFICATIONS:
Milestone #${milestoneData.order || 1}: ${milestoneData.title}
Amount: ${milestoneData.amount} ADA
Milestone Requirements & Scope: ${milestoneData.description}
`
      : "";

    return `
You are an expert AI Escrow Code Reviewer and Quality Assurance Judge for a Cardano Smart Contract platform.
Your task is to analyze a Freelancer Submission against Client Requirements and determine if the milestone is satisfactory for escrow settlement.

OVERALL PROJECT SPECIFICATIONS:
Title: ${projectData.title}
Description: ${projectData.description}
Requirements / Criteria: ${projectData.requirements || projectData.description}
${milestoneSection}
FREELANCER SUBMISSION (Revision #${submissionData.revisionCount || 0}):
Description / Deliverables: ${submissionData.description}
GitHub Repository or PR URL: ${submissionData.githubUrl || "N/A"}
Live Demo / File URL: ${submissionData.fileUrl || "N/A"}

INSTRUCTIONS:
1. Compare the freelancer submission deliverables against both the overall project requirements and specific milestone requirements.
2. Calculate an overall completion and quality score from 0 to 100 for this milestone.
3. Determine verification status:
   - "PASS" (score >= 75 and all core milestone requirements met)
   - "NEEDS_REVISION" (score between 40 and 74, or minor missing requirements that can be revised)
   - "FAIL" (score < 40 or complete mismatch / fraudulent / empty submission)
4. List itemized requirement evaluations.

Respond ONLY with a valid JSON object strictly matching this schema:
{
  "status": "PASS" | "NEEDS_REVISION" | "FAIL",
  "score": 92,
  "summary": "Detailed summary of the verification finding",
  "requirements": [
    {
      "requirement": "Requirement name or description",
      "status": "PASS" | "FAIL",
      "reason": "Clear justification of whether this requirement was met"
    }
  ],
  "missingRequirements": ["List of missing or incomplete deliverables"],
  "suggestions": ["Suggestions for improvements or revision guidance"],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "completionPercentage": 95,
  "qualityScore": 92
}
`;
  }

  public async analyzeSubmission(
    projectData: any,
    submissionData: any,
    milestoneData?: any
  ): Promise<AIReportType> {
    if (isPlaceholderKey || !this.model) {
      throw new APIError(
        400,
        "GEMINI_API_KEY is not configured or is a placeholder. Please provide a valid Gemini API key in backend/.env to run live AI verification."
      );
    }

    try {
      const prompt = this.buildPrompt(projectData, submissionData, milestoneData);
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();

      let parsedJson: any;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", responseText);
        throw new APIError(500, "Invalid JSON response from AI");
      }

      // Normalization helpers
      if (!parsedJson.score && parsedJson.qualityScore) {
        parsedJson.score = parsedJson.qualityScore;
      }
      if (!parsedJson.qualityScore && parsedJson.score) {
        parsedJson.qualityScore = parsedJson.score;
      }
      if (!parsedJson.summary && parsedJson.projectSummary) {
        parsedJson.summary = parsedJson.projectSummary;
      }
      if (!parsedJson.projectSummary && parsedJson.summary) {
        parsedJson.projectSummary = parsedJson.summary;
      }
      if (!parsedJson.status) {
        const score = parsedJson.score || 0;
        parsedJson.status = score >= 75 ? "PASS" : score >= 40 ? "NEEDS_REVISION" : "FAIL";
      }

      const validatedData = aiReportSchema.parse(parsedJson);
      return validatedData;
    } catch (error: any) {
      if (error instanceof APIError) throw error;
      console.error("Gemini AI Analysis Error:", error.message || error);
      throw new APIError(500, `Gemini AI analysis error: ${error.message || "Failed to reach Gemini API"}`);
    }
  }
}

export const geminiService = new GeminiService();
