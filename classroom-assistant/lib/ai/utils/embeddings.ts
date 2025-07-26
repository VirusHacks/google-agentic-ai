import { embed } from "@genkit-ai/googleai"
import { textEmbedding004 } from "@genkit-ai/googleai"

export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    console.log(`🔗 Generating embeddings for text (length: ${text.length})`)

    // Clean and prepare text for embedding
    const cleanText = text.replace(/\s+/g, " ").trim().substring(0, 10000) // Limit text length for embedding

    // Generate embeddings using Google's text-embedding-004 model
    const result = await embed({
      embedder: textEmbedding004,
      content: cleanText,
    })

    console.log(`✅ Embeddings generated successfully (dimension: ${result.length})`)
    return result
  } catch (error) {
    console.error("❌ Embedding generation failed:", error)
    throw new Error(`Failed to generate embeddings: ${error.message}`)
  }
}

export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Vectors must have the same length")
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]
    normA += vectorA[i] * vectorA[i]
    normB += vectorB[i] * vectorB[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (normA * normB)
}
