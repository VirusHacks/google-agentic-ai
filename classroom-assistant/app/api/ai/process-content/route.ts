import { type NextRequest, NextResponse } from "next/server"
import { processNewContent } from "@/lib/ai/content-processor"
import { saveToFirestore } from "@/lib/ai/utils/firestore-helpers"

export async function POST(request: NextRequest) {
  try {
    const { contentId, pdfUrl, title, subject, gradeLevel } = await request.json()

    // Validate required fields
    if (!contentId || !pdfUrl || !title) {
      return NextResponse.json({ error: "Missing required fields: contentId, pdfUrl, title" }, { status: 400 })
    }

    // Set processing status
    await saveToFirestore("processing_status", contentId, {
      status: "processing",
      progress: 0,
      startedAt: new Date(),
    })

    // Process content in background
    processNewContent(contentId, pdfUrl, title, subject || "General", gradeLevel || "General")
      .then(async (result) => {
        // Update processing status
        await saveToFirestore("processing_status", contentId, {
          status: "completed",
          progress: 100,
          completedAt: new Date(),
          result,
        })
      })
      .catch(async (error) => {
        // Update processing status with error
        await saveToFirestore("processing_status", contentId, {
          status: "failed",
          progress: 0,
          error: error.message,
          failedAt: new Date(),
        })
      })

    return NextResponse.json({
      success: true,
      message: "Content processing started",
      contentId,
    })
  } catch (error) {
    console.error("Content processing API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
