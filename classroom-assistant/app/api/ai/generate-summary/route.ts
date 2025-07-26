import { type NextRequest, NextResponse } from "next/server"
import { generateSummary } from "@/lib/ai/content-processor"

export async function POST(request: NextRequest) {
  try {
    const { contentId, type } = await request.json()

    if (!contentId || !type) {
      return NextResponse.json({ error: "Missing required fields: contentId, type" }, { status: 400 })
    }

    if (!["short", "bullets", "detailed"].includes(type)) {
      return NextResponse.json({ error: "Invalid summary type. Must be: short, bullets, or detailed" }, { status: 400 })
    }

    const summary = await generateSummary(contentId, type)

    return NextResponse.json({
      success: true,
      summary,
      type,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Summary generation API error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 })
  }
}
