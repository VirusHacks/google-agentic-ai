"use server"

import { ai } from "@/lib/ai/genkit"
import type { EnhanceBlackboardInput, DrawOnBlackboardOutput } from "../schemas/visual-aid-schemas"

export async function enhanceBlackboard(input: EnhanceBlackboardInput): Promise<DrawOnBlackboardOutput> {
  const { media } = await ai.generate({
    model: "googleai/gemini-2.0-flash-preview-image-generation",
    prompt: [
      {
        text: `You are a helpful teaching assistant. Your task is to enhance the user's drawing on a blackboard based on their request. The output should be a new image that builds upon the original, in the same chalk-on-blackboard style. Here is the user's request: "${input.prompt}"`,
      },
      { media: { url: input.imageDataUri } },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  })

  if (!media.url) {
    throw new Error("Image generation failed to return a data URI.")
  }

  return { imageDataUri: media.url }
}
