"use client"

import { useState } from "react"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QuestionEditor } from "./question-editor"
import type { TestQuestion } from "@/lib/types"

interface TestBuilderProps {
  questions: TestQuestion[]
  onQuestionsChange: (questions: TestQuestion[]) => void
  aiGenerated?: boolean
}

export function TestBuilder({ questions, onQuestionsChange, aiGenerated = false }: TestBuilderProps) {
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)

  const addQuestion = (type: TestQuestion["type"]) => {
    const newQuestion: TestQuestion = {
      id: `q-${Date.now()}`,
      type,
      text: "",
      marks: type === "mcq" || type === "fill" ? 1 : type === "short" ? 5 : 10,
      required: true,
      order: questions.length,
      aiGenerated: false,
      ...(type === "mcq" && { options: ["", "", "", ""] }),
      ...(type === "match" && { pairs: [{ left: "", right: "" }] }),
    }

    onQuestionsChange([...questions, newQuestion])
    setEditingQuestion(newQuestion.id)
  }

  const updateQuestion = (questionId: string, updates: Partial<TestQuestion>) => {
    onQuestionsChange(questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)))
  }

  const deleteQuestion = (questionId: string) => {
    onQuestionsChange(questions.filter((q) => q.id !== questionId))
    if (editingQuestion === questionId) {
      setEditingQuestion(null)
    }
  }

  const moveQuestion = (questionId: string, direction: "up" | "down") => {
    const currentIndex = questions.findIndex((q) => q.id === questionId)
    const newQuestions = [...questions]
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

    if ((direction === "up" && currentIndex === 0) || (direction === "down" && currentIndex === questions.length - 1)) {
      return
    }
    // Swap questions
    ;[newQuestions[currentIndex], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[currentIndex]]

    // Update order
    newQuestions.forEach((q, index) => {
      q.order = index
    })

    onQuestionsChange(newQuestions)
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Test Questions</CardTitle>
            <CardDescription>
              Add and configure questions for your test
              {aiGenerated && (
                <Badge variant="secondary" className="ml-2">
                  AI Generated
                </Badge>
              )}
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {totalMarks} marks • {questions.length} questions
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No questions added yet. Start by adding your first question.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <span className="font-medium">Question {index + 1}</span>
                    <Badge variant="outline" className="text-xs">
                      {question.type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {question.marks} marks
                    </Badge>
                    {question.aiGenerated && (
                      <Badge variant="secondary" className="text-xs">
                        AI
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveQuestion(question.id, "up")}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveQuestion(question.id, "down")}
                      disabled={index === questions.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingQuestion(editingQuestion === question.id ? null : question.id)}
                    >
                      {editingQuestion === question.id ? "Done" : "Edit"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteQuestion(question.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {editingQuestion === question.id ? (
                  <QuestionEditor question={question} onUpdate={(updates) => updateQuestion(question.id, updates)} />
                ) : (
                  <div className="text-sm text-muted-foreground">{question.text || "No question text"}</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Add New Question:</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addQuestion("mcq")}>
              <Plus className="h-4 w-4 mr-1" />
              Multiple Choice
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion("fill")}>
              <Plus className="h-4 w-4 mr-1" />
              Fill in Blank
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion("match")}>
              <Plus className="h-4 w-4 mr-1" />
              Matching
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion("short")}>
              <Plus className="h-4 w-4 mr-1" />
              Short Answer
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion("long")}>
              <Plus className="h-4 w-4 mr-1" />
              Long Answer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
