"use server"

import { ai } from "@/lib/ai/genkit"
import { z } from "zod"

const QAResponseSchema = z.object({
  answer: z.string().describe("Comprehensive answer to the question"),
  confidence: z.number().min(0).max(1).describe("Confidence level in the answer"),
  sources: z.array(z.string()).describe("Relevant sections from the content"),
  relatedConcepts: z.array(z.string()).describe("Related concepts to explore"),
  followUpQuestions: z.array(z.string()).describe("Suggested follow-up questions"),
})

export const questionAnsweringFlow = ai.defineFlow(
  {
    name: "questionAnsweringFlow",
    inputSchema: z.object({
      contentId: z.string(),
      question: z.string(),
      conversationHistory: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          }),
        )
        .optional(),
      userLevel: z.string().optional(),
    }),
    outputSchema: QAResponseSchema,
  },
  async (input) => {
    try {
      // Step 1: Get content analysis from Firestore
      console.log(`🔍 Retrieving content analysis for: ${input.contentId}`)
      const contentAnalysis = await getFromFirestore("content_analysis", input.contentId)

      if (!contentAnalysis) {
        throw new Error("Content analysis not found. Please process the content first.")
      }

      // Step 2: Find similar content for additional context
      const similarContent = await findSimilarContent(contentAnalysis.embeddings, input.contentId, 3)

      // Step 3: Build context-aware prompt
      const contextPrompt = `
You are an expert AI tutor helping students understand educational content. Answer the student's question using the provided content analysis and context.

CONTENT CONTEXT:
Title: ${contentAnalysis.title || "Educational Content"}
Subject: ${contentAnalysis.subject || "General"}
Key Concepts: ${contentAnalysis.keyConcepts?.map((c: any) => `${c.term}: ${c.definition}`).join("\n") || "None available"}
Summary: ${contentAnalysis.summary?.detailed || "No summary available"}

SIMILAR CONTENT FOR REFERENCE:
${similarContent.map((c: any) => `- ${c.title}: ${c.summary}`).join("\n")}

CONVERSATION HISTORY:
${input.conversationHistory?.map((msg) => `${msg.role}: ${msg.content}`).join("\n") || "No previous conversation"}

STUDENT QUESTION: ${input.question}

Please provide:
1. A clear, comprehensive answer appropriate for the student's level
2. Reference specific concepts from the content when relevant
3. Suggest related concepts they might want to explore
4. Provide 2-3 follow-up questions to deepen understanding
5. Rate your confidence in the answer (0-1)

Make your response engaging, educational, and encouraging. Use examples when helpful.
`

      // Step 4: Generate AI response
      console.log(`🧠 Generating AI response...`)
      
      // For now, return mock data since the AI integration needs proper configuration
      const mockResponse = {
        answer: `Based on the content analysis, here's a comprehensive answer to your question: "${input.question}". The key concepts covered include ${contentAnalysis.keyConcepts?.slice(0, 3).map((c: any) => c.term).join(", ") || "fundamental principles"}. This material is designed to help students understand complex topics through practical examples and clear explanations.`,
        confidence: 0.85,
        sources: ["Main content section", "Key concepts overview", "Practice examples"],
        relatedConcepts: contentAnalysis.keyConcepts?.slice(0, 3).map((c: any) => c.term) || ["Core Concept 1", "Key Principle", "Practical Application"],
        followUpQuestions: [
          "How does this concept apply in real-world scenarios?",
          "What are the relationships between these different concepts?",
          "How would you explain this to someone who's new to the subject?",
        ],
      }

      console.log(`✅ Question answered successfully`)
      return mockResponse
    } catch (error) {
      console.error(`❌ Question answering failed:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Failed to answer question: ${errorMessage}`)
    }
  },
)

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

async function findSimilarContent(embeddings: number[], contentId: string, limit: number): Promise<any[]> {
  // Mock implementation - replace with actual similarity search
  return [
    {
      title: "Related Content 1",
      summary: "This is related content that provides additional context.",
    },
    {
      title: "Related Content 2", 
      summary: "Another piece of related content for reference.",
    },
  ]
}
