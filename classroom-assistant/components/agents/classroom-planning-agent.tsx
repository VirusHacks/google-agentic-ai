"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Target, Loader2, Pencil, Copy, Download, CheckCircle, AlertCircle } from "lucide-react"
import type { LessonPlan } from "@/lib/ai/schemas/lesson-plan-schema"

interface ClassroomPlanningAgentProps {
  showAIPlanning: boolean
  setShowAIPlanning: (open: boolean) => void
  classroomId: string
}

const MAX_CHARS = 500

const formatLessonPlan = (plan: LessonPlan) => (
  <div className="text-left space-y-6">
    <div className="border-b pb-4">
      <h3 className="text-2xl font-bold mb-2">{plan.title}</h3>
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span>
          <strong>Subject:</strong> {plan.subject}
        </span>
        <span>
          <strong>Grade:</strong> {plan.gradeLevel}
        </span>
        <span>
          <strong>Duration:</strong> {plan.duration}
        </span>
      </div>
    </div>

    <section>
      <h4 className="font-semibold text-lg mb-3 text-blue-700">Learning Objectives</h4>
      <ul className="list-disc ml-6 space-y-1">
        {plan.objectives.map((obj, i) => (
          <li key={i} className="text-gray-700">
            {obj}
          </li>
        ))}
      </ul>
    </section>

    <section>
      <h4 className="font-semibold text-lg mb-3 text-green-700">Topics & Content</h4>
      <div className="space-y-3">
        {plan.topics.map((topic, i) => (
          <div key={i} className="border-l-4 border-green-200 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-800">{topic.name}</span>
              {topic.duration && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{topic.duration}</span>}
            </div>
            <p className="text-gray-600 text-sm mb-2">{topic.description}</p>
            {topic.subtopics && topic.subtopics.length > 0 && (
              <ul className="list-disc ml-4 text-sm text-gray-500">
                {topic.subtopics.map((sub, j) => (
                  <li key={j}>{sub}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>

    <section>
      <h4 className="font-semibold text-lg mb-3 text-purple-700">Learning Activities</h4>
      <ul className="list-disc ml-6 space-y-2">
        {plan.activities.map((activity, i) => (
          <li key={i} className="text-gray-700">
            {activity}
          </li>
        ))}
      </ul>
    </section>

    <section>
      <h4 className="font-semibold text-lg mb-3 text-orange-700">Assessment Methods</h4>
      <ul className="list-disc ml-6 space-y-2">
        {plan.assessments.map((assessment, i) => (
          <li key={i} className="text-gray-700">
            {assessment}
          </li>
        ))}
      </ul>
    </section>

    {plan.resources && plan.resources.length > 0 && (
      <section>
        <h4 className="font-semibold text-lg mb-3 text-indigo-700">Resources & Materials</h4>
        <ul className="list-disc ml-6 space-y-1">
          {plan.resources.map((resource, i) => (
            <li key={i} className="text-gray-700">
              {resource}
            </li>
          ))}
        </ul>
      </section>
    )}

    {plan.prerequisites && plan.prerequisites.length > 0 && (
      <section>
        <h4 className="font-semibold text-lg mb-3 text-red-700">Prerequisites</h4>
        <ul className="list-disc ml-6 space-y-1">
          {plan.prerequisites.map((prereq, i) => (
            <li key={i} className="text-gray-700">
              {prereq}
            </li>
          ))}
        </ul>
      </section>
    )}

    <section className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-semibold text-lg mb-2">Lesson Summary</h4>
      <p className="text-gray-700">{plan.summary}</p>
    </section>
  </div>
)

const ClassroomPlanningAgent: React.FC<ClassroomPlanningAgentProps> = ({
  showAIPlanning,
  setShowAIPlanning,
  classroomId,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [step, setStep] = useState<"input" | "generating" | "result">("input")
  const [focus, setFocus] = useState("")
  const [copied, setCopied] = useState(false)
  const planRef = useRef<HTMLDivElement>(null)

  // Reset state when dialog closes
  useEffect(() => {
    if (!showAIPlanning) {
      setLessonPlan(null)
      setError(null)
      setLoading(false)
      setStep("input")
      setFocus("")
      setCopied(false)
    }
  }, [showAIPlanning])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (focus.length > MAX_CHARS) {
      setError("Focus text is too long. Please keep it under 500 characters.")
      return
    }

    setLoading(true)
    setError(null)
    setLessonPlan(null)
    setStep("generating")

    try {
      const response = await fetch("/api/ai-lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          focus: focus.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (!data.lessonPlan) {
        throw new Error("No lesson plan received from server")
      }

      setLessonPlan(data.lessonPlan)
      setStep("result")
    } catch (err: any) {
      console.error("Generation error:", err)
      setError(err.message || "Failed to generate lesson plan")
      setStep("input")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setStep("input")
    setLessonPlan(null)
    setError(null)
    setLoading(false)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!planRef.current) return

    try {
      const text = planRef.current.innerText
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      setError("Failed to copy to clipboard")
    }
  }

  const handleDownload = () => {
    if (!planRef.current || !lessonPlan) return

    const printContents = planRef.current.innerHTML
    const win = window.open("", "_blank")

    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${lessonPlan.title} - Lesson Plan</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                padding: 2rem; 
                line-height: 1.6;
                color: #333;
              }
              h3 { font-size: 1.8rem; margin-bottom: 1rem; }
              h4 { font-size: 1.2rem; margin-top: 2rem; margin-bottom: 0.5rem; }
              ul { margin-bottom: 1rem; }
              li { margin-bottom: 0.5rem; }
              .border-l-4 { border-left: 4px solid #e5e7eb; padding-left: 1rem; }
              @media print {
                body { padding: 1rem; }
                h3 { page-break-after: avoid; }
              }
            </style>
          </head>
          <body>${printContents}</body>
        </html>
      `)
      win.document.close()
      win.print()
    }
  }

  const isFormValid = focus.length <= MAX_CHARS

  return (
    <Dialog open={showAIPlanning} onOpenChange={setShowAIPlanning}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            AI Lesson Planner
          </DialogTitle>
          <DialogDescription>Generate comprehensive lesson plans tailored to your classroom</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === "input" && (
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="text-center">
                <Target className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-4">Create Your Lesson Plan</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Our AI will generate a comprehensive lesson plan based on your classroom information. Add specific
                  focus areas, topics, or teaching preferences to customize the plan.
                </p>
              </div>

              <div>
                <label htmlFor="focus" className="block font-medium mb-2">
                  Teaching Focus & Instructions <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  id="focus"
                  className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Examples:
• Focus on hands-on activities and group work
• Cover Chapter 3: Photosynthesis with lab experiments  
• Emphasize critical thinking and problem-solving
• Include differentiation for advanced learners
• Use technology integration where possible"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  maxLength={MAX_CHARS}
                />
                <div
                  className={`text-sm text-right mt-1 ${
                    focus.length > MAX_CHARS * 0.9 ? "text-orange-600" : "text-gray-500"
                  }`}
                >
                  {focus.length}/{MAX_CHARS} characters
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={loading || !isFormValid} className="px-6">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Generate Lesson Plan
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <div className="text-lg font-medium text-gray-700 mb-2">Generating Your Lesson Plan</div>
              <div className="text-gray-500 text-center max-w-md">
                Our AI is creating a comprehensive lesson plan tailored to your classroom. This may take a moment...
              </div>
            </div>
          )}

          {step === "result" && lessonPlan && (
            <div className="space-y-6">
              {focus && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>Your Instructions:</strong> "{focus.substring(0, 100)}
                        {focus.length > 100 ? "..." : ""}"
                      </span>
                      <Button variant="ghost" size="sm" onClick={handleEdit}>
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div
                ref={planRef}
                className="bg-white rounded-lg border border-gray-200 p-6 max-h-[60vh] overflow-y-auto"
              >
                {formatLessonPlan(lessonPlan)}
              </div>

              <div className="flex flex-wrap gap-3 justify-end border-t pt-4">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "Copied!" : "Copy Text"}
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Print/Save as PDF
                </Button>
                <Button variant="outline" onClick={handleEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Create New Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ClassroomPlanningAgent
