import { z } from "zod"

export const TestQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "fill", "match", "short", "long"]),
  text: z.string(),
  marks: z.number(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
  correctAnswer: z.union([
    z.string(),
    z.array(z.string()),
    z.record(z.string(), z.string()),
  ]).optional(),
  order: z.number(),
  aiGenerated: z.boolean(),
})

export const AnswerGenerationRequestSchema = z.object({
  questions: z.array(TestQuestionSchema),
  classroomSubject: z.string(),
  gradeRange: z.string(),
})

export const GeneratedAnswerSchema = z.object({
  correctAnswer: z.union([
    z.string(),
    z.array(z.string()),
    z.record(z.string(), z.string()),
  ]),
  explanation: z.string(),
  gradingCriteria: z.string().optional(),
})

export const AnswerGenerationResponseSchema = z.object({
  answers: z.record(z.string(), GeneratedAnswerSchema),
})

export type AnswerGenerationRequest = z.infer<typeof AnswerGenerationRequestSchema>
export type GeneratedAnswer = z.infer<typeof GeneratedAnswerSchema>
export type AnswerGenerationResponse = z.infer<typeof AnswerGenerationResponseSchema> 