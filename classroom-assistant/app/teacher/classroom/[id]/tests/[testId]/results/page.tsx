"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Users, BarChart3, Download, Eye, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useFirestoreDocument, useFirestoreCollection } from "@/lib/hooks/use-firestore"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SubmissionViewer } from "@/components/tests/submission-viewer"
import type { Test, TestSubmission } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export default function TestResultsPage() {
  const params = useParams()
  const router = useRouter()

  const classroomId = params.id as string
  const testId = params.testId as string

  const [selectedSubmission, setSelectedSubmission] = useState<TestSubmission | null>(null)

  const {
    data: test,
    loading: testLoading,
    error: testError,
  } = useFirestoreDocument<Test>(`classrooms/${classroomId}/tests`, testId)

  const { data: submissions, loading: submissionsLoading } = useFirestoreCollection<TestSubmission>(
    `classrooms/${classroomId}/test_submissions`,
    [],
  )

  const testSubmissions = submissions.filter((s) => s.testId === testId)

  const calculateStats = () => {
    if (testSubmissions.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        completionRate: 0,
      }
    }

    const scores = testSubmissions.map((s) => (s.score / s.maxScore) * 100)
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const highestScore = Math.max(...scores)
    const lowestScore = Math.min(...scores)

    return {
      totalSubmissions: testSubmissions.length,
      averageScore: Math.round(averageScore),
      highestScore: Math.round(highestScore),
      lowestScore: Math.round(lowestScore),
      completionRate: 100, // Assuming all submissions are completed
    }
  }

  const stats = calculateStats()

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 70) return "text-blue-600"
    if (percentage >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const exportResults = () => {
    if (!test || testSubmissions.length === 0) return

    const csvContent = [
      ["Student Name", "Score", "Percentage", "Time Spent (min)", "Submitted At", "Status"].join(","),
      ...testSubmissions.map((submission) =>
        [
          submission.studentName,
          `${submission.score}/${submission.maxScore}`,
          `${Math.round((submission.score / submission.maxScore) * 100)}%`,
          Math.floor(submission.timeSpent / 60),
          submission.submittedAt instanceof Date
            ? submission.submittedAt.toLocaleDateString()
            : submission.submittedAt.toDate().toLocaleDateString(),
          submission.status,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${test.title}_results.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (testLoading || submissionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSkeleton />
      </div>
    )
  }

  if (testError || !test) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Error loading test: {testError || "Test not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (selectedSubmission) {
    return (
      <SubmissionViewer
        test={test}
        submission={selectedSubmission}
        onBack={() => setSelectedSubmission(null)}
      />
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/teacher/classroom/${classroomId}/tests`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tests
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Test Results</h1>
            <p className="text-muted-foreground">{test.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/teacher/classroom/${classroomId}/tests/${testId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Test
          </Button>
          <Button variant="outline" onClick={exportResults} disabled={testSubmissions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-3xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-sm text-muted-foreground">Total Submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(stats.averageScore)}`} />
            <div className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>{stats.averageScore}%</div>
            <p className="text-sm text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.highestScore}%</div>
            <p className="text-sm text-muted-foreground">Highest Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-red-600">{stats.lowestScore}%</div>
            <p className="text-sm text-muted-foreground">Lowest Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
          <CardDescription>Overview of student performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Class Average</span>
                <span className="text-sm text-muted-foreground">{stats.averageScore}%</span>
              </div>
              <Progress value={stats.averageScore} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Submissions</CardTitle>
          <CardDescription>Click on any submission to view details and provide manual grading</CardDescription>
        </CardHeader>
        <CardContent>
          {testSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
              <p className="text-muted-foreground">Students haven't submitted this test yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testSubmissions
                .sort((a, b) => b.score / b.maxScore - a.score / a.maxScore)
                .map((submission) => {
                  const percentage = Math.round((submission.score / submission.maxScore) * 100)
                  const timeSpent = Math.floor(submission.timeSpent / 60)

                  return (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-medium">{submission.studentName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Submitted{" "}
                              {formatDistanceToNow(
                                submission.submittedAt instanceof Date
                                  ? submission.submittedAt
                                  : submission.submittedAt.toDate(),
                              )}{" "}
                              ago
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(percentage)}`}>{percentage}%</div>
                          <div className="text-sm text-muted-foreground">
                            {submission.score}/{submission.maxScore} points
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium">{timeSpent} min</div>
                          <Badge variant={submission.status === "graded" ? "default" : "secondary"}>
                            {submission.status === "graded" ? "Graded" : "Pending"}
                          </Badge>
                        </div>

                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
