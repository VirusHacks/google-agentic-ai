import { z } from "zod"

export const LessonPlanTopicSchema = z.object({
  name: z.string().describe("Topic name"),
  description: z.string().describe("Short description of the topic"),
  duration: z.string().optional().describe("Estimated duration for this topic"),
  subtopics: z.array(z.string()).optional().describe("List of subtopics")
})

export const LessonPlanSchema = z.object({
  title: z.string().describe("Lesson plan title"),
  subject: z.string().describe("Subject of the lesson"),
  gradeLevel: z.string().describe("Target grade or age range"),
  duration: z.string().describe("Total duration of the lesson"),
  objectives: z.array(z.string()).describe("Learning objectives for the lesson"),
  topics: z.array(LessonPlanTopicSchema).describe("Topics covered in the lesson"),
  activities: z.array(z.string()).describe("Suggested classroom activities"),
  assessments: z.array(z.string()).describe("Assessment methods or questions"),
  resources: z.array(z.string()).describe("Recommended resources or materials"),
  prerequisites: z.array(z.string()).optional().describe("Prerequisite knowledge or skills"),
  summary: z.string().describe("Summary of the lesson plan")
})

export const LessonPlanInputSchema = z.object({
  classroom: z.object({
    id: z.string(),
    name: z.string(),
    subject: z.string(),
    gradeRange: z.string(),
    teacherName: z.string(),
    schedule: z.any().optional(),
    curriculumUrl: z.string().optional(),
  }),
  focus: z.string().optional(),
})

export type LessonPlanInput = z.infer<typeof LessonPlanInputSchema>

export type LessonPlan = z.infer<typeof LessonPlanSchema> 