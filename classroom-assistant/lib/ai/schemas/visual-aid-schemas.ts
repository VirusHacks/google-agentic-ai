import { z } from "zod"

export const BlackboardAnalysisInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A drawing from a blackboard, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.",
    ),
  prompt: z
    .string()
    .optional()
    .describe(
      "An optional text prompt from the user to guide the analysis, e.g., 'Label this' or 'Explain this diagram'.",
    ),
})
export type BlackboardAnalysisInput = z.infer<typeof BlackboardAnalysisInputSchema>

export const BlackboardAnalysisSchema = z.object({
  description: z.string().describe("A brief, one-sentence description of what the drawing is."),
  facts: z
    .array(z.string())
    .describe(
      "Three to five interesting and relevant facts about the subject of the drawing. These should be concise and easy for a student to understand.",
    ),
  imageUrl: z
    .string()
    .optional()
    .describe(
      "A URL for an image that is relevant to the drawing, like a real photo or a detailed diagram. Use a placeholder if no suitable image is found.",
    ),
})
export type BlackboardAnalysis = z.infer<typeof BlackboardAnalysisSchema>

export const QuizSchema = z.object({
  question: z.string().describe("A multiple-choice question based on the diagram."),
  options: z.array(z.string()).describe("A list of 3-4 possible answers."),
  answer: z.string().describe("The correct answer to the question."),
})
export type Quiz = z.infer<typeof QuizSchema>

export const FullAnalysisResponseSchema = z.object({
  analysis: BlackboardAnalysisSchema,
  quiz: QuizSchema.optional().describe("A quiz is only generated if the user specifically asks for one."),
})
export type FullAnalysisResponse = z.infer<typeof FullAnalysisResponseSchema>

export const DrawOnBlackboardInputSchema = z.object({
  prompt: z.string().describe("A text description of the image to generate."),
})
export type DrawOnBlackboardInput = z.infer<typeof DrawOnBlackboardInputSchema>

export const DrawOnBlackboardOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The generated image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.",
    ),
})
export type DrawOnBlackboardOutput = z.infer<typeof DrawOnBlackboardOutputSchema>

export const EnhanceBlackboardInputSchema = z.object({
  imageDataUri: z.string().describe("The current drawing from the blackboard, as a data URI."),
  prompt: z
    .string()
    .describe("A prompt describing how to enhance the drawing, e.g., 'Add labels' or 'Complete the formula'."),
})
export type EnhanceBlackboardInput = z.infer<typeof EnhanceBlackboardInputSchema>
