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
    console.log(response)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Agent call failed: ${response.statusText} - ${errorData.error || "Unknown error"}`)
    }

    return response.json()
  }

  static async generateTest(request: TestGenerationRequest) {
    const response = await this.callAgent("agents/test-generator", request)
    return response.data
  }

  static async generateAnswers(request: AnswerGenerationRequest) {
    const response = await this.callAgent("agents/answer-generator", request)
    return response.data
  }

  static async gradeSubmission(request: GradingRequest) {
    const response = await this.callAgent("agents/auto-grader", request)
    return response.data
  }
}
