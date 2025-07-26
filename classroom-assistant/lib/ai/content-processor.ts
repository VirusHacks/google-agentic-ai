"use server"

import { ai } from "@/lib/ai/genkit"
import { contentAnalysisFlow } from "./flows/content-analysis-flow"
import { questionAnsweringFlow } from "./flows/question-answering-flow"
import { summaryGenerationFlow } from "./flows/summary-generation-flow"
import { practiceQuestionsFlow } from "./flows/practice-questions-flow"
import { relatedContentFlow } from "./flows/related-content-flow"

// Main content processing function - called when new content is uploaded
export async function processNewContent(
  contentId: string,
  pdfUrl: string,
  title: string,
  subject: string,
  gradeLevel: string,
): Promise<any> {
  try {
    console.log(`🚀 Starting content processing for: ${title}`)

    const result = await contentAnalysisFlow({
      contentId,
      pdfUrl,
      title,
      subject,
      gradeLevel,
    })

    console.log(`✅ Content processing completed successfully`)
    return result
  } catch (error) {
    console.error(`❌ Content processing failed:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Content processing failed: ${errorMessage}`)
  }
}

// Generate summary with specific type
export async function generateSummary(contentId: string, type: "short" | "bullets" | "detailed"): Promise<string> {
  try {
    const result = await summaryGenerationFlow({
      contentId,
      summaryType: type,
    })

    return result.content
  } catch (error) {
    console.error(`❌ Summary generation failed:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to generate ${type} summary: ${errorMessage}`)
  }
}

// Generate practice questions
export async function generatePracticeQuestions(
  contentId: string,
  options: {
    questionCount?: number
    difficulty?: "easy" | "medium" | "hard" | "mixed"
    questionTypes?: Array<"mcq" | "short_answer" | "essay">
    focusTopics?: string[]
  } = {},
): Promise<any[]> {
  try {
    const result = await practiceQuestionsFlow({
      contentId,
      ...options,
    })

    return result.questions
  } catch (error) {
    console.error(`❌ Practice questions generation failed:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to generate practice questions: ${errorMessage}`)
  }
}

// Find related content
export async function findRelatedContent(contentId: string, classroomId: string, limit = 5): Promise<any[]> {
  try {
    const result = await relatedContentFlow({
      contentId,
      classroomId,
      limit,
    })

    return result
  } catch (error) {
    console.error(`❌ Related content search failed:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to find related content: ${errorMessage}`)
  }
}

// Extract key concepts
export async function extractKeyConcepts(contentId: string): Promise<any[]> {
  try {
    // Get from stored analysis
    const analysis = await getFromFirestore("content_analysis", contentId)

    if (!analysis || !analysis.keyConcepts) {
      throw new Error("Key concepts not found. Please process the content first.")
    }

    return analysis.keyConcepts
  } catch (error) {
    console.error(`❌ Key concepts extraction failed:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to extract key concepts: ${errorMessage}`)
  }
}

// Ask AI question about content
export async function askAIQuestion(
  contentId: string,
  question: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  try {
    const result = await questionAnsweringFlow({
      contentId,
      question,
      conversationHistory,
    })

    return result.answer
  } catch (error) {
    console.error(`❌ AI question answering failed:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to answer question: ${errorMessage}`)
  }
}

// Check if content is processed
export async function isContentProcessed(contentId: string): Promise<boolean> {
  try {
    const analysis = await getFromFirestore("content_analysis", contentId)
    return !!analysis
  } catch (error) {
    return false
  }
}

// Get processing status
export async function getProcessingStatus(contentId: string): Promise<{
  isProcessed: boolean
  processingProgress?: number
  error?: string
}> {
  try {
    const analysis = await getFromFirestore("content_analysis", contentId)

    if (analysis) {
      return { isProcessed: true }
    } else {
      // Check if processing is in progress
      const processingStatus = await getFromFirestore("processing_status", contentId)
      if (processingStatus) {
        return {
          isProcessed: false,
          processingProgress: processingStatus.progress,
          error: processingStatus.error,
        }
      } else {
        return { isProcessed: false }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { isProcessed: false, error: errorMessage }
  }
}

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
