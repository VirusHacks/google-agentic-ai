"use client"
import { useParams, useRouter } from "next/navigation"
import { Plus, FileText, Users, Clock, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFirestoreCollection } from "@/lib/hooks/use-firestore"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Test, TestSubmission } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export default function TestsPage() {
  const params = useParams()
  const router = useRouter()
  const classroomId = params.id as string

  const {
    data: tests,
    loading: testsLoading,
    error: testsError,
  } = useFirestoreCollection<Test>(`classrooms/${classroomId}/tests`, [])

  const { data: submissions } = useFirestoreCollection<TestSubmission>(`classrooms/${classroomId}/test_submissions`, [])

  const getTestStats = (testId: string) => {
    const testSubmissions = submissions.filter((s) => s.testId === testId)
    const totalSubmissions = testSubmissions.length
    const averageScore =
      totalSubmissions > 0
        ? testSubmissions.reduce((sum, s) => sum + (s.score / s.maxScore) * 100, 0) / totalSubmissions
        : 0

    return {
      totalSubmissions,
      averageScore: Math.round(averageScore),
    }
  }

  if (testsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tests</h1>
            <p className="text-muted-foreground">Create and manage tests for your classroom</p>
          </div>
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tests</h1>
          <p className="text-muted-foreground">Create and manage tests for your classroom</p>
        </div>
        <Button onClick={() => router.push(`/teacher/classroom/${classroomId}/tests/create`)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tests created yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first test to assess student understanding
            </p>
            <Button onClick={() => router.push(`/teacher/classroom/${classroomId}/tests/create`)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => {
            const stats = getTestStats(test.id)
            return (
              <Card key={test.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{test.title}</CardTitle>
                      {test.description && <CardDescription className="mt-1">{test.description}</CardDescription>}
                    </div>
                    <Badge variant={test.isActive ? "default" : "secondary"}>
                      {test.isActive ? "Active" : "Draft"}
                    </Badge>
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
                      {test.questions.length} questions
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {stats.totalSubmissions} submissions
                    </div>
                    {stats.totalSubmissions > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        {stats.averageScore}% average score
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created{" "}
                      {formatDistanceToNow(test.createdAt instanceof Date ? test.createdAt : test.createdAt.toDate())}{" "}
                      ago
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/teacher/classroom/${classroomId}/tests/${test.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/teacher/classroom/${classroomId}/tests/${test.id}/results`)}
                    >
                      Results
                    </Button>
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
