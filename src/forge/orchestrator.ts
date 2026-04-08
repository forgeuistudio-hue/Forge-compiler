import { GoogleGenAI } from "@google/genai";
import { FORGE_SYSTEM_PROMPT } from "./prompt";
import { ForgeValidator, ValidationResult } from "./validator";
import { ForgeCompiler } from "./compiler";
import { ForgeGraph } from "./types";

/**
 * Forge Orchestrator - Closed-Loop Reliability Controller
 */

export class ForgeOrchestrator {
  private ai: GoogleGenAI;
  private validator: ForgeValidator;
  private compiler: ForgeCompiler;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.validator = new ForgeValidator();
    this.compiler = new ForgeCompiler();
  }

  /**
   * Generates a React component from a natural language description, optionally with history.
   */
  public async generate(description: string, history: { role: "user" | "model", content: string }[] = []): Promise<{ graph: ForgeGraph }> {
    // Construct the initial prompt or iteration prompt
    let userPrompt = "";
    if (history.length === 0) {
      userPrompt = `User Request: "${description}"`;
    } else {
      const historyText = history.map(h => `${h.role === "user" ? "User" : "Forge"}: ${h.content}`).join("\n");
      userPrompt = `
History:
${historyText}

User Iteration: "${description}"
      `.trim();
    }

    let attempts = 0;
    const maxAttempts = 3;
    let currentErrorFeedback = "";

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Forge Attempt ${attempts}...`);

      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: currentErrorFeedback ? 
          `${userPrompt}\n\n${currentErrorFeedback}` : 
          userPrompt,
        config: {
          systemInstruction: FORGE_SYSTEM_PROMPT,
          responseMimeType: "application/json",
        }
      });

      const text = response.text?.trim() || "";
      
      // Clean up potential markdown blocks (though responseMimeType should handle it)
      const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();

      try {
        const rawGraph = JSON.parse(jsonText);
        const validation = await this.validator.validate(rawGraph);

        if (validation.valid && validation.normalized) {
          console.log("Forge Validation Success!");
          return { graph: validation.normalized };
        } else {
          console.warn("Forge Validation Failed:", validation.errors);
          currentErrorFeedback = this.constructErrorFeedback(jsonText, validation);
        }
      } catch (error) {
        console.error("Forge JSON Parse Error:", error);
        currentErrorFeedback = `
Previous Output (Invalid JSON):
${jsonText}

Error: "Invalid JSON format. Please output ONLY valid JSON that conforms to the Forge DSL v1 schema."
        `.trim();
      }
    }

    throw new Error("Forge failed to generate a valid UI after 3 attempts.");
  }

  /**
   * Constructs a surgical error feedback for the LLM.
   */
  private constructErrorFeedback(invalidJson: string, validation: ValidationResult): string {
    const errorMessages = validation.errors
      .map((err) => `- Path: ${err.path}, Message: ${err.message} (${err.code})`)
      .join("\n");

    return `
Previous Output (Invalid DSL):
${invalidJson}

The Forge Compiler returned the following validation errors. Please fix ONLY the invalid parts and ensure the output strictly follows the schema.

Validation Errors:
${errorMessages}
    `.trim();
  }
}
