import { testGeneratorFlow } from "@/lib/ai/flows/test-generator-flow"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Input validation schema
const GenerateQuestionsSchema = z.object({
  classroomSubject: z.string().min(1, "Subject is required"),
  gradeRange: z.string().min(1, "Grade range is required"),
  curriculum: z.string().optional(),
  instruction: z.string().min(10, "Instruction must be at least 10 characters"),
  totalMarks: z.number().min(1).max(1000),
  duration: z.number().min(1).max(300),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedInput = GenerateQuestionsSchema.parse(body)

    console.log("Generating questions with input:", {
      subject: validatedInput.classroomSubject,
      gradeRange: validatedInput.gradeRange,
      totalMarks: validatedInput.totalMarks,
      duration: validatedInput.duration,
      instruction: validatedInput.instruction,
      curriculum: validatedInput.curriculum,
    })

    // Call the test generator flow
    const result = await testGeneratorFlow(validatedInput)
    console.log(result)
    // Validate the result has required fields
    if (!result.questions || result.questions.length === 0) {
      throw new Error("No questions were generated")
    }

    const processingTime = Date.now() - startTime
    console.log(`Question generation completed in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        processingTime,
        questionCount: result.questions.length,
        totalMarks: result.totalMarks,
      },
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error("Question generation error:", error)

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
          error: "Failed to generate questions",
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
