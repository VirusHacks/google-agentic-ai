"use client"

import { useParams, useRouter } from "next/navigation"
import { Clock, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFirestoreCollection } from "@/lib/hooks/use-firestore"
import { useAuth } from "@/lib/auth-context"
import { where } from "firebase/firestore"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Test, TestSubmission } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export default function StudentTestsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const classroomId = params.id as string

  const {
    data: tests,
    loading: testsLoading,
    error: testsError,
  } = useFirestoreCollection<Test>(`classrooms/${classroomId}/tests`, [where("isActive", "==", true)])

  const { data: submissions } = useFirestoreCollection<TestSubmission>(
    `classrooms/${classroomId}/test_submissions`,
    user ? [where("studentId", "==", user.uid)] : [],
  )

  const getSubmissionStatus = (testId: string) => {
    const submission = submissions.find((s) => s.testId === testId)
    if (!submission) return null
    return submission
  }

  if (testsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tests</h1>
          <p className="text-muted-foreground">View and take available tests</p>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  if (testsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Error loading tests: {testsError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tests</h1>
        <p className="text-muted-foreground">View and take available tests</p>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tests available</h3>
            <p className="text-muted-foreground text-center">Your teacher hasn't created any tests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => {
            const submission = getSubmissionStatus(test.id)
            const isCompleted = submission?.status === "submitted" || submission?.status === "graded"
            const isInProgress = submission?.status === "in_progress"

            return (
              <Card key={test.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{test.title}</CardTitle>
                      {test.description && <CardDescription className="mt-1">{test.description}</CardDescription>}
                    </div>
                    {isCompleted && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    {isInProgress && (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    )}
                    {!submission && <Badge variant="outline">Available</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      {test.duration} minutes
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mr-2" />
                      {test.questions.length} questions ({test.totalPoints} points)
                    </div>

                    {submission && (
                      <div className="pt-2 border-t">
                        {submission.status === "graded" && (
                          <div className="text-sm">
                            <p className="font-medium">
                              Score: {submission.score}/{submission.maxScore} (
                              {Math.round((submission.score / submission.maxScore) * 100)}%)
                            </p>
                            <p className="text-muted-foreground">
                              Submitted{" "}
                              {formatDistanceToNow(
                                submission.submittedAt instanceof Date
                                  ? submission.submittedAt
                                  : submission.submittedAt.toDate(),
                              )}{" "}
                              ago
                            </p>
                          </div>
                        )}
                        {submission.status === "submitted" && (
                          <div className="text-sm">
                            <p className="font-medium text-blue-600">Awaiting grading</p>
                            <p className="text-muted-foreground">
                              Submitted{" "}
                              {formatDistanceToNow(
                                submission.submittedAt instanceof Date
                                  ? submission.submittedAt
                                  : submission.submittedAt.toDate(),
                              )}{" "}
                              ago
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    {!submission && (
                      <Button
                        className="w-full"
                        onClick={() => router.push(`/student/classroom/${classroomId}/tests/${test.id}`)}
                      >
                        Start Test
                      </Button>
                    )}
                    {isInProgress && (
                      <Button
                        className="w-full"
                        onClick={() => router.push(`/student/classroom/${classroomId}/tests/${test.id}`)}
                      >
                        Continue Test
                      </Button>
                    )}
                    {isCompleted && (
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => router.push(`/student/classroom/${classroomId}/tests/${test.id}/result`)}
                      >
                        View Results
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
