import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";
import { aiReportSchema, AIReportType } from "../validators/aiReport.schema.js";
import { APIError } from "../middleware/errors.js";

const isPlaceholderKey =
  !config.gemini.apiKey ||
  config.gemini.apiKey.includes("placeholder") ||
  config.gemini.apiKey.includes("your-");

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
    submissionData: { description: string; githubUrl?: string | null; fileUrl?: string | null }
  ): string {
    return `
      Analyze the following freelancer submission for a project.

      PROJECT DETAILS:
      Title: ${projectData.title}
      Description: ${projectData.description}
      Requirements: ${projectData.requirements || "N/A"}

      SUBMISSION DETAILS:
      Description: ${submissionData.description}
      GitHub URL: ${submissionData.githubUrl || "N/A"}
      File URL: ${submissionData.fileUrl || "N/A"}

      Please provide an AI verification report. You MUST respond with a valid JSON object matching this schema exactly:
      {
        "projectSummary": "string",
        "completionPercentage": number,
        "qualityScore": number,
        "riskLevel": "string (LOW, MEDIUM, HIGH)",
        "missingRequirements": ["string"],
        "fraudIndicators": ["string"],
        "suggestions": ["string"]
      }
    `;
  }

  public async analyzeSubmission(
    projectData: any,
    submissionData: any
  ): Promise<AIReportType> {
    if (isPlaceholderKey || !this.model) {
      throw new APIError(
        400,
        "GEMINI_API_KEY is not configured or is a placeholder. Please provide a valid Gemini API key in backend/.env to run live AI verification."
      );
    }

    try {
      const prompt = this.buildPrompt(projectData, submissionData);
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();

      let parsedJson;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", responseText);
        throw new APIError(500, "Invalid JSON response from AI");
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
