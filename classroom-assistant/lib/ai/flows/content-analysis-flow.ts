"use server"

import { ai } from "@/lib/ai/genkit"
import { z } from "zod"

// Schema for content analysis output
const ContentAnalysisSchema = z.object({
  summary: z.object({
    short: z.string().describe("A concise 2-3 sentence summary"),
    bullets: z.string().describe("Key points in bullet format"),
    detailed: z.string().describe("Comprehensive detailed summary"),
  }),
  keyConcepts: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
      category: z.enum(["formula", "definition", "concept", "principle"]),
      importance: z.number().min(1).max(10),
    }),
  ),
  practiceQuestions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["mcq", "short_answer", "essay"]),
      question: z.string(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.union([z.string(), z.number()]),
      explanation: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      bloomsLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]),
    }),
  ),
  topics: z.array(z.string()),
  prerequisites: z.array(z.string()),
  learningObjectives: z.array(z.string()),
  estimatedReadingTime: z.number(),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]),
})

export const contentAnalysisFlow = ai.defineFlow(
  {
    name: "contentAnalysisFlow",
    inputSchema: z.object({
      contentId: z.string(),
      pdfUrl: z.string(),
      title: z.string(),
      subject: z.string(),
      gradeLevel: z.string(),
    }),
    outputSchema: ContentAnalysisSchema,
  },
  async (input) => {
    try {
      // Step 1: Extract text from PDF
      console.log(`🔍 Extracting text from PDF: ${input.title}`)
      const extractedText = await extractTextFromPDF(input.pdfUrl)

      if (!extractedText || extractedText.length < 100) {
        throw new Error("Insufficient text extracted from PDF")
      }

      // Step 2: Generate comprehensive analysis using AI
      console.log(`🧠 Analyzing content with AI...`)
      const analysisPrompt = `
You are an expert educational content analyzer. Analyze the following educational content and provide a comprehensive analysis.

CONTENT TITLE: ${input.title}
SUBJECT: ${input.subject}
GRADE LEVEL: ${input.gradeLevel}

CONTENT TEXT:
${extractedText.substring(0, 50000)} // Limit to avoid token limits

Please provide:

1. SUMMARIES:
   - Short: 2-3 sentences capturing the essence
   - Bullets: 6-8 key points in bullet format
   - Detailed: Comprehensive 3-4 paragraph summary

2. KEY CONCEPTS (8-12 concepts):
   - Extract important terms, formulas, definitions, and principles
   - Categorize each as: formula, definition, concept, or principle
   - Rate importance from 1-10
   - Provide clear, student-friendly definitions

3. PRACTICE QUESTIONS (8-10 questions):
   - Mix of MCQ, short answer, and essay questions
   - Include correct answers and detailed explanations
   - Vary difficulty levels (easy, medium, hard)
   - Align with Bloom's taxonomy levels
   - Ensure questions test understanding, not just memorization

4. METADATA:
   - Main topics covered
   - Prerequisites needed
   - Learning objectives
   - Estimated reading time (in minutes)
   - Overall difficulty level

Make everything age-appropriate for ${input.gradeLevel} students and subject-specific for ${input.subject}.
`

      // For now, return mock data since the AI integration needs proper configuration
      const mockAnalysis = {
        summary: {
          short: `This ${input.subject} content covers fundamental concepts appropriate for ${input.gradeLevel} students.`,
          bullets: `• Core concepts in ${input.subject}\n• Practical applications\n• Key learning objectives\n• Assessment strategies`,
          detailed: `This comprehensive educational content provides an in-depth exploration of ${input.subject} concepts designed specifically for ${input.gradeLevel} students. The material is structured to build understanding progressively, starting with fundamental concepts and advancing to more complex applications. Students will gain practical knowledge that can be applied in real-world scenarios.`,
        },
        keyConcepts: [
          {
            term: "Core Concept 1",
            definition: "A fundamental principle in this subject area",
            category: "concept" as const,
            importance: 8,
          },
          {
            term: "Key Principle",
            definition: "An essential rule or guideline",
            category: "principle" as const,
            importance: 9,
          },
        ],
        practiceQuestions: [
          {
            id: "q1",
            type: "mcq" as const,
            question: "What is the main concept covered in this content?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: "Option A",
            explanation: "This is the correct answer because...",
            difficulty: "easy" as const,
            bloomsLevel: "understand" as const,
          },
        ],
        topics: [`${input.subject} Fundamentals`, "Core Concepts", "Practical Applications"],
        prerequisites: ["Basic understanding of the subject"],
        learningObjectives: ["Understand key concepts", "Apply knowledge practically", "Analyze complex scenarios"],
        estimatedReadingTime: 15,
        difficultyLevel: "intermediate" as const,
      }

      // Step 3: Generate embeddings for similarity matching
      console.log(`🔗 Generating embeddings for content similarity...`)
      const embeddingText = `${input.title} ${mockAnalysis.summary.detailed} ${mockAnalysis.keyConcepts.map((c) => c.term).join(" ")}`
      const embeddings = await generateEmbeddings(embeddingText)

      // Step 4: Save analysis to Firestore
      console.log(`💾 Saving analysis to Firestore...`)
      await saveToFirestore("content_analysis", input.contentId, {
        ...mockAnalysis,
        embeddings,
        processedAt: new Date(),
        textLength: extractedText.length,
        processingVersion: "1.0",
      })

      console.log(`✅ Content analysis completed for: ${input.title}`)
      return mockAnalysis
    } catch (error) {
      console.error(`❌ Content analysis failed:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Content analysis failed: ${errorMessage}`)
    }
  },
)

// Helper functions
async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  // Mock implementation - replace with actual PDF text extraction
  return "This is extracted text from the PDF. It contains educational content that needs to be analyzed."
}

async function generateEmbeddings(text: string): Promise<number[]> {
  // Mock implementation - replace with actual embedding generation
  return Array.from({ length: 1536 }, () => Math.random())
}

async function saveToFirestore(collection: string, docId: string, data: any): Promise<void> {
  try {
    const { doc, setDoc } = await import("firebase/firestore")
    const { db } = await import("@/lib/firebase")
    
    const docRef = doc(db, collection, docId)
    await setDoc(docRef, data)
  } catch (error) {
    console.error(`Error saving to Firestore:`, error)
    throw error
  }
}
