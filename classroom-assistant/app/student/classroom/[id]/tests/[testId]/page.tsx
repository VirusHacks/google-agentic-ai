"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Clock, AlertTriangle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useFirestoreDocument, useFirestoreOperations } from "@/lib/hooks/use-firestore"
import { useAuth } from "@/lib/auth-context"
import { TestViewer } from "@/components/tests/test-viewer"
import { TestTimer } from "@/components/tests/test-timer"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { toast } from "sonner"
import type { Test, TestSubmission } from "@/lib/types"
import { where, query, collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function TakeTestPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { addDocument, updateDocument } = useFirestoreOperations()

  const classroomId = params.id as string
  const testId = params.testId as string

  const [hasStarted, setHasStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submission, setSubmission] = useState<TestSubmission | null>(null)

  const {
    data: test,
    loading: testLoading,
    error: testError,
  } = useFirestoreDocument<Test>(`classrooms/${classroomId}/tests`, testId)

  // Check for existing submission
  useEffect(() => {
    const checkExistingSubmission = async () => {
      if (!user || !testId) return

      try {
        const q = query(
          collection(db, `classrooms/${classroomId}/test_submissions`),
          where("testId", "==", testId),
          where("studentId", "==", user.uid),
        )
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          const existingSubmission = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as TestSubmission
          setSubmission(existingSubmission)

          if (existingSubmission.status === "in_progress") {
            setHasStarted(true)
            setAnswers(existingSubmission.answers || {})

            // Calculate remaining time
            const startTime =
              existingSubmission.startedAt instanceof Date
                ? existingSubmission.startedAt
                : existingSubmission.startedAt.toDate()
            const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
            const remaining = Math.max(0, (test?.duration || 0) * 60 - elapsed)
            setTimeLeft(remaining)
          } else {
            // Test already completed
            router.push(`/student/classroom/${classroomId}/tests/${testId}/result`)
          }
        }
      } catch (error) {
        console.error("Error checking existing submission:", error)
      }
    }

    if (test && user) {
      checkExistingSubmission()
    }
  }, [test, user, testId, classroomId, router])

  const handleStartTest = async () => {
    if (!user || !test) return

    try {
      const submissionData = {
        testId,
        classroomId,
        studentId: user.uid,
        studentName: user.displayName || user.email,
        answers: {},
        score: 0,
        maxScore: test.totalPoints,
        autoGradedScore: 0,
        manualGradedScore: 0,
        startedAt: new Date(),
        timeSpent: 0,
        status: "in_progress" as const,
      }

      const submissionId = await addDocument(`classrooms/${classroomId}/test_submissions`, submissionData)
      setSubmission({ id: submissionId, ...submissionData })
      setHasStarted(true)
      setTimeLeft(test.duration * 60)

      toast.success("Test started! Good luck!")
    } catch (error) {
      console.error("Error starting test:", error)
      toast.error("Failed to start test. Please try again.")
    }
  }

  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }, [])

  const handleTimeUp = useCallback(() => {
    toast.warning("Time's up! Submitting your test automatically.")
    handleSubmitTest(true)
  }, [])

  const calculateScore = (test: Test, answers: Record<string, any>) => {
    let autoScore = 0
    let totalAutoGradable = 0

    test.questions.forEach((question) => {
      const answer = answers[question.id]
      if (!answer) return

      let isCorrect = false

      switch (question.type) {
        case "mcq":
          isCorrect = answer === question.correctAnswer
          totalAutoGradable += question.points
          break
        case "fill":
          if (question.correctAnswer) {
            isCorrect = answer.toLowerCase().trim() === (question.correctAnswer as string).toLowerCase().trim()
            totalAutoGradable += question.points
          }
          break
        case "match":
          if (question.pairs && typeof answer === "object") {
            const correctPairs = question.pairs.reduce(
              (acc, pair) => {
                acc[pair.left] = pair.right
                return acc
              },
              {} as Record<string, string>,
            )

            let correctMatches = 0
            Object.entries(answer).forEach(([left, right]) => {
              if (correctPairs[left] === right) {
                correctMatches++
              }
            })

            isCorrect = correctMatches === question.pairs.length
            totalAutoGradable += question.points
          }
          break
        case "short":
          if (question.correctAnswer) {
            isCorrect = answer.toLowerCase().trim() === (question.correctAnswer as string).toLowerCase().trim()
            totalAutoGradable += question.points
          }
          break
      }

      if (isCorrect) {
        autoScore += question.points
      }
    })

    return { autoScore, totalAutoGradable }
  }

  const handleSubmitTest = async (isAutoSubmit = false) => {
    if (!user || !test || !submission) return

    setIsSubmitting(true)

    try {
      const { autoScore } = calculateScore(test, answers)
      const timeSpent = Math.floor(
        (Date.now() -
          (submission.startedAt instanceof Date ? submission.startedAt : submission.startedAt.toDate()).getTime()) /
          1000,
      )

      const updateData = {
        answers,
        autoGradedScore: autoScore,
        score: autoScore, // Will be updated after manual grading
        timeSpent,
        submittedAt: new Date(),
        status: "submitted" as const,
      }

      await updateDocument(`classrooms/${classroomId}/test_submissions`, submission.id, updateData)

      if (isAutoSubmit) {
        toast.success("Test submitted automatically due to time limit.")
      } else {
        toast.success("Test submitted successfully!")
      }

      router.push(`/student/classroom/${classroomId}/tests/${testId}/result`)
    } catch (error) {
      console.error("Error submitting test:", error)
      toast.error("Failed to submit test. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-save answers periodically
  useEffect(() => {
    if (!submission || !hasStarted) return

    const interval = setInterval(async () => {
      try {
        await updateDocument(`classrooms/${classroomId}/test_submissions`, submission.id, {
          answers,
        })
      } catch (error) {
        console.error("Error auto-saving answers:", error)
      }
    }, 30000) // Save every 30 seconds

    return () => clearInterval(interval)
  }, [submission, answers, hasStarted, classroomId, updateDocument])

  // Prevent page refresh/navigation
  useEffect(() => {
    if (!hasStarted) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasStarted])

  if (testLoading) {
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

  if (!hasStarted) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{test.title}</CardTitle>
            {test.description && <CardDescription className="text-base">{test.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold">{test.duration} minutes</p>
                <p className="text-sm text-muted-foreground">Time limit</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary mb-2">{test.questions.length}</div>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary mb-2">{test.totalPoints}</div>
                <p className="text-sm text-muted-foreground">Total points</p>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important Instructions:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>You have {test.duration} minutes to complete this test</li>
                  <li>Your answers will be auto-saved every 30 seconds</li>
                  <li>Do not refresh or close this page during the test</li>
                  <li>The test will auto-submit when time runs out</li>
                  <li>Make sure you have a stable internet connection</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button onClick={handleStartTest} className="w-full" size="lg">
              Start Test
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <p className="text-muted-foreground">
            Question progress: {Object.keys(answers).length} of {test.questions.length} answered
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TestTimer
            duration={test.duration * 60}
            timeLeft={timeLeft}
            onTimeUp={handleTimeUp}
            onTimeUpdate={setTimeLeft}
          />
          <Button onClick={() => handleSubmitTest()} disabled={isSubmitting} variant="default">
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "Submitting..." : "Submit Test"}
          </Button>
        </div>
      </div>

      <TestViewer test={test} answers={answers} onAnswerChange={handleAnswerChange} />
    </div>
  )
}
