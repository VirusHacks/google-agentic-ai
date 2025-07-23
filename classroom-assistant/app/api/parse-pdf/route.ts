import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

// Schema for curriculum parsing
const curriculumSchema = z.object({
  title: z.string().describe("The title of the curriculum"),
  subject: z.string().describe("The subject area"),
  gradeLevel: z.string().describe("Target grade level or age group"),
  duration: z.string().describe("Expected duration or timeline"),
  objectives: z.array(z.string()).describe("Learning objectives and goals"),
  topics: z
    .array(
      z.object({
        name: z.string().describe("Topic name"),
        description: z.string().describe("Topic description"),
        duration: z.string().optional().describe("Time allocation for this topic"),
        subtopics: z.array(z.string()).optional().describe("Subtopics under this topic"),
      }),
    )
    .describe("Main topics covered in the curriculum"),
  assessments: z.array(z.string()).optional().describe("Assessment methods mentioned"),
  resources: z.array(z.string()).optional().describe("Required resources or materials"),
  prerequisites: z.array(z.string()).optional().describe("Prerequisites or prior knowledge needed"),
})

// Schema for timetable parsing
const timetableSchema = z.object({
  title: z.string().describe("The title of the timetable"),
  period: z.string().describe("Time period covered (e.g., weekly, monthly)"),
  schedule: z
    .array(
      z.object({
        day: z.string().describe("Day of the week"),
        timeSlots: z
          .array(
            z.object({
              startTime: z.string().describe("Start time of the slot"),
              endTime: z.string().describe("End time of the slot"),
              subject: z.string().describe("Subject or activity"),
              topic: z.string().optional().describe("Specific topic if mentioned"),
              room: z.string().optional().describe("Room or location if specified"),
              teacher: z.string().optional().describe("Teacher name if mentioned"),
            }),
          )
          .describe("Time slots for the day"),
      }),
    )
    .describe("Daily schedule breakdown"),
  breaks: z
    .array(
      z.object({
        name: z.string().describe("Break name (e.g., lunch, recess)"),
        startTime: z.string().describe("Break start time"),
        endTime: z.string().describe("Break end time"),
        duration: z.string().describe("Break duration"),
      }),
    )
    .optional()
    .describe("Break times if specified"),
  notes: z.array(z.string()).optional().describe("Additional notes or instructions"),
})

async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    // Fetch the PDF from UploadThing URL
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // For now, we'll use a simple text extraction approach
    // In production, you might want to use a more robust PDF parsing library
    // like pdf-parse or pdf2pic + OCR for image-based PDFs

    // Convert buffer to base64 for Gemini Vision API
    const base64Pdf = buffer.toString("base64")

    return base64Pdf
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    throw new Error("Failed to extract text from PDF")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pdfUrl, type, classroomId } = body

    if (!pdfUrl || !type) {
      return NextResponse.json({ error: "PDF URL and type are required" }, { status: 400 })
    }

    console.log(`🔄 Starting PDF parsing for ${type}:`, pdfUrl)

    // Extract text/content from PDF
    const base64Pdf = await extractTextFromPDF(pdfUrl)

    // Choose schema based on type
    const schema = type === "curriculum" ? curriculumSchema : timetableSchema
    const prompt =
      type === "curriculum"
        ? `Analyze this curriculum document and extract structured information about the educational content, learning objectives, topics, and assessment methods.`
        : `Analyze this timetable document and extract structured information about the schedule, time slots, subjects, and any break times.`

    console.log(`🤖 Sending to Gemini for ${type} analysis...`)

    // Use Gemini to parse and structure the content
    const result = await generateObject({
      model: google("gemini-1.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              image: `data:application/pdf;base64,${base64Pdf}`,
            },
          ],
        },
      ],
      schema,
      maxTokens: 4000,
    })

    const parsedData = result.object

    // Log the parsed data for now (as requested)
    console.log(`✅ Successfully parsed ${type} PDF:`)
    console.log(JSON.stringify(parsedData, null, 2))

    // Store in database or return for further processing
    // For now, we'll just return the parsed data
    return NextResponse.json({
      success: true,
      type,
      classroomId,
      parsedData,
      message: `${type} PDF parsed successfully`,
    })
  } catch (error: any) {
    console.error("❌ Error parsing PDF:", error)
    return NextResponse.json(
      {
        error: "Failed to parse PDF",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
