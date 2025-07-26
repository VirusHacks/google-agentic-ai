import { type NextRequest, NextResponse } from "next/server"
import { generatePracticeQuestions } from "@/lib/ai/content-processor"

export async function POST(request: NextRequest) {
  try {
    const { contentId, options = {} } = await request.json()

    if (!contentId) {
      return NextResponse.json({ error: "Missing required field: contentId" }, { status: 400 })
    }

    const questions = await generatePracticeQuestions(contentId, options)

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Practice questions API error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate practice questions" }, { status: 500 })
  }
}
