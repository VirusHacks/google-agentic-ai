"use client"

import type { TestQuestion } from "./types"

export interface TestGenerationRequest {
  classroomSubject: string
  gradeRange: string
  curriculum?: string
  instruction: string
  totalMarks: number
  duration: number
}

export interface AnswerGenerationRequest {
  questions: TestQuestion[]
  classroomSubject: string
  gradeRange: string
}

export interface GradingRequest {
  studentAnswers: Record<string, any>
  correctAnswers: Record<
    string,
    {
      correctAnswer: string | string[] | Record<string, string>
      explanation: string
      gradingCriteria?: string
    }
  >
  questions: TestQuestion[]
  classroomSubject: string
}

export class AgentUtils {
  private static async callAgent(endpoint: string, data: any) {
    const response = await fetch(`/api/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Agent call failed: ${response.statusText} - ${errorData.error || "Unknown error"}`)
    }

    return response.json()
  }

  static async generateTest(request: TestGenerationRequest) {
    return this.callAgent("generate-questions", request)
  }

  static async generateAnswers(request: AnswerGenerationRequest) {
    return this.callAgent("answer-generator", request)
  }

  static async gradeSubmission(request: GradingRequest) {
    return this.callAgent("auto-grader", request)
  }
}
