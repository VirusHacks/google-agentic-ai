"use client"

import { useState } from "react"
import { ArrowLeft, CheckCircle, XCircle, Edit3, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { useFirestoreOperations } from "@/lib/hooks/use-firestore"
import { toast } from "sonner"
import type { Test, TestSubmission } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

interface SubmissionViewerProps {
  submission: TestSubmission
  test: Test
  onBack: () => void
}

export function SubmissionViewer({ submission, test, onBack }: SubmissionViewerProps) {
  const { updateDocument } = useFirestoreOperations()
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [editingScore, setEditingScore] = useState<number>(0)
  const [editingFeedback, setEditingFeedback] = useState<string>("")
  const [isUpdating, setIsUpdating] = useState(false)

  const submittedAt = submission.submittedAt instanceof Date ? submission.submittedAt : submission.submittedAt.toDate()
  const scorePercentage = (submission.score / submission.maxScore) * 100

  const handleEditQuestion = (questionId: string) => {
    const feedback = submission.questionFeedback?.[questionId]
    setEditingQuestion(questionId)
    setEditingScore(feedback?.score || 0)
    setEditingFeedback(feedback?.feedback || "")
  }

  const handleSaveEdit = async () => {
    if (!editingQuestion) return

    setIsUpdating(true)
    try {
      const question = test.questions.find((q) => q.id === editingQuestion)
      if (!question) return

      const updatedFeedback = {
        ...(submission.questionFeedback || {}),
        [editingQuestion]: {
          score: editingScore,
          maxScore: question.marks,
          isCorrect: editingScore === question.marks,
          feedback: editingFeedback,
        },
      }

      // Recalculate total score
      const newTotalScore = Object.values(updatedFeedback).reduce((sum, f) => sum + f.score, 0)

      await updateDocument(`classrooms/${submission.classroomId}/test_submissions`, submission.id, {
        questionFeedback: updatedFeedback,
        score: newTotalScore,
        manualGradedScore: newTotalScore,
        status: "graded",
        gradedAt: new Date(),
      })

      // Update local state
      submission.questionFeedback = updatedFeedback
      submission.score = newTotalScore
      submission.status = "graded"

      setEditingQuestion(null)
      toast.success("Question score updated successfully")
    } catch (error) {
      console.error("Error updating question score:", error)
      toast.error("Failed to update question score")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingQuestion(null)
    setEditingScore(0)
    setEditingFeedback("")
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Submissions
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{submission.studentName}'s Submission</h1>
          <p className="text-muted-foreground">{test.title}</p>
        </div>
      </div>

      {/* Score Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Score Overview</span>
            <Badge variant={scorePercentage >= 60 ? "default" : "destructive"} className="text-lg px-3 py-1">
              {submission.score}/{submission.maxScore}
            </Badge>
          </CardTitle>
          <CardDescription>Submitted {formatDistanceToNow(submittedAt, { addSuffix: true })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Score Percentage</span>
              <span className={getScoreColor(scorePercentage)}>{scorePercentage.toFixed(1)}%</span>
            </div>
            <Progress value={scorePercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold">
                {Math.floor(submission.timeSpent / 60)}m {submission.timeSpent % 60}s
              </p>
              <p className="text-sm text-muted-foreground">Time taken</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold">
                {
                  Object.keys(submission.questionFeedback || {}).filter((qId) => 
                    submission.questionFeedback?.[qId]?.isCorrect
                  ).length
                }
                /{test.questions.length}
              </p>
              <p className="text-sm text-muted-foreground">Correct answers</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Badge variant={submission.status === "graded" ? "default" : "secondary"}>
                {submission.status.replace("_", " ")}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question-by-Question Review */}
      <Card>
        <CardHeader>
          <CardTitle>Question-by-Question Review</CardTitle>
          <CardDescription>Review and manually adjust scores if needed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {test.questions
            .sort((a, b) => a.order - b.order)
            .map((question, index) => {
              const feedback = submission.questionFeedback?.[question.id]
              const studentAnswer = submission.answers[question.id]
              const isEditing = editingQuestion === question.id

              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Question {index + 1}</span>
                      <Badge variant="outline">{question.type.toUpperCase()}</Badge>
                      {feedback?.isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={question.marks}
                            value={editingScore}
                            onChange={(e) => setEditingScore(Number(e.target.value))}
                            className="w-20"
                          />
                          <span>/{question.marks}</span>
                          <Button size="sm" onClick={handleSaveEdit} disabled={isUpdating}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant={feedback?.isCorrect ? "default" : "destructive"}>
                            {feedback?.score || 0}/{question.marks}
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => handleEditQuestion(question.id)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Question:</h4>
                      <p className="text-sm">{question.text}</p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Student Answer:</h4>
                        <div className="p-2 bg-muted rounded text-sm">
                          {studentAnswer ? (
                            typeof studentAnswer === "object" ? (
                              <pre className="whitespace-pre-wrap">{JSON.stringify(studentAnswer, null, 2)}</pre>
                            ) : (
                              studentAnswer.toString()
                            )
                          ) : (
                            <span className="text-muted-foreground">No answer provided</span>
                          )}
                        </div>
                      </div>

                      {question.correctAnswer && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Correct Answer:</h4>
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                            {typeof question.correctAnswer === "object" ? (
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(question.correctAnswer, null, 2)}
                              </pre>
                            ) : (
                              question.correctAnswer.toString()
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Feedback:</h4>
                        <Textarea
                          value={editingFeedback}
                          onChange={(e) => setEditingFeedback(e.target.value)}
                          placeholder="Provide feedback for this answer..."
                          rows={3}
                        />
                      </div>
                    ) : (
                      feedback?.feedback && (
                        <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                          <h4 className="font-medium text-sm mb-1">Feedback:</h4>
                          <p className="text-sm">{feedback.feedback}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            })}
        </CardContent>
      </Card>
    </div>
  )
}
