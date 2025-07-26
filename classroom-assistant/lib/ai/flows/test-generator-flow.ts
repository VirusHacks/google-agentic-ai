import { ai } from "@/lib/ai/genkit"
import {
  TestGenerationRequestSchema,
  TestGenerationResponseSchema,
  type TestGenerationRequest,
  type TestGenerationResponse,
  GeneratedQuestionSchema,
  type GeneratedQuestion,
} from "@/lib/ai/schemas/test-generator-schema"

function extractAndSanitizeTest(jsonText: string): TestGenerationResponse {
  // Remove markdown code block if present
  let text = jsonText.replace(/```json|```/g, "").trim();

  // Try to find the first JSON object
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON object found in AI output");
  const jsonString = text.slice(firstBrace, lastBrace + 1);

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error("Failed to parse AI output as JSON");
  }

  // Handle both flat and sectioned test formats
  let questions: any[] = [];
  if (Array.isArray(parsed.questions)) {
    // Flat format
    questions = parsed.questions;
  } else if (Array.isArray(parsed.sections)) {
    // Sectioned format: flatten all questions from all sections
    for (const section of parsed.sections) {
      if (Array.isArray(section.questions)) {
        for (const q of section.questions) {
          // Map sectioned question fields to expected schema
          questions.push({
            type: q.type,
            text: q.questionText || q.text || '',
            marks: q.marks,
            options: q.options,
            pairs: q.pairs,
          });
        }
      }
    }
  }

  // Defensive: fill in missing fields with defaults
  return TestGenerationResponseSchema.parse({
    title: parsed.title || parsed.testTitle || "Untitled Test",
    description: parsed.description || parsed.testDescription || "",
    questions: questions.map((q: any) => GeneratedQuestionSchema.parse(q)),
    estimatedDuration: typeof parsed.estimatedDuration === "number"
      ? parsed.estimatedDuration
      : typeof parsed.duration === "number"
        ? parsed.duration
        : typeof parsed.duration === "string"
          ? parseInt(parsed.duration) || 60
          : 60,
    totalMarks: typeof parsed.totalMarks === "number" ? parsed.totalMarks : 100,
  });
}

export const testGeneratorFlow = ai.defineFlow(
  {
    name: "testGenerator",
    inputSchema: TestGenerationRequestSchema,
    outputSchema: TestGenerationResponseSchema,
  },
  async (input: TestGenerationRequest): Promise<TestGenerationResponse> => {
    const prompt = `
You are an expert educator creating a comprehensive test for students.

CONTEXT:
- Subject: ${input.classroomSubject}
- Grade Range: ${input.gradeRange}
- Curriculum Context: ${input.curriculum || "Standard curriculum"}
- Teacher Instructions: ${input.instruction}
- Target Total Marks: ${input.totalMarks}
- Target Duration: ${input.duration} minutes

REQUIREMENTS:
1. Create a well-structured test that matches the teacher's instructions
2. Distribute marks appropriately across question types
3. Ensure questions are age-appropriate for ${input.gradeRange}
4. Cover key concepts from ${input.classroomSubject}
5. Include a mix of question types as requested

QUESTION TYPES:
- mcq: Multiple choice (provide 4 options, mark difficulty appropriately)
- fill: Fill in the blank (single word or phrase answers)
- match: Matching pairs (provide left and right items to match)
- short: Short answer (2-3 sentences)
- long: Long answer/essay (detailed explanations)

MARKING GUIDELINES:
- MCQ: 1-3 marks each
- Fill: 1-2 marks each
- Match: 1 mark per pair, usually 5-10 pairs total
- Short: 3-8 marks each
- Long: 8-20 marks each

Generate a complete test with:
1. An appropriate title
2. A brief description
3. Questions that total approximately ${input.totalMarks} marks
4. Realistic time estimation

Return the response as a valid JSON object.
`

    const result = await ai.generate({
      prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      },
    })
    console.log(result.text)
    return extractAndSanitizeTest(result.text)
  },
) 