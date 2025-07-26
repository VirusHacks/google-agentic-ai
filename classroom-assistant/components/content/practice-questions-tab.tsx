"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, XCircle, RefreshCw, Brain, HelpCircle } from "lucide-react"

interface Question {
  id: string
  type: "mcq" | "short_answer"
  question: string
  options?: string[]
  correctAnswer: string | number
  explanation?: string
}

interface PracticeQuestionsTabProps {
  contentId: string
}

export function PracticeQuestionsTab({ contentId }: PracticeQuestionsTabProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuestions()
  }, [contentId])

  const loadQuestions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          options: {
            questionCount: 5,
            difficulty: "mixed",
            questionTypes: ["mcq", "short_answer"],
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setQuestions(data.questions)
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError("Failed to generate practice questions. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: string, answer: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleSubmitAnswer = (questionId: string) => {
    setShowResults((prev) => ({
      ...prev,
      [questionId]: true,
    }))
  }

  const isCorrect = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId)
    return question && answers[questionId] === question.correctAnswer
  }

  const regenerateQuestions = async () => {
    setQuestions([])
    setAnswers({})
    setShowResults({})
    await loadQuestions()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Practice Questions</h3>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              <Brain className="w-3 h-3 mr-1" />
              AI Generated
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={regenerateQuestions} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            New Questions
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadQuestions} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : questions.length > 0 ? (
          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={question.id} className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium text-slate-900 flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600">
                      {index + 1}
                    </span>
                    <span className="flex-1">{question.question}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {question.type === "mcq" && question.options ? (
                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = answers[question.id] === optionIndex
                        const isAnswered = showResults[question.id]
                        const isCorrectOption = optionIndex === question.correctAnswer

                        return (
                          <button
                            key={optionIndex}
                            onClick={() => !isAnswered && handleAnswerSelect(question.id, optionIndex)}
                            disabled={isAnswered}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              isAnswered
                                ? isCorrectOption
                                  ? "border-green-200 bg-green-50 text-green-800"
                                  : isSelected
                                    ? "border-red-200 bg-red-50 text-red-800"
                                    : "border-slate-200 bg-slate-50 text-slate-600"
                                : isSelected
                                  ? "border-slate-300 bg-slate-100 text-slate-900"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold">
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              <span className="flex-1">{option}</span>
                              {isAnswered && isCorrectOption && <CheckCircle className="w-4 h-4 text-green-600" />}
                              {isAnswered && isSelected && !isCorrectOption && (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          </button>
                        )
                      })}

                      {!showResults[question.id] && answers[question.id] !== undefined && (
                        <Button onClick={() => handleSubmitAnswer(question.id)} className="mt-4" size="sm">
                          Submit Answer
                        </Button>
                      )}

                      {showResults[question.id] && question.explanation && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-2">
                            <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-900 mb-1">Explanation</p>
                              <p className="text-sm text-blue-800">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={(answers[question.id] as string) || ""}
                        onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                        rows={3}
                        disabled={showResults[question.id]}
                      />

                      {!showResults[question.id] && answers[question.id] && (
                        <Button onClick={() => handleSubmitAnswer(question.id)} size="sm">
                          Submit Answer
                        </Button>
                      )}

                      {showResults[question.id] && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-green-900 mb-1">Sample Answer</p>
                              <p className="text-sm text-green-800">{question.correctAnswer}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No practice questions available</p>
          </div>
        )}
      </div>
    </div>
  )
}
