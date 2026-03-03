import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";
import { z } from "zod";
import { config } from "../config/app.config";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";

const enhanceSchema = z.object({
    title: z.string().min(1).max(200),
    projectName: z.string().optional().default(""),
    workspaceName: z.string().optional().default(""),
    existingDescription: z.string().optional().default(""),
});

const suggestSchema = z.object({
    partialTitle: z.string().min(1).max(200),
    projectName: z.string().optional().default(""),
});

const getAI = () => {
    if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === "your_gemini_api_key_here") {
        throw new Error("GEMINI_API_KEY is not configured. Add it to backend/.env");
    }
    return new GoogleGenerativeAI(config.GEMINI_API_KEY);
};

/**
 * POST /api/ai/enhance-task
 * Given a task title, generates a rich description, priority suggestion, and time estimate.
 */
export const enhanceTaskController = asyncHandler(
    async (req: Request, res: Response) => {
        const { title, projectName, workspaceName, existingDescription } =
            enhanceSchema.parse(req.body);

        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a helpful project management assistant for the "Team Sync" platform.
A team member created a task with the following details:
- Task Title: "${title}"
${projectName ? `- Project: "${projectName}"` : ""}
${workspaceName ? `- Workspace: "${workspaceName}"` : ""}
${existingDescription ? `- Existing description (enhance this): "${existingDescription}"` : ""}

Respond with a JSON object (no markdown, no code blocks, just raw JSON) with these fields:
{
  "description": "A clear, professional 2-4 sentence task description with actionable steps.",
  "suggestedPriority": "LOW" | "MEDIUM" | "HIGH",
  "estimatedHours": number (realistic estimate between 1-40),
  "checklistItems": ["up to 4 concrete subtask bullet points"]
}

Keep the description focused, practical, and professional.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        let parsed: Record<string, unknown>;
        try {
            // Strip markdown code fences if present
            const clean = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
            parsed = JSON.parse(clean);
        } catch {
            return res.status(HTTPSTATUS.OK).json({
                description: text,
                suggestedPriority: "MEDIUM",
                estimatedHours: 4,
                checklistItems: [],
            });
        }

        return res.status(HTTPSTATUS.OK).json(parsed);
    }
);

/**
 * POST /api/ai/suggest-tasks
 * Given a project description, suggests a list of tasks to create.
 */
export const suggestTasksController = asyncHandler(
    async (req: Request, res: Response) => {
        const { partialTitle, projectName } = suggestSchema.parse(req.body);

        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a project management AI for "Team Sync".
A user started typing a task title: "${partialTitle}"
${projectName ? `Project name: "${projectName}"` : ""}

Give 4 task title autocomplete suggestions that are slightly different and more specific flavors of what the user is typing.
Respond with a JSON array of strings only (no markdown, no explanations):
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        let suggestions: string[] = [];
        try {
            const clean = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
            suggestions = JSON.parse(clean);
        } catch {
            suggestions = [];
        }

        return res.status(HTTPSTATUS.OK).json({ suggestions });
    }
);
