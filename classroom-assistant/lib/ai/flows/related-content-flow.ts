"use server"

import { ai } from "@/lib/ai/genkit"
import { z } from "zod"

const RelatedContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  topic: z.string(),
  type: z.string(),
  url: z.string(),
  uploadedAt: z.date(),
  similarityScore: z.number(),
  relevanceReason: z.string(),
})

export const relatedContentFlow = ai.defineFlow(
  {
    name: "relatedContentFlow",
    inputSchema: z.object({
      contentId: z.string(),
      classroomId: z.string(),
      limit: z.number().default(5),
      minSimilarity: z.number().default(0.7),
    }),
    outputSchema: z.array(RelatedContentSchema),
  },
  async (input) => {
    try {
      // Get current content analysis
      const contentAnalysis = await getFromFirestore("content_analysis", input.contentId)

      if (!contentAnalysis || !contentAnalysis.embeddings) {
        throw new Error("Content embeddings not found")
      }

      const limit = input.limit || 5
      const minSimilarity = input.minSimilarity || 0.7

      // Find similar content using vector similarity
      const similarContent = await findSimilarContent(
        contentAnalysis.embeddings,
        input.contentId,
        limit,
        input.classroomId,
        minSimilarity,
      )

      // Enhance with relevance reasoning
      const enhancedContent = similarContent.map((content: any) => ({
        ...content,
        relevanceReason: generateRelevanceReason(contentAnalysis, content),
      }))

      console.log(`✅ Found ${enhancedContent.length} related content items`)
      return enhancedContent
    } catch (error) {
      console.error(`❌ Related content search failed:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Failed to find related content: ${errorMessage}`)
    }
  },
)

function generateRelevanceReason(sourceAnalysis: any, relatedContent: any): string {
  const commonTopics = sourceAnalysis.topics?.filter((topic: string) => relatedContent.topics?.includes(topic)) || []

  const commonConcepts =
    sourceAnalysis.keyConcepts?.filter((concept: any) =>
      relatedContent.keyConcepts?.some((rc: any) => rc.term === concept.term),
    ) || []

  if (commonTopics.length > 0) {
    return `Shares topics: ${commonTopics.slice(0, 2).join(", ")}`
  } else if (commonConcepts.length > 0) {
    return `Related concepts: ${commonConcepts
      .slice(0, 2)
      .map((c: any) => c.term)
      .join(", ")}`
  } else {
    return `Similar subject matter and difficulty level`
  }
}

// Helper functions
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

async function findSimilarContent(
  embeddings: number[], 
  contentId: string, 
  limit: number, 
  classroomId: string, 
  minSimilarity: number
): Promise<any[]> {
  // Mock implementation - replace with actual similarity search
  return Array.from({ length: Math.min(limit, 3) }, (_, index) => ({
    id: `related-${index + 1}`,
    title: `Related Content ${index + 1}`,
    description: `This is related content that provides additional context and examples.`,
    topic: `Topic ${index + 1}`,
    type: "pdf",
    url: `https://example.com/content-${index + 1}.pdf`,
    uploadedAt: new Date(),
    similarityScore: 0.8 - (index * 0.1),
    topics: [`Related Topic ${index + 1}`, `Secondary Topic ${index + 1}`],
    keyConcepts: [
      { term: `Related Concept ${index + 1}`, definition: "A related concept" },
      { term: `Secondary Concept ${index + 1}`, definition: "Another related concept" },
    ],
  }))
}
