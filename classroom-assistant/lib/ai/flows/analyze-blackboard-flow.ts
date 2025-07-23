"use server"

import { ai } from "@/lib/ai/genkit"
import {
  type BlackboardAnalysisInput,
  BlackboardAnalysisInputSchema,
  type FullAnalysisResponse,
  FullAnalysisResponseSchema,
} from "../schemas/visual-aid-schemas"

export async function analyzeBlackboard(input: BlackboardAnalysisInput): Promise<FullAnalysisResponse> {
  return analyzeBlackboardFlow(input)
}

const prompt = ai.definePrompt({
  name: "analyzeBlackboardPrompt",
  input: { schema: BlackboardAnalysisInputSchema },
  output: { schema: FullAnalysisResponseSchema },
  prompt: `You are an expert teacher's assistant. Your role is to analyze a drawing on a blackboard and provide helpful educational content based on the user's request.

You MUST address the user's prompt. For example, if the user asks for a quiz, you must provide one.

Your analysis of the drawing should include:
1. A short, clear description.
2. A list of 3-5 interesting facts.
3. A URL for a relevant visual aid. You must use "https://placehold.co/600x400.png" as the image URL.

If the user's prompt asks for a quiz, generate a multiple-choice question with 3-4 options and provide the correct answer.

User's Request: {{{prompt}}}
The Drawing:
{{media url=imageDataUri}}`,
})

const analyzeBlackboardFlow = ai.defineFlow(
  {
    name: "analyzeBlackboardFlow",
    inputSchema: BlackboardAnalysisInputSchema,
    outputSchema: FullAnalysisResponseSchema,
  },
  async (input) => {
    const effectiveInput = {
      ...input,
      prompt: input.prompt || "Provide a general analysis of this drawing.",
    }

    const { output } = await prompt(effectiveInput)
    return output!
  },
)
