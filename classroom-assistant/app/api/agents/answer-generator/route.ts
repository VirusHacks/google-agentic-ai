import { answerGeneratorFlow } from "@/lib/ai/flows/answer-generator-flow"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Input validation schema
const GenerateAnswersSchema = z.object({
  questions: z
    .array(
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
    ).min(1, "At least one question is required"),
  classroomSubject: z.string().min(1, "Subject is required"),
  gradeRange: z.string().min(1, "Grade range is required"),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedInput = GenerateAnswersSchema.parse(body)

    console.log("Generating answers for questions:", {
      questionCount: validatedInput.questions.length,
      subject: validatedInput.classroomSubject,
      gradeRange: validatedInput.gradeRange,
    })

    // Call the answer generator flow
    const result = await answerGeneratorFlow(validatedInput)

    // Validate the result
    const questionIds = validatedInput.questions.map((q) => q.id)
    const missingAnswers = questionIds.filter((id) => !result.answers[id])

    if (missingAnswers.length > 0) {
      console.warn("Missing answers for questions:", missingAnswers)
    }

    const processingTime = Date.now() - startTime
    console.log(`Answer generation completed in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        processingTime,
        questionCount: questionIds.length,
        answersGenerated: Object.keys(result.answers).length,
        missingAnswers,
      },
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error("Answer generation error:", error)

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

    // Handle AI generation errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate answers",
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
