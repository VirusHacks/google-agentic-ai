import { ai } from "@/lib/ai/genkit"
import {
  AnswerGenerationRequestSchema,
  AnswerGenerationResponseSchema,
  type AnswerGenerationRequest,
  type AnswerGenerationResponse,
} from "@/lib/ai/schemas/answer-generator-schema"
import type { TestQuestion } from "@/lib/types"

function extractAndSanitizeAnswers(jsonText: string, questionIds: string[]): AnswerGenerationResponse {
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

  // Defensive: ensure all question IDs are present
  const answers: Record<string, any> = {};
  for (const id of questionIds) {
    answers[id] = parsed.answers?.[id] ?? {
      correctAnswer: "",
      explanation: "No answer generated.",
      gradingCriteria: "",
    };
  }
  return AnswerGenerationResponseSchema.parse({ answers });
}

export const answerGeneratorFlow = ai.defineFlow(
  {
    name: "answerGenerator",
    inputSchema: AnswerGenerationRequestSchema,
    outputSchema: AnswerGenerationResponseSchema,
  },
  async (input: AnswerGenerationRequest): Promise<AnswerGenerationResponse> => {
    const questionIdList = input.questions.map(q => `"${q.id}"`).join(", ");
    const questionIdMap = input.questions.map(q => `    "${q.id}": { ... }`).join(",\n");
    const questionsText = input.questions
      .map((q: TestQuestion, index: number) => {
        let questionStr = `Question ${index + 1} (ID: ${q.id}, Type: ${q.type}, Marks: ${q.marks}):\n${q.text}\n`

        if (q.type === "mcq" && q.options) {
          questionStr +=
            "Options:\n" + q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n") + "\n"
        }

        if (q.type === "match" && q.pairs) {
          questionStr += "Left Column: " + q.pairs.map((p) => p.left).join(", ") + "\n"
          questionStr += "Right Column: " + q.pairs.map((p) => p.right).join(", ") + "\n"
        }

        return questionStr
      })
      .join("\n---\n")

    // Example for the AI
    const example = `{
  "answers": {
${questionIdMap}
  }
}`

    const systemPrompt = `
You are an expert educator AI. Your ONLY task is to return a valid JSON object matching this TypeScript type:

{
  "answers": {
    [questionId: string]: {
      "correctAnswer": string | string[] | Record<string, string>,
      "explanation": string,
      "gradingCriteria"?: string
    }
  }
}

- Use ONLY these question IDs: [${questionIdList}]
- Do NOT include any text, explanation, or markdown formatting before or after the JSON.
- Do NOT wrap the JSON in a code block.
- Do NOT add any commentary or extra lines.
- Only output a single valid JSON object.
- If you are unsure, return an empty object for that field.

Here is an example of the expected output:
${example}
`

    const prompt = `
${systemPrompt}

CONTEXT:
- Subject: ${input.classroomSubject}
- Grade Range: ${input.gradeRange}

QUESTIONS:
${questionsText}

INSTRUCTIONS:
For each question, provide:
1. The correct answer in the appropriate format
2. A clear explanation of why this is correct
3. Grading criteria for subjective questions

ANSWER FORMATS:
- MCQ: Single letter (A, B, C, or D)
- Fill: Exact word/phrase expected
- Match: Object with left items as keys, right items as values
- Short: Model answer (2-3 sentences)
- Long: Comprehensive model answer with key points

GRADING CRITERIA (for short/long answers):
- List the key points students should mention
- Specify partial marking scheme
- Include common mistakes to watch for

Return a JSON object where each question ID maps to:
{
  "correctAnswer": <answer in appropriate format>,
  "explanation": "<why this is correct>",
  "gradingCriteria": "<for subjective questions only>"
}
`

    const result = await ai.generate({
      prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 3000,
      },
    })

    return extractAndSanitizeAnswers(result.text, input.questions.map(q => q.id))
  },
) 