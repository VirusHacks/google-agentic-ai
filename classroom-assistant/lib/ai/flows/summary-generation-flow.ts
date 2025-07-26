"use server"

import { ai } from "@/lib/ai/genkit"
import { z } from "zod"

const SummarySchema = z.object({
  content: z.string(),
  wordCount: z.number(),
  keyPoints: z.array(z.string()),
  readingTime: z.number(),
})

export const summaryGenerationFlow = ai.defineFlow(
  {
    name: "summaryGenerationFlow",
    inputSchema: z.object({
      contentId: z.string(),
      summaryType: z.enum(["short", "bullets", "detailed"]),
      customLength: z.number().optional(),
      focusAreas: z.array(z.string()).optional(),
    }),
    outputSchema: SummarySchema,
  },
  async (input) => {
    try {
      // Get original content analysis
      const contentAnalysis = await getFromFirestore("content_analysis", input.contentId)

      if (!contentAnalysis) {
        throw new Error("Content analysis not found")
      }

      // For now, return a mock summary based on the content analysis
      // This can be enhanced later when the AI integration is properly configured
      let summaryContent = ""
      let keyPoints: string[] = []

      switch (input.summaryType) {
        case "short":
          summaryContent = `This content covers ${contentAnalysis.topics?.length || 0} main topics including ${contentAnalysis.topics?.slice(0, 3).join(", ") || "various concepts"}. It's designed for ${contentAnalysis.difficultyLevel || "intermediate"} level students.`
          keyPoints = contentAnalysis.topics?.slice(0, 3) || ["Key concept 1", "Key concept 2", "Key concept 3"]
          break
        case "bullets":
          summaryContent = contentAnalysis.topics?.map((topic: string) => `• ${topic}`).join("\n") || "• Main topic 1\n• Main topic 2\n• Main topic 3"
          keyPoints = contentAnalysis.topics || ["Topic 1", "Topic 2", "Topic 3"]
          break
        case "detailed":
          summaryContent = `This comprehensive educational content provides an in-depth exploration of ${contentAnalysis.topics?.length || 0} key areas. The material is structured to build understanding progressively, starting with fundamental concepts and advancing to more complex applications. Students will gain practical knowledge that can be applied in real-world scenarios.`
          keyPoints = contentAnalysis.topics || ["Fundamental concepts", "Advanced applications", "Practical knowledge"]
          break
      }

      const wordCount = summaryContent.split(/\s+/).length
      const readingTime = Math.ceil(wordCount / 200) // Average reading speed

      return {
        content: summaryContent,
        wordCount,
        keyPoints,
        readingTime,
      }
    } catch (error) {
      console.error(`❌ Summary generation failed:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Failed to generate summary: ${errorMessage}`)
    }
  },
)

// Helper function to get data from Firestore
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
