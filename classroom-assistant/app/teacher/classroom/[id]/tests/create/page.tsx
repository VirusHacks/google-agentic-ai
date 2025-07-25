"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Loader2, AlertCircle, CheckCircle2, Bot, Save, RefreshCw } from "lucide-react"
import { useFirestoreDocument } from "@/lib/hooks/use-firestore"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { TestBuilder } from "@/components/tests/test-builder"
import { AIButton } from "@/components/tests/ai-button"
import { AgentUtils } from "@/lib/agent-utils"
import { FirebaseTestUtils } from "@/lib/firebase-test-utils"
import type { TestQuestion, Classroom } from "@/lib/types"

interface GenerationState {
  step: "idle" | "generating-questions" | "generating-answers" | "complete" | "error"
  progress: number
  currentStep: string
  error?: string
  metadata?: {
    questionCount?: number
    processingTime?: number
    totalMarks?: number
  }
}

interface FormState {
  title: string
  description: string
  duration: number
  totalMarks: number
  isActive: boolean
  generationPrompt: string
}

export default function CreateTestPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const classroomId = params.id as string

  const { data: classroom, loading: classroomLoading } = useFirestoreDocument<Classroom>("classrooms", classroomId)

  // Form state
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
    duration: 60,
    totalMarks: 100,
    isActive: false,
    generationPrompt: "",
  })

  // Test state
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [aiGenerated, setAiGenerated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generation state
  const [generationState, setGenerationState] = useState<GenerationState>({
    step: "idle",
    progress: 0,
    currentStep: "",
  })

  // Auto-save draft functionality
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Update form state helper
  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }, [])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges || !user) return

    const autoSaveInterval = setInterval(() => {
      saveDraft()
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [hasUnsavedChanges, user, formState, questions])

  const saveDraft = useCallback(async () => {
    if (!user || !hasUnsavedChanges) return

    try {
      const draftData = {
        ...formState,
        questions,
        aiGenerated,
        lastModified: new Date().toISOString(),
      }

      localStorage.setItem(`test-draft-${classroomId}`, JSON.stringify(draftData))
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Error saving draft:", error)
    }
  }, [user, hasUnsavedChanges, formState, questions, aiGenerated, classroomId])

  // Load draft on component mount
  useEffect(() => {
    const loadDraft = () => {
      try {
        const draftData = localStorage.getItem(`test-draft-${classroomId}`)
        if (draftData) {
          const parsed = JSON.parse(draftData)
          setFormState({
            title: parsed.title || "",
            description: parsed.description || "",
            duration: parsed.duration || 60,
            totalMarks: parsed.totalMarks || 100,
            isActive: parsed.isActive || false,
            generationPrompt: parsed.generationPrompt || "",
          })
          setQuestions(parsed.questions || [])
          setAiGenerated(parsed.aiGenerated || false)
          setLastSaved(new Date(parsed.lastModified))
        }
      } catch (error) {
        console.error("Error loading draft:", error)
      }
    }

    loadDraft()
  }, [classroomId])

  const handleGenerateTest = async () => {
    if (!classroom || !formState.generationPrompt.trim()) {
      toast.error("Please enter generation instructions")
      return
    }

    setGenerationState({
      step: "generating-questions",
      progress: 10,
      currentStep: "Analyzing your requirements...",
    })

    try {
      // Step 1: Generate test questions
      setGenerationState({
        step: "generating-questions",
        progress: 30,
        currentStep: "Generating test questions...",
      })

      const testResult = await AgentUtils.generateTest({
        classroomSubject: classroom.subject,
        gradeRange: classroom.gradeRange,
        curriculum: classroom.description,
        instruction: formState.generationPrompt,
        totalMarks: formState.totalMarks,
        duration: formState.duration,
      })

      // Update form with generated data
      updateFormState({
        title: testResult.title || "AI Generated Test",
        description: testResult.description || "",
      })

      if (testResult.estimatedDuration) {
        updateFormState({ duration: testResult.estimatedDuration })
      }

      // Convert generated questions to our format
      const generatedQuestions: TestQuestion[] = testResult.questions.map((q: any, index: number) => ({
        id: `q-${Date.now()}-${index}`,
        type: q.type,
        text: q.text,
        marks: q.marks,
        required: true,
        options: q.options,
        pairs: q.pairs,
        order: index,
        aiGenerated: true,
      }))

      setGenerationState({
        step: "generating-answers",
        progress: 60,
        currentStep: "Generating answer keys and explanations...",
        metadata: {
          questionCount: generatedQuestions.length,
          totalMarks: testResult.totalMarks,
        },
      })

      // Step 2: Generate answers for the questions
      const answersResult = await AgentUtils.generateAnswers({
        questions: generatedQuestions,
        classroomSubject: classroom.subject,
        gradeRange: classroom.gradeRange,
      })

      // Add correct answers to questions
      const questionsWithAnswers = generatedQuestions.map((q) => ({
        ...q,
        correctAnswer: answersResult.answers[q.id]?.correctAnswer,
        explanation: answersResult.answers[q.id]?.explanation,
        gradingCriteria: answersResult.answers[q.id]?.gradingCriteria,
      }))

      setQuestions(questionsWithAnswers)
      setAiGenerated(true)
      setHasUnsavedChanges(true)

      setGenerationState({
        step: "complete",
        progress: 100,
        currentStep: "Test generation completed successfully!",
        metadata: {
          questionCount: questionsWithAnswers.length,
          totalMarks: questionsWithAnswers.reduce((sum, q) => sum + q.marks, 0),
        },
      })

      toast.success("Test generated successfully! Review and edit as needed.")
    } catch (error) {
      console.error("Error generating test:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      setGenerationState({
        step: "error",
        progress: 0,
        currentStep: "Generation failed",
        error: errorMessage,
      })

      toast.error(`Failed to generate test: ${errorMessage}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("You must be logged in to create a test")
      return
    }

    // Validate form data
    const validationErrors = FirebaseTestUtils.validateTestData({
      classroomId,
      title: formState.title,
      description: formState.description,
      duration: formState.duration,
      totalMarks: formState.totalMarks,
      createdBy: user.uid,
      isActive: formState.isActive,
      aiGenerated,
      generationPrompt: aiGenerated ? formState.generationPrompt : undefined,
      questions,
    })

    if (validationErrors.length > 0) {
      toast.error(`Validation failed: ${validationErrors.join(", ")}`)
      return
    }

    setIsSubmitting(true)

    try {
      const actualTotalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

      const testData = {
        classroomId,
        title: formState.title.trim(),
        description: formState.description.trim() || undefined,
        duration: formState.duration,
        totalMarks: actualTotalMarks,
        createdBy: user.uid,
        isActive: formState.isActive,
        aiGenerated,
        generationPrompt: aiGenerated ? formState.generationPrompt : undefined,
        questions: questions.map((q, index) => ({
          ...q,
          order: index,
        })),
      }

      // Prepare AI answers if generated
      let aiAnswers: Record<string, any> | undefined
      if (aiGenerated) {
        aiAnswers = questions.reduce(
          (acc, q) => {
            if (q.correctAnswer) {
              acc[q.id] = {
                correctAnswer: q.correctAnswer,
                gradingCriteria:
                  q.type || (q.type === "long" || q.type === "short" ? "AI-assisted grading" : undefined),
              }
            }
            return acc
          },
          {} as Record<string, any>,
        )
      }

      // Create the complete test with transaction
      const result = await FirebaseTestUtils.createCompleteTest(testData, aiAnswers)

      // Clear draft
      localStorage.removeItem(`test-draft-${classroomId}`)
      setHasUnsavedChanges(false)

      toast.success("Test created successfully!")
      router.push(`/classroom/${classroomId}/tests`)
    } catch (error) {
      console.error("Error creating test:", error)
      toast.error(`Failed to create test: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetGeneration = () => {
    setGenerationState({
      step: "idle",
      progress: 0,
      currentStep: "",
    })
    setQuestions([])
    setAiGenerated(false)
    updateFormState({
      title: "",
      description: "",
      generationPrompt: "",
    })
  }

  const handleQuestionsChange = useCallback((newQuestions: TestQuestion[]) => {
    setQuestions(newQuestions)
    setHasUnsavedChanges(true)
  }, [])

  if (classroomLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading classroom...</span>
        </div>
      </div>
    )
  }

  if (!classroom) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Classroom not found or you don't have access to it.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Test</h1>
            <p className="text-muted-foreground">Create a new test for your students</p>
            <p className="text-sm text-muted-foreground mt-1">
              {classroom.subject} • {classroom.gradeRange}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Button variant="outline" size="sm" onClick={saveDraft}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            )}
            {lastSaved && (
              <span className="text-xs text-muted-foreground">Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Details</CardTitle>
            <CardDescription>Basic information about your test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Test Title *</Label>
              <Input
                id="title"
                value={formState.title}
                onChange={(e) => updateFormState({ title: e.target.value })}
                placeholder="Enter test title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formState.description}
                onChange={(e) => updateFormState({ description: e.target.value })}
                placeholder="Enter test description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="300"
                  value={formState.duration}
                  onChange={(e) => updateFormState({ duration: Number.parseInt(e.target.value) || 60 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="totalMarks">Target Total Marks</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  min="1"
                  max="1000"
                  value={formState.totalMarks}
                  onChange={(e) => updateFormState({ totalMarks: Number.parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formState.isActive}
                onCheckedChange={(checked) => updateFormState({ isActive: checked })}
              />
              <Label htmlFor="active">Make test active immediately</Label>
            </div>
          </CardContent>
        </Card>

        {/* AI Generation Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Test Generation
            </CardTitle>
            <CardDescription>Use AI to automatically generate test questions based on your curriculum</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prompt">Generation Instructions</Label>
              <Textarea
                id="prompt"
                value={formState.generationPrompt}
                onChange={(e) => updateFormState({ generationPrompt: e.target.value })}
                placeholder="e.g., Create a comprehensive test with 10 MCQs, 5 short answers, and 2 long answers covering photosynthesis and plant biology"
                rows={3}
                disabled={generationState.step !== "idle"}
              />
            </div>

            {/* Generation Progress */}
            {generationState.step !== "idle" && (
              <div className="space-y-3">
                <Progress value={generationState.progress} className="w-full" />

                <Alert
                  className={
                    generationState.step === "error"
                      ? "border-destructive"
                      : generationState.step === "complete"
                        ? "border-green-500"
                        : "border-blue-500"
                  }
                >
                  {(generationState.step === "generating-questions" ||
                    generationState.step === "generating-answers") && <Loader2 className="h-4 w-4 animate-spin" />}
                  {generationState.step === "error" && <AlertCircle className="h-4 w-4" />}
                  {generationState.step === "complete" && <CheckCircle2 className="h-4 w-4" />}

                  <AlertDescription>
                    <div className="space-y-1">
                      <p>{generationState.currentStep}</p>
                      {generationState.metadata && (
                        <div className="text-xs text-muted-foreground">
                          {generationState.metadata.questionCount && (
                            <span>Questions: {generationState.metadata.questionCount} • </span>
                          )}
                          {generationState.metadata.totalMarks && (
                            <span>Total Marks: {generationState.metadata.totalMarks}</span>
                          )}
                        </div>
                      )}
                      {generationState.error && (
                        <p className="text-destructive text-sm mt-1">{generationState.error}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex gap-2">
              <AIButton
                onClick={handleGenerateTest}
                loading={
                  generationState.step === "generating-questions" || generationState.step === "generating-answers"
                }
                disabled={!formState.generationPrompt.trim() || !classroom || generationState.step !== "idle"}
              >
                Generate Test with AI
              </AIButton>

              {(generationState.step === "complete" || generationState.step === "error") && (
                <Button type="button" variant="outline" onClick={resetGeneration}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New Test
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        <TestBuilder questions={questions} onQuestionsChange={handleQuestionsChange} aiGenerated={aiGenerated} />

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>

          <Button type="submit" disabled={isSubmitting || questions.length === 0} className="min-w-[120px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Test"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
