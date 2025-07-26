import { type NextRequest, NextResponse } from "next/server"
import { askAIQuestion } from "@/lib/ai/content-processor"

export async function POST(request: NextRequest) {
  try {
    const { contentId, question, conversationHistory } = await request.json()

    if (!contentId || !question) {
      return NextResponse.json({ error: "Missing required fields: contentId, question" }, { status: 400 })
    }

    const answer = await askAIQuestion(contentId, question, conversationHistory)

    return NextResponse.json({
      success: true,
      answer,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("AI question API error:", error)
    return NextResponse.json({ error: error.message || "Failed to process question" }, { status: 500 })
  }
}
