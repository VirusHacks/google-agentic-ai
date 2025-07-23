"use client"

export interface ParsedCurriculum {
  title: string
  subject: string
  gradeLevel: string
  duration: string
  objectives: string[]
  topics: Array<{
    name: string
    description: string
    duration?: string
    subtopics?: string[]
  }>
  assessments?: string[]
  resources?: string[]
  prerequisites?: string[]
}

export interface ParsedTimetable {
  title: string
  period: string
  schedule: Array<{
    day: string
    timeSlots: Array<{
      startTime: string
      endTime: string
      subject: string
      topic?: string
      room?: string
      teacher?: string
    }>
  }>
  breaks?: Array<{
    name: string
    startTime: string
    endTime: string
    duration: string
  }>
  notes?: string[]
}

export class PDFParserService {
  static async parsePDF(
    pdfUrl: string,
    type: "curriculum" | "timetable",
    classroomId: string,
  ): Promise<ParsedCurriculum | ParsedTimetable> {
    try {
      console.log(`🚀 Initiating PDF parsing for ${type}...`)

      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfUrl,
          type,
          classroomId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to parse PDF")
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "PDF parsing failed")
      }

      console.log(`✅ PDF parsing completed for ${type}`)
      return result.parsedData
    } catch (error: any) {
      console.error(`❌ PDF parsing error for ${type}:`, error)
      throw new Error(`Failed to parse ${type} PDF: ${error.message}`)
    }
  }

  static async parseCurriculumPDF(pdfUrl: string, classroomId: string): Promise<ParsedCurriculum> {
    return this.parsePDF(pdfUrl, "curriculum", classroomId) as Promise<ParsedCurriculum>
  }

  static async parseTimetablePDF(pdfUrl: string, classroomId: string): Promise<ParsedTimetable> {
    return this.parsePDF(pdfUrl, "timetable", classroomId) as Promise<ParsedTimetable>
  }

  static formatCurriculumForDisplay(curriculum: ParsedCurriculum): string {
    return `
📚 **${curriculum.title}**
📖 Subject: ${curriculum.subject}
🎓 Grade Level: ${curriculum.gradeLevel}
⏱️ Duration: ${curriculum.duration}

🎯 **Learning Objectives:**
${curriculum.objectives.map((obj) => `• ${obj}`).join("\n")}

📋 **Topics Covered:**
${curriculum.topics
  .map(
    (topic) => `
• **${topic.name}**
  ${topic.description}
  ${topic.duration ? `Duration: ${topic.duration}` : ""}
  ${topic.subtopics ? `Subtopics: ${topic.subtopics.join(", ")}` : ""}
`,
  )
  .join("\n")}

${
  curriculum.assessments
    ? `
📝 **Assessments:**
${curriculum.assessments.map((assessment) => `• ${assessment}`).join("\n")}
`
    : ""
}

${
  curriculum.resources
    ? `
📚 **Resources:**
${curriculum.resources.map((resource) => `• ${resource}`).join("\n")}
`
    : ""
}

${
  curriculum.prerequisites
    ? `
📋 **Prerequisites:**
${curriculum.prerequisites.map((prereq) => `• ${prereq}`).join("\n")}
`
    : ""
}
    `.trim()
  }

  static formatTimetableForDisplay(timetable: ParsedTimetable): string {
    return `
📅 **${timetable.title}**
📆 Period: ${timetable.period}

📋 **Weekly Schedule:**
${timetable.schedule
  .map(
    (day) => `
**${day.day}:**
${day.timeSlots
  .map(
    (slot) => `
  ${slot.startTime} - ${slot.endTime}: ${slot.subject}
  ${slot.topic ? `Topic: ${slot.topic}` : ""}
  ${slot.room ? `Room: ${slot.room}` : ""}
  ${slot.teacher ? `Teacher: ${slot.teacher}` : ""}
`,
  )
  .join("")}
`,
  )
  .join("\n")}

${
  timetable.breaks
    ? `
☕ **Break Times:**
${timetable.breaks.map((breakTime) => `• ${breakTime.name}: ${breakTime.startTime} - ${breakTime.endTime} (${breakTime.duration})`).join("\n")}
`
    : ""
}

${
  timetable.notes
    ? `
📝 **Notes:**
${timetable.notes.map((note) => `• ${note}`).join("\n")}
`
    : ""
}
    `.trim()
  }
}
