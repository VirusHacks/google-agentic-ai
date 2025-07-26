"use server"

import { ai } from "@/lib/ai/genkit"
import { z } from "zod"

const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "short_answer", "essay"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number()]),
  explanation: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  bloomsLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]),
  topic: z.string(),
  estimatedTime: z.number(),
})

const PracticeQuestionsSchema = z.object({
  questions: z.array(QuestionSchema),
  totalQuestions: z.number(),
  difficultyDistribution: z.object({
    easy: z.number(),
    medium: z.number(),
    hard: z.number(),
  }),
})

export const practiceQuestionsFlow = ai.defineFlow(
  {
    name: "practiceQuestionsFlow",
    inputSchema: z.object({
      contentId: z.string(),
      questionCount: z.number().default(10),
      difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
      questionTypes: z.array(z.enum(["mcq", "short_answer", "essay"])).default(["mcq", "short_answer"]),
      focusTopics: z.array(z.string()).optional(),
    }),
    outputSchema: PracticeQuestionsSchema,
  },
  async (input) => {
    try {
      // Get content analysis
      const contentAnalysis = await getFromFirestore("content_analysis", input.contentId)

      if (!contentAnalysis) {
        throw new Error("Content analysis not found")
      }

      const questionCount = input.questionCount || 10
      const difficulty = input.difficulty || "mixed"
      const questionTypes = input.questionTypes || ["mcq", "short_answer"]

      // For now, return mock data since the AI integration needs proper configuration
      const mockQuestions = Array.from({ length: questionCount }, (_, index) => ({
        id: `q${index + 1}`,
        type: questionTypes[index % questionTypes.length] as "mcq" | "short_answer" | "essay",
        question: `Sample question ${index + 1} about ${contentAnalysis.topics?.[0] || "the content"}`,
        options: questionTypes[index % questionTypes.length] === "mcq" ? ["Option A", "Option B", "Option C", "Option D"] : undefined,
        correctAnswer: questionTypes[index % questionTypes.length] === "mcq" ? "Option A" : "Sample answer",
        explanation: "This is the correct answer because it aligns with the key concepts covered in the content.",
        difficulty: difficulty === "mixed" ? (["easy", "medium", "hard"] as const)[index % 3] : difficulty,
        bloomsLevel: (["remember", "understand", "apply", "analyze", "evaluate", "create"] as const)[index % 6],
        topic: contentAnalysis.topics?.[index % (contentAnalysis.topics?.length || 1)] || "General Topic",
        estimatedTime: 2,
      }))

      const difficultyDistribution = {
        easy: mockQuestions.filter(q => q.difficulty === "easy").length,
        medium: mockQuestions.filter(q => q.difficulty === "medium").length,
        hard: mockQuestions.filter(q => q.difficulty === "hard").length,
      }

      const result = {
        questions: mockQuestions,
        totalQuestions: questionCount,
        difficultyDistribution,
      }

      console.log(`✅ Generated ${questionCount} practice questions`)
      return result
    } catch (error) {
      console.error(`❌ Practice questions generation failed:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Failed to generate practice questions: ${errorMessage}`)
    }
  },
)

// Helper function
async function getFromFirestore(collection: string, docId: string): Promise<any> {
  try {
    const { doc, getDoc } = await import("firebase/firestore")
    const { db } = await import("@/lib/firebase")
    
    const docRef = doc(db, collection, docId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data()
    }
    return null
  } catch (error) {
    console.error(`Error fetching from Firestore:`, error)
    return null
  }
}
