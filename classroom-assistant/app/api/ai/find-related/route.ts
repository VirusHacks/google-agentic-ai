import { type NextRequest, NextResponse } from "next/server"
import { findRelatedContent } from "@/lib/ai/content-processor"

export async function POST(request: NextRequest) {
  try {
    const { contentId, classroomId, limit = 5 } = await request.json()

    if (!contentId || !classroomId) {
      return NextResponse.json({ error: "Missing required fields: contentId, classroomId" }, { status: 400 })
    }

    const relatedContent = await findRelatedContent(contentId, classroomId, limit)

    return NextResponse.json({
      success: true,
      relatedContent,
      count: relatedContent.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Related content API error:", error)
    return NextResponse.json({ error: error.message || "Failed to find related content" }, { status: 500 })
  }
}
