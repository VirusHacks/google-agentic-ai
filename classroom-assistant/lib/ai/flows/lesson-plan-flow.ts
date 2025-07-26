import { ai } from "@/lib/ai/genkit"
import { LessonPlanSchema, type LessonPlan } from "@/lib/ai/schemas/lesson-plan-schema"
import { z } from "zod"

// Enhanced schema to match all the data being passed from the API route
const TopicSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  duration: z.string().optional(),
  subtopics: z.array(z.string()).optional(),
})

const ScheduleSchema = z.object({
  days: z.array(z.string()).optional(),
  time: z.string().optional(),
})

const LessonPlanInputSchema = z.object({
  classroom: z.object({
    // Essential fields
    id: z.string(),
    name: z.string(),
    subject: z.string(),
    gradeRange: z.string(),
    teacherName: z.string(),

    // Optional detailed context
    description: z.string().optional(),
    schedule: ScheduleSchema.optional(),
    curriculumUrl: z.string().optional(),
    inviteCode: z.string().optional(),
    isActive: z.boolean().optional(),
    meetLink: z.string().optional(),

    // Curriculum and progress information
    topics: z.array(TopicSchema).optional(),
    objectives: z.array(z.string()).optional(),
    resources: z.array(z.string()).optional(),
    duration: z.string().optional(),
    curriculumProgress: z.number().optional(),

    // Student information
    students: z.number().optional(),
    studentCount: z.number().optional(),

    // Timetable information
    timetableUrl: z.string().optional(),
    timetableFilename: z.string().optional(),
    timetableParsed: z.any().optional(),

    // Metadata
    updatedAt: z.any().optional(),
  }),
  focus: z.string().optional(),
})

type LessonPlanInput = z.infer<typeof LessonPlanInputSchema>

const createLessonPlanPrompt = ({ classroom, focus }: LessonPlanInput): string => {
  const contextSections: string[] = []

  // Basic classroom information
  contextSections.push([
    `CLASSROOM INFORMATION:`,
    `- Name: ${classroom.name}`,
    `- Subject: ${classroom.subject}`,
    `- Grade Range: ${classroom.gradeRange}`,
    `- Teacher: ${classroom.teacherName}`
  ].join('\n'))

  // Add classroom description if available
  if (classroom.description) {
    contextSections.push(`CLASSROOM DESCRIPTION:\n${classroom.description}`)
  }

  // Add schedule information
  if (classroom.schedule) {
    let scheduleText = "CLASS SCHEDULE:\n"
    if (classroom.schedule.days && classroom.schedule.days.length > 0) {
      scheduleText += `- Days: ${classroom.schedule.days.join(", ")}\n`
    }
    if (classroom.schedule.time) {
      scheduleText += `- Time: ${classroom.schedule.time}\n`
    }
    contextSections.push(scheduleText.trim())
  }

  // Add curriculum objectives
  if (classroom.objectives && classroom.objectives.length > 0) {
    const objectivesText = `CURRICULUM OBJECTIVES:
${classroom.objectives.map((obj, i) => `${i + 1}. ${obj}`).join("\n")}`
    contextSections.push(objectivesText)
  }

  // Add curriculum topics
  if (classroom.topics && classroom.topics.length > 0) {
    let topicsText = "CURRICULUM TOPICS:\n"
    classroom.topics.forEach((topic, i) => {
      topicsText += `\n${i + 1}. ${topic.name}\n`
      if (topic.description) {
        topicsText += `   Description: ${topic.description}\n`
      }
      if (topic.duration) {
        topicsText += `   Duration: ${topic.duration}\n`
      }
      if (topic.subtopics && topic.subtopics.length > 0) {
        topicsText += `   Subtopics:\n`
        topic.subtopics.forEach((subtopic) => {
          topicsText += `   - ${subtopic}\n`
        })
      }
    })
    contextSections.push(topicsText.trim())
  }

  // Add available resources
  if (classroom.resources && classroom.resources.length > 0) {
    const resourcesText = `AVAILABLE RESOURCES:
${classroom.resources.map((resource) => `- ${resource}`).join("\n")}`
    contextSections.push(resourcesText)
  }

  // Add progress and class information
  const classInfoItems: string[] = []
  if (classroom.curriculumProgress !== undefined) {
    classInfoItems.push(`Curriculum Progress: ${classroom.curriculumProgress}% completed`)
  }
  if (classroom.studentCount !== undefined) {
    classInfoItems.push(`Class Size: ${classroom.studentCount} students`)
  }
  if (classroom.duration) {
    classInfoItems.push(`Course Duration: ${classroom.duration}`)
  }
  if (classroom.curriculumUrl) {
    classInfoItems.push(`Curriculum Document: Available for reference`)
  }
  if (classroom.timetableUrl) {
    classInfoItems.push(`Timetable: Available for scheduling reference`)
  }

  if (classInfoItems.length > 0) {
    contextSections.push(`CLASS INFORMATION:
${classInfoItems.map((item) => `- ${item}`).join("\n")}`)
  }

  // Add special focus/instructions
  if (focus) {
    contextSections.push(`SPECIAL FOCUS/INSTRUCTIONS:
${focus}`)
  }

  const fullContext = contextSections.join("\n\n")

  return `You are an expert educational consultant and lesson planning assistant specializing in ${classroom.subject} for ${classroom.gradeRange} students. Create a comprehensive, engaging lesson plan that follows educational best practices and utilizes all the provided classroom context.

${fullContext}

PLANNING REQUIREMENTS:
1. Create age-appropriate content for ${classroom.gradeRange} students studying ${classroom.subject}
2. Align with the provided curriculum objectives and topics when available
3. Build upon the current curriculum progress (${classroom.curriculumProgress || 0}% completed)
4. Include clear, measurable learning objectives that connect to curriculum goals
5. Design engaging activities that promote active learning and suit the class size
6. Provide varied assessment methods appropriate for ${classroom.subject} and grade level
7. Ensure the lesson is practical and implementable within the given schedule
8. Utilize the available resources mentioned in planning
9. Consider the classroom description and teaching context provided
10. If curriculum topics are provided, ensure alignment with specific subtopics and descriptions

LESSON STRUCTURE GUIDELINES:
- For ${classroom.subject}: Include both theoretical understanding and practical application
- Consider the ${classroom.duration || "academic year"} timeframe for appropriate pacing
- Design activities suitable for ${classroom.studentCount || "typical class size"} students
- Align with ${classroom.schedule?.days?.join(" and ") || "regular"} class schedule

RESPONSE FORMAT:
Return ONLY a valid JSON object that matches this exact structure:

{
  "title": "Clear, engaging lesson title that reflects the ${classroom.subject} content and ${classroom.gradeRange} level",
  "subject": "${classroom.subject}",
  "gradeLevel": "${classroom.gradeRange}",
  "duration": "Realistic time estimate (e.g., '45 minutes', '2 periods', '1 week')",
  "objectives": [
    "Students will be able to [specific, measurable objective aligned with curriculum]",
    "Students will understand [conceptual understanding goal from curriculum topics]",
    "Students will demonstrate [skill or application goal relevant to ${classroom.subject}]"
  ],
  "topics": [
    {
      "name": "Main topic name (aligned with curriculum topics if provided)",
      "description": "Detailed description of what will be covered, connecting to curriculum descriptions",
      "duration": "Time allocation for this topic (optional)",
      "subtopics": ["Specific subtopic 1", "Specific subtopic 2", "Specific subtopic 3"]
    }
  ],
  "activities": [
    "Detailed activity description with clear implementation instructions for ${classroom.subject}",
    "Interactive or hands-on activity that engages ${classroom.studentCount || "all"} students",
    "Group work, individual task, or collaborative learning activity suitable for ${classroom.gradeRange}"
  ],
  "assessments": [
    "Formative assessment method with specific details for ${classroom.subject}",
    "Summative assessment description and criteria aligned with objectives",
    "Alternative assessment option accommodating different learning styles"
  ],
  "resources": [
    ${
      classroom.resources && classroom.resources.length > 0
        ? classroom.resources.map((r) => `"${r} (as mentioned in classroom resources)"`).join(",\n    ") + ",\n    "
        : ""
    }"Additional required materials and supplies",
    "Recommended references and learning materials",
    "Technology needs and digital resources",
    "Supplementary learning materials for ${classroom.subject}"
  ],
  "prerequisites": [
    "Prior knowledge students should have based on ${classroom.curriculumProgress || 0}% curriculum progress",
    "Skills students need to possess for ${classroom.subject} at ${classroom.gradeRange} level",
    "Previous topics that should be covered before this lesson"
  ],
  "summary": "Comprehensive overview of the lesson, its key takeaways, how it aligns with the curriculum objectives and topics provided, and how it fits into the broader ${classroom.subject} curriculum for ${classroom.gradeRange} students"
}

IMPORTANT NOTES:
- Ensure all arrays have at least one meaningful item
- All strings should provide detailed, actionable information
- Reference specific curriculum topics and subtopics when provided
- Align with the classroom's current progress and available resources
- Make the lesson immediately implementable by ${classroom.teacherName}
- Consider the specific context of ${classroom.name} and its description`
}

// Enhanced JSON extraction with better error handling and logging
function extractAndParseJSON(text: string): any {
  console.log("Attempting to extract JSON from AI response...")

  // Remove any markdown code blocks and extra whitespace
  const cleanText = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .replace(/^\s+|\s+$/g, "")

  // Find the first complete JSON object
  const firstBrace = cleanText.indexOf("{")
  if (firstBrace === -1) {
    console.error("No opening brace found in AI response")
    throw new Error("No JSON object found in AI response")
  }

  let braceCount = 0
  const jsonStart = firstBrace
  let jsonEnd = -1

  for (let i = firstBrace; i < cleanText.length; i++) {
    if (cleanText[i] === "{") {
      braceCount++
    } else if (cleanText[i] === "}") {
      braceCount--
      if (braceCount === 0) {
        jsonEnd = i + 1
        break
      }
    }
  }

  if (jsonEnd === -1) {
    console.error("No closing brace found - incomplete JSON object")
    throw new Error("Incomplete JSON object in AI response")
  }

  const jsonString = cleanText.slice(jsonStart, jsonEnd)
  console.log("Extracted JSON string length:", jsonString.length)

  try {
    const parsed = JSON.parse(jsonString)
    console.log("Successfully parsed JSON object")
    return parsed
  } catch (parseError) {
    console.error("JSON parse error:", parseError)
    console.error("First 500 chars of attempted JSON:", jsonString.substring(0, 500))
    console.error("Last 200 chars of attempted JSON:", jsonString.slice(-200))
    throw new Error(`Invalid JSON format in AI response: ${(parseError as Error).message}`)
  }
}

export async function generateLessonPlan(input: LessonPlanInput): Promise<LessonPlan> {
  try {
    // Validate input with comprehensive schema
    const validatedInput = LessonPlanInputSchema.parse(input)

    console.log("Generating lesson plan for classroom:", {
      name: validatedInput.classroom.name,
      subject: validatedInput.classroom.subject,
      gradeRange: validatedInput.classroom.gradeRange,
      hasTopics: validatedInput.classroom.topics ? validatedInput.classroom.topics.length : 0,
      hasObjectives: validatedInput.classroom.objectives ? validatedInput.classroom.objectives.length : 0,
      curriculumProgress: validatedInput.classroom.curriculumProgress,
      focus: validatedInput.focus ? "Yes" : "No",
    })

    // Generate AI response with enhanced configuration
    const { text } = await ai.generate({
      model: "googleai/gemini-2.0-flash",
      prompt: createLessonPlanPrompt(validatedInput),
      config: {
        responseModalities: ["TEXT"],
        temperature: 0.7, // Balanced creativity and structure
        maxOutputTokens: 4096, // Increased for comprehensive responses
        topP: 0.9, // Allow for diverse vocabulary
        topK: 40, // Reasonable diversity in token selection
      },
    })

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from AI model")
    }

    console.log("AI response received:", {
      length: text.length,
      hasJson: text.includes("{") && text.includes("}"),
    })

    // Extract and parse JSON with enhanced error handling
    const parsedPlan = extractAndParseJSON(text)

    // Validate against schema with detailed error reporting
    const validatedPlan = LessonPlanSchema.parse(parsedPlan)

    console.log("Lesson plan generated successfully:", {
      title: validatedPlan.title,
      topicsCount: validatedPlan.topics.length,
      objectivesCount: validatedPlan.objectives.length,
      activitiesCount: validatedPlan.activities.length,
      assessmentsCount: validatedPlan.assessments.length,
    })

    return validatedPlan
  } catch (error: any) {
    console.error("Error in generateLessonPlan:", {
      error: error.message,
      type: error.constructor.name,
      classroom: input.classroom?.name,
    })

    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ")
      throw new Error(`Invalid lesson plan structure: ${issues}`)
    }

    // Provide more specific error messages
    if (error.message?.includes("JSON")) {
      throw new Error(`Failed to parse AI response as valid JSON: ${error.message}`)
    }

    if (error.message?.includes("timeout")) {
      throw new Error("AI generation timed out - please try again")
    }

    throw new Error(`Failed to generate lesson plan: ${error.message}`)
  }
}