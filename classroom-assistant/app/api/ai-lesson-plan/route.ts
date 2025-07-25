import { type NextRequest, NextResponse } from "next/server"
import { generateLessonPlan } from "@/lib/ai/flows/lesson-plan-flow"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import type { Classroom } from "@/lib/types"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { classroomId, focus } = body

    // Validate required parameters
    if (!classroomId || typeof classroomId !== "string") {
      return NextResponse.json({ error: "Missing or invalid classroomId" }, { status: 400 })
    }

    // Validate focus parameter if provided
    if (focus && typeof focus !== "string") {
      return NextResponse.json({ error: "Focus must be a string" }, { status: 400 })
    }

    // Fetch classroom from Firestore with error handling
    let classroomDoc
    try {
      classroomDoc = await getDoc(doc(db, "classrooms", classroomId))
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError)
      return NextResponse.json({ error: "Failed to fetch classroom data" }, { status: 500 })
    }

    if (!classroomDoc.exists()) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 })
    }

    const classroom = classroomDoc.data() as Classroom

    // Validate essential classroom data
    if (!classroom.name || !classroom.subject) {
      return NextResponse.json({ error: "Incomplete classroom data - missing name or subject" }, { status: 400 })
    }

    // Prepare comprehensive input for AI with all available context
    const input = {
      classroom: {
        // Essential fields
        id: classroom.id || classroomId,
        name: classroom.name,
        subject: classroom.subject,
        gradeRange: classroom.gradeRange || "Not specified",
        teacherName: classroom.teacherName || "Teacher",

        // Optional detailed context
        description: classroom.description || undefined,
        schedule: classroom.schedule || undefined,
        curriculumUrl: classroom.curriculumUrl || undefined,
        inviteCode: classroom.inviteCode || undefined,
        isActive: classroom.isActive !== undefined ? classroom.isActive : undefined,
        meetLink: classroom.meetLink || undefined,

        // Curriculum and progress information

        curriculumProgress: classroom.curriculumProgress !== undefined ? classroom.curriculumProgress : undefined,

        // Student and class management
        students: classroom.students ? classroom.students.length : undefined,
        studentCount: classroom.students ? classroom.students.length : undefined,

        // Timetable information
        timetableUrl: classroom.timetableUrl || undefined,

        // Metadata
        updatedAt: classroom.updatedAt ? (classroom.updatedAt instanceof Date ? classroom.updatedAt : undefined) : undefined,
      },
      focus: focus?.trim() || undefined,
    }

    console.log(
      "Generating lesson plan with comprehensive input:",
      JSON.stringify(
        {
          ...input,
          classroom: {
            ...input.classroom,
            // Don't log sensitive data
            inviteCode: input.classroom.inviteCode ? "[REDACTED]" : undefined,
            meetLink: input.classroom.meetLink ? "[REDACTED]" : undefined,
          },
        },
        null,
        2,
      ),
    )

    // Generate lesson plan with timeout
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("AI generation timeout")), 45000), // Increased timeout for more complex processing
    )

    const lessonPlan = await Promise.race([generateLessonPlan(input), timeoutPromise])

    return NextResponse.json({ lessonPlan })
  } catch (error: any) {
    console.error("API route error:", error)

    // Return appropriate error messages
    if (error.message?.includes("timeout")) {
      return NextResponse.json({ error: "AI generation took too long. Please try again." }, { status: 408 })
    }

    if (error.message?.includes("parse")) {
      return NextResponse.json({ error: "Failed to generate a valid lesson plan. Please try again." }, { status: 422 })
    }

    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
