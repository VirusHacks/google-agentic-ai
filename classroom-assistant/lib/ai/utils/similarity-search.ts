import { calculateCosineSimilarity } from "./embeddings"
import { queryFirestore } from "./firestore-helpers"

export async function findSimilarContent(
  queryEmbeddings: number[],
  excludeContentId: string,
  limit = 5,
  classroomId?: string,
  minSimilarity = 0.7,
): Promise<any[]> {
  try {
    console.log(`🔍 Searching for similar content...`)

    // Build query conditions
    const conditions = [{ field: "embeddings", operator: "!=", value: null }]

    if (classroomId) {
      conditions.push({ field: "classroomId", operator: "==", value: classroomId })
    }

    // Get all content with embeddings
    const allContent = await queryFirestore("content_analysis", conditions)

    // Calculate similarities
    const similarities = allContent
      .filter((content) => content.id !== excludeContentId)
      .map((content) => {
        const similarity = calculateCosineSimilarity(queryEmbeddings, content.embeddings)
        return {
          ...content,
          similarityScore: similarity,
        }
      })
      .filter((content) => content.similarityScore >= minSimilarity)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)

    console.log(`✅ Found ${similarities.length} similar content items`)
    return similarities
  } catch (error) {
    console.error(`❌ Similarity search failed:`, error)
    throw error
  }
}
