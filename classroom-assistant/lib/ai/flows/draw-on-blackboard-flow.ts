"use server"

import { ai } from "@/lib/ai/genkit"
import type { DrawOnBlackboardInput, DrawOnBlackboardOutput } from "../schemas/visual-aid-schemas"

export async function drawOnBlackboard(input: DrawOnBlackboardInput): Promise<DrawOnBlackboardOutput> {
  const { media } = await ai.generate({
    model: "googleai/gemini-2.0-flash-preview-image-generation",
    prompt: `A simple, clear, educational diagram of the following, in a chalk-on-blackboard style: ${input.prompt}`,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  })

  if (!media?.url) {
    throw new Error("Image generation failed to return a data URI.")
  }

  return { imageDataUri: media?.url || "" }
}
