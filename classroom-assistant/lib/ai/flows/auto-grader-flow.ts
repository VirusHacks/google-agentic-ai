import { ai } from "@/lib/ai/genkit"
import {
  GradingRequestSchema,
  GradingResponseSchema,
  type GradingRequest,
  type GradingResponse,
} from "@/lib/ai/schemas/auto-grader-schema"
import type { TestQuestion } from "@/lib/types"

export const autoGraderFlow = ai.defineFlow(
  {
    name: "autoGrader",
    inputSchema: GradingRequestSchema,
    outputSchema: GradingResponseSchema,
  },
  async (input: GradingRequest): Promise<GradingResponse> => {
    const gradingData = input.questions.map((q: TestQuestion) => {
      const studentAnswer = input.studentAnswers[q.id]
      const correctData = input.correctAnswers[q.id]

      return {
        questionId: q.id,
        type: q.type,
        marks: q.marks,
        question: q.text,
        studentAnswer: studentAnswer || "No answer provided",
        correctAnswer: correctData?.correctAnswer || "No correct answer available",
        explanation: correctData?.explanation || "",
        gradingCriteria: correctData?.gradingCriteria || "",
        options: q.options || [],
      }
    })

    const prompt = `
You are an expert AI grader evaluating student test responses.

CONTEXT:
- Subject: ${input.classroomSubject}
- Total Questions: ${input.questions.length}

GRADING DATA:
${JSON.stringify(gradingData, null, 2)}

GRADING INSTRUCTIONS:

1. OBJECTIVE QUESTIONS (MCQ, Fill, Match):
   - Award full marks for exact matches
   - No partial credit for MCQ
   - For fill-in-blanks, accept reasonable synonyms/variations
   - For matching, award marks per correct pair

2. SUBJECTIVE QUESTIONS (Short, Long):
   - Use the provided grading criteria
   - Award partial credit based on key points covered
   - Consider accuracy, completeness, and clarity
   - Provide constructive feedback

3. FEEDBACK REQUIREMENTS:
   - For correct answers: Brief positive reinforcement
   - For incorrect answers: Explain what was wrong and the correct approach
   - For partial credit: Specify what was good and what was missing

4. OVERALL ASSESSMENT:
   - Provide encouraging overall feedback
   - Highlight strengths and areas for improvement
   - Suggest study focus areas if score is low

Return a JSON object with:
- totalScore: sum of all question scores
- maxScore: sum of all possible marks
- questionFeedback: object with questionId as key, containing score, maxScore, isCorrect, feedback
- overallFeedback: comprehensive feedback paragraph
- gradingBreakdown: scores by question type
`

    const result = await ai.generate({
      prompt,
      config: {
        temperature: 0.4,
        maxOutputTokens: 3000,
      },
    })

    // Remove markdown code block if present
    let text = result.text
    if (typeof text === "string") {
      text = text.replace(/```json|```/g, "").trim()
    }

    const parsed = JSON.parse(text)
    return GradingResponseSchema.parse(parsed)
  },
) 