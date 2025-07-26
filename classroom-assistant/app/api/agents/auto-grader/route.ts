import { autoGraderFlow } from "@/lib/ai/flows/auto-grader-flow"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Input validation schema
const GradeSubmissionSchema = z.object({
  studentAnswers: z.record(z.any()),
  correctAnswers: z.record(
    z.object({
      correctAnswer: z.union([z.string(), z.array(z.string()), z.record(z.string())]),
      explanation: z.string(),
      gradingCriteria: z.string().optional(),
    }),
  ),
  questions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["mcq", "fill", "match", "short", "long"]),
      text: z.string(),
      marks: z.number(),
      options: z.array(z.string()).optional(),
      pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
      required: z.boolean(),
      order: z.number(),
      aiGenerated: z.boolean(),
      correctAnswer: z.string().optional(),
    }),
  ),
  classroomSubject: z.string(),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedInput = GradeSubmissionSchema.parse(body)

    console.log("Grading submission:", {
      questionCount: validatedInput.questions.length,
      subject: validatedInput.classroomSubject,
      answersProvided: Object.keys(validatedInput.studentAnswers).length,
    })

    // Call the auto grader flow
    const result = await autoGraderFlow(validatedInput)

    const processingTime = Date.now() - startTime
    console.log(`Grading completed in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        processingTime,
        questionCount: validatedInput.questions.length,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
      },
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error("Grading error:", error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: error.errors,
          metadata: { processingTime },
        },
        { status: 400 },
      )
    }

    // Handle AI grading errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to grade submission",
          message: error.message,
          metadata: { processingTime },
        },
        { status: 500 },
      )
    }

    // Handle unknown errors
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
        metadata: { processingTime },
      },
      { status: 500 },
    )
  }
}
