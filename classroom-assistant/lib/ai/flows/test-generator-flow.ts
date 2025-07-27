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
  // Remove markdown/code block if present
  let text = jsonText.replace(/```json|```/g, "").trim();

  // Find the first JSON object
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

  // Accept both flat and sectioned formats, and alternate field names
  let questions: any[] = [];
  if (Array.isArray(parsed.questions)) {
    questions = parsed.questions;
  } else if (Array.isArray(parsed.sections)) {
    // Flatten all questions from all sections
    for (const section of parsed.sections) {
      if (Array.isArray(section.questions)) {
        for (const q of section.questions) {
          questions.push({
            type: q.type,
            text: q.text || q.questionText || "",
            marks: q.marks,
            options: q.options,
            pairs: q.pairs,
          });
        }
      }
    }
  } else if (Array.isArray(parsed.items)) {
    // Some LLMs might use 'items' instead of 'questions'
    questions = parsed.items;
  }

  // Defensive: filter out invalid questions
  questions = questions.filter(
    (q) => q && typeof q.type === "string" && typeof q.text === "string" && typeof q.marks === "number"
  );

  // Map to expected schema
  questions = questions.map((q) => ({
    type: q.type,
    text: q.text || q.questionText || "",
    marks: q.marks,
    options: q.options,
    pairs: q.pairs,
  }));

  // Parse duration (accept string or number)
  let estimatedDuration = 60;
  if (typeof parsed.estimatedDuration === "number") {
    estimatedDuration = parsed.estimatedDuration;
  } else if (typeof parsed.duration === "number") {
    estimatedDuration = parsed.duration;
  } else if (typeof parsed.duration === "string") {
    const match = parsed.duration.match(/\d+/);
    estimatedDuration = match ? parseInt(match[0], 10) : 60;
  }

  // Parse totalMarks
  let totalMarks = 100;
  if (typeof parsed.totalMarks === "number") {
    totalMarks = parsed.totalMarks;
  }

  return TestGenerationResponseSchema.parse({
    title: parsed.title || parsed.testTitle || "Untitled Test",
    description: parsed.description || parsed.testDescription || "",
    questions: questions.map((q: any) => GeneratedQuestionSchema.parse(q)),
    estimatedDuration,
    totalMarks,
  });
}

export const testGeneratorFlow = ai.defineFlow(
  {
    name: "testGenerator",
    inputSchema: TestGenerationRequestSchema,
    outputSchema: TestGenerationResponseSchema,
  },
  async (input: TestGenerationRequest): Promise<TestGenerationResponse> => {
    const systemPrompt = `
You are an expert educator AI. Your ONLY task is to return a valid JSON object matching this TypeScript type, and nothing else:

{
  "title": string, // The test title
  "description": string, // A brief description of the test
  "questions": Array<{
    "type": "mcq" | "fill" | "match" | "short" | "long",
    "text": string,
    "marks": number,
    "options"?: string[], // for MCQ
    "pairs"?: { left: string, right: string }[] // for match
  }>,
  "estimatedDuration": number, // in minutes
  "totalMarks": number
}

**STRICT RULES:**
- Output ONLY a single valid JSON object, with NO markdown, code blocks, or extra text.
- Do NOT use sections, do NOT use alternate field names, do NOT nest questions under sections.
- The 'questions' field MUST be a flat array of question objects, each matching the schema above.
- Use the exact field names: title, description, questions, estimatedDuration, totalMarks, type, text, marks, options, pairs.
- If a field is not applicable, omit it (do not set it to null or undefined).
- If you are unsure, return an empty array for 'questions'.

**EXAMPLE OUTPUT:**
{
  "title": "Photosynthesis Test",
  "description": "A test on photosynthesis for grade 9.",
  "questions": [
    {
      "type": "mcq",
      "text": "What is the main pigment in photosynthesis?",
      "marks": 2,
      "options": ["Chlorophyll", "Carotene", "Xanthophyll", "Anthocyanin"]
    },
    {
      "type": "short",
      "text": "Explain the process of photosynthesis.",
      "marks": 5
    }
  ],
  "estimatedDuration": 60,
  "totalMarks": 50
}
`

    const result = await ai.generate({
      prompt: systemPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      },
    })
    console.log(result.text)
    return extractAndSanitizeTest(result.text)
  },
) 