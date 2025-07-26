import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const MCQQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
})

const ImagePairSchema = z.object({
  term: z.string(),
  imageURL: z.string(), // This will now contain a descriptive placeholder URL
})

const BlankQuestionSchema = z.object({
  sentence: z.string(),
  answer: z.string(),
})

const GameDataSchema = z.object({
  component: z.enum(["MCQGame", "ImageMatchGame", "FillInTheBlankGame"]),
  title: z.string(),
  gameProps: z.union([
    z.object({
      questions: z.array(MCQQuestionSchema),
    }),
    z.object({
      pairs: z.array(ImagePairSchema),
    }),
    z.object({
      blanks: z.array(BlankQuestionSchema),
    }),
  ]),
})

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable." },
        { status: 500 },
      )
    }

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 })
    }

    const result = await generateObject({
      model: openai("gpt-4o", { apiKey: process.env.OPENAI_API_KEY }),
      system: `You are an expert EdTech game generation assistant. Your task is to analyze educational prompts and generate appropriate educational games.

Available game components:
1. MCQGame - Multiple choice questions with 4 options each
2. ImageMatchGame - Matching terms with images. For images, generate a descriptive placeholder URL in the format "/placeholder.svg?height=150&width=150". The query should be a concise, URL-encoded description of the image content, e.g., "a_picture_of_a_cloud" or "a_diagram_of_photosynthesis".
3. FillInTheBlankGame - Fill in the blank sentences with single word answers

Rules:
- Analyze the prompt for subject, grade level, and learning objectives
- Choose the most suitable game type
- Generate 5-8 questions/pairs/blanks depending on complexity
- For ImageMatchGame, ensure the 'imageURL' uses the descriptive placeholder format.
- For FillInTheBlankGame, use "____" to represent blanks in sentences
- Make content age-appropriate and educationally sound
- Create engaging, clear questions with proper difficulty level

Return a structured game object with component type, title, and appropriate props.`,
      prompt: `Create an educational game based on this prompt: "${prompt}"

Generate appropriate content that matches the educational level and subject matter requested.`,
      schema: GameDataSchema,
    })

    return Response.json(result.object)
  } catch (error) {
    console.error("Error generating game:", error)
    return Response.json({ error: "Failed to generate game" }, { status: 500 })
  }
}
