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

export const GradingRequestSchema = z.object({
  studentAnswers: z.record(z.any()),
  correctAnswers: z.record(z.string(), z.object({
    correctAnswer: z.union([
      z.string(),
      z.array(z.string()),
      z.record(z.string(), z.string()),
    ]),
    explanation: z.string(),
    gradingCriteria: z.string().optional(),
  })),
  questions: z.array(TestQuestionSchema),
  classroomSubject: z.string(),
})

export const QuestionGradingSchema = z.object({
  score: z.number(),
  maxScore: z.number(),
  isCorrect: z.boolean(),
  feedback: z.string(),
  partialCredit: z.boolean().optional(),
})

export const GradingResponseSchema = z.object({
  totalScore: z.number(),
  maxScore: z.number(),
  questionFeedback: z.record(z.string(), QuestionGradingSchema),
  overallFeedback: z.string(),
  gradingBreakdown: z.object({
    mcqScore: z.number(),
    fillScore: z.number(),
    matchScore: z.number(),
    shortScore: z.number(),
    longScore: z.number(),
  }),
})

export type GradingRequest = z.infer<typeof GradingRequestSchema>
export type QuestionGrading = z.infer<typeof QuestionGradingSchema>
export type GradingResponse = z.infer<typeof GradingResponseSchema> 