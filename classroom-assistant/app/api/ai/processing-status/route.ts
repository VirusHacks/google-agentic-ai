import { type NextRequest, NextResponse } from "next/server"
import { getProcessingStatus } from "@/lib/ai/content-processor"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get("contentId")

    if (!contentId) {
      return NextResponse.json({ error: "Missing required parameter: contentId" }, { status: 400 })
    }

    const status = await getProcessingStatus(contentId)

    return NextResponse.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Processing status API error:", error)
    return NextResponse.json({ error: "Failed to get processing status" }, { status: 500 })
  }
}
