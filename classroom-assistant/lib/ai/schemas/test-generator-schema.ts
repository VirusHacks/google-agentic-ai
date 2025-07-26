import { z } from "zod"

export const GeneratedQuestionSchema = z.object({
  type: z.enum(["mcq", "fill", "match", "short", "long"]),
  text: z.string(),
  marks: z.number(),
  options: z.array(z.string()).optional(),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
})

export const TestGenerationRequestSchema = z.object({
  classroomSubject: z.string(),
  gradeRange: z.string(),
  curriculum: z.string().optional(),
  instruction: z.string(),
  totalMarks: z.number(),
  duration: z.number(),
})

export const TestGenerationResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(GeneratedQuestionSchema),
  estimatedDuration: z.number(),
  totalMarks: z.number(),
})

export type TestGenerationRequest = z.infer<typeof TestGenerationRequestSchema>
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>
export type TestGenerationResponse = z.infer<typeof TestGenerationResponseSchema> 