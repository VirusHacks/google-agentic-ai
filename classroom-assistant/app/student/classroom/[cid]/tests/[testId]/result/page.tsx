"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, Clock, FileText, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useFirestoreDocument } from "@/lib/hooks/use-firestore"
import { useAuth } from "@/lib/auth-context"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Test, TestSubmission } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { query, collection, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useEffect, useState } from "react"

export default function TestResultPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const classroomId = params.cid as string
  const testId = params.testId as string

  const [submission, setSubmission] = useState<TestSubmission | null>(null)
  const [loading, setLoading] = useState(true)

  const { data: test, loading: testLoading } = useFirestoreDocument<Test>(`classrooms/${classroomId}/tests`, testId)

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!user || !testId) return

      try {
        const q = query(
          collection(db, `classrooms/${classroomId}/test_submissions`),
          where("testId", "==", testId),
          where("studentId", "==", user.uid),
        )
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          const submissionData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as TestSubmission
          setSubmission(submissionData)
        }
      } catch (error) {
        console.error("Error fetching submission:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmission()
  }, [user, testId, classroomId])

  if (loading || testLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSkeleton />
      </div>
    )
  }

  if (!test || !submission) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Test result not found or you haven't taken this test yet.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const scorePercentage = Math.round((submission.score / submission.maxScore) * 100)
  const timeSpentMinutes = Math.floor(submission.timeSpent / 60)
  const timeSpentSeconds = submission.timeSpent % 60

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 70) return "text-blue-600"
    if (percentage >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90) return { label: "Excellent", variant: "default" as const, className: "bg-green-500" }
    if (percentage >= 70) return { label: "Good", variant: "default" as const, className: "bg-blue-500" }
    if (percentage >= 50) return { label: "Average", variant: "secondary" as const, className: "bg-yellow-500" }
    return { label: "Needs Improvement", variant: "destructive" as const }
  }

  const scoreBadge = getScoreBadge(scorePercentage)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push(`/student/classroom/${classroomId}/tests`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tests
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Test Results</h1>
          <p className="text-muted-foreground">{test.title}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Award className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(scorePercentage)}`} />
            <div className={`text-3xl font-bold ${getScoreColor(scorePercentage)}`}>{scorePercentage}%</div>
            <p className="text-sm text-muted-foreground">Final Score</p>
            <Badge {...scoreBadge} className={`mt-2 ${scoreBadge.className || ""}`}>
              {scoreBadge.label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-3xl font-bold">
              {submission.score}/{submission.maxScore}
            </div>
            <p className="text-sm text-muted-foreground">Points Earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-3xl font-bold">
              {timeSpentMinutes}:{timeSpentSeconds.toString().padStart(2, "0")}
            </div>
            <p className="text-sm text-muted-foreground">Time Spent</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">
              {Object.keys(submission.answers).length}/{test.questions.length}
            </div>
            <p className="text-sm text-muted-foreground">Questions Answered</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
          <CardDescription>Detailed breakdown of your performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {submission.score} / {submission.maxScore} points
                </span>
              </div>
              <Progress value={scorePercentage} className="h-3" />
            </div>

            {submission.autoGradedScore > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Auto-graded Questions</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{submission.autoGradedScore} points</p>
                  <p className="text-xs text-muted-foreground">
                    Multiple choice, fill-in-the-blank, and matching questions
                  </p>
                </div>

                {submission.manualGradedScore > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Manually Graded</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{submission.manualGradedScore} points</p>
                    <p className="text-xs text-muted-foreground">Short and long answer questions</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-1">Submitted</p>
              <p className="text-muted-foreground">
                {formatDistanceToNow(
                  submission.submittedAt instanceof Date ? submission.submittedAt : submission.submittedAt.toDate(),
                )}{" "}
                ago
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Status</p>
              <Badge variant={submission.status === "graded" ? "default" : "secondary"}>
                {submission.status === "graded" ? "Graded" : "Awaiting Manual Grading"}
              </Badge>
            </div>
            {submission.feedback && (
              <div className="md:col-span-2">
                <p className="font-medium mb-1">Teacher Feedback</p>
                <p className="text-muted-foreground bg-muted p-3 rounded">{submission.feedback}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {submission.status !== "graded" && (
        <Alert className="mt-6">
          <AlertDescription>
            Some questions require manual grading. Your final score may change once your teacher reviews your answers.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
