"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import DrawingCanvas, { type DrawingCanvasRef } from "@/components/ui/drawing-canvas"
import { analyzeBlackboard } from "@/lib/ai/flows/analyze-blackboard-flow"
import { drawOnBlackboard } from "@/lib/ai/flows/draw-on-blackboard-flow"
import { enhanceBlackboard } from "@/lib/ai/flows/enhance-blackboard-flow"
import type { BlackboardAnalysis, Quiz } from "@/lib/ai/schemas/visual-aid-schemas"
import {
  Eraser,
  Sparkles,
  Loader2,
  Wand2,
  Lightbulb,
  BookOpen,
  Brain,
  MessageSquarePlus,
  PencilRuler,
  HelpCircle,
  Palette,
  Zap,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type ActionType = "draw" | "analyze" | "enhance"

interface VisualAidGeneratorProps {
  className?: string
}

export function VisualAidGenerator({ className }: VisualAidGeneratorProps) {
  const canvasRef = useRef<DrawingCanvasRef>(null)
  const { toast } = useToast()

  const [analysis, setAnalysis] = useState<BlackboardAnalysis | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loadingState, setLoadingState] = useState<{ [key in ActionType]?: boolean }>({})
  const [prompt, setPrompt] = useState("")

  const isLoading = Object.values(loadingState).some(Boolean)

  const handleClear = () => {
    canvasRef.current?.clearCanvas()
    setAnalysis(null)
    setQuiz(null)
    setPrompt("")
  }

  const executeAiAction = async (action: ActionType, textPrompt: string, actionDisplay: string) => {
    if (!canvasRef.current) return
    const imageDataUrl = canvasRef.current.getCanvasDataURL()
    const isCanvasEmpty = canvasRef.current.isCanvasEmpty()

    if ((action === "analyze" || action === "enhance") && isCanvasEmpty) {
      toast({
        variant: "destructive",
        title: "Canvas is empty",
        description: `Please draw something before you ${actionDisplay}.`,
      })
      return
    }

    setLoadingState((prev) => ({ ...prev, [action]: true }))
    setAnalysis(null)
    setQuiz(null)

    try {
      if (action === "draw") {
        const result = await drawOnBlackboard({ prompt: textPrompt })
        if (result.imageDataUri) canvasRef.current?.loadImage(result.imageDataUri)
        toast({
          title: "Visual Created!",
          description: "AI has generated a visual aid for you.",
        })
      } else if (action === "analyze") {
        const result = await analyzeBlackboard({ imageDataUri: imageDataUrl, prompt: textPrompt })
        setAnalysis(result.analysis)
        if (result.quiz) setQuiz(result.quiz)
        toast({
          title: "Analysis Complete!",
          description: "AI has analyzed your drawing.",
        })
      } else if (action === "enhance") {
        const result = await enhanceBlackboard({ imageDataUri: imageDataUrl, prompt: textPrompt })
        if (result.imageDataUri) canvasRef.current?.loadImage(result.imageDataUri)
        const analysisResult = await analyzeBlackboard({
          imageDataUri: result.imageDataUri,
          prompt: "Explain this enhanced drawing.",
        })
        setAnalysis(analysisResult.analysis)
        toast({
          title: "Enhancement Complete!",
          description: "AI has enhanced your drawing.",
        })
      }
    } catch (error) {
      console.error(`AI ${action} failed:`, error)
      toast({
        variant: "destructive",
        title: `AI Error`,
        description: `Something went wrong during the '${actionDisplay}' action. Please try again.`,
      })
    } finally {
      setLoadingState((prev) => ({ ...prev, [action]: false }))
    }
  }

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "Prompt is empty",
        description: "Please enter a command for the AI assistant.",
      })
      return
    }
    const isCanvasEmpty = canvasRef.current?.isCanvasEmpty()
    const action = isCanvasEmpty ? "draw" : "analyze"
    await executeAiAction(action, prompt, prompt)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Palette className="h-6 w-6 mr-3" />
            Visual Aid Generator
          </CardTitle>
          <CardDescription>Draw, generate, and analyze educational diagrams with AI assistance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Drawing Canvas */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative">
                <Card className="border-2 border-slate-600 bg-slate-800 overflow-hidden">
                  <CardContent className="p-2">
                    <DrawingCanvas
                      ref={canvasRef}
                      width={800}
                      height={500}
                      className="w-full h-full"
                      lineColor="#FFFFFF"
                      lineWidth={4}
                      backgroundColor="#292C33"
                    />
                  </CardContent>
                </Card>

                {/* Floating Action Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      className="absolute bottom-4 right-4 rounded-full h-12 w-12 shadow-lg bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      <Wand2 size={20} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" className="mb-2">
                    <DropdownMenuItem
                      onClick={() => executeAiAction("enhance", "Add labels to this diagram", "Add Labels")}
                    >
                      <PencilRuler className="mr-2 h-4 w-4" />
                      <span>Add Labels</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => executeAiAction("analyze", "Explain this concept simply", "Explain")}
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      <span>Explain</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        executeAiAction(
                          "analyze",
                          "Generate a multiple choice quiz question based on this diagram.",
                          "Quiz Me",
                        )
                      }
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Quiz Me</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  placeholder="Ask AI to draw something or explain your diagram..."
                  className="flex-1"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePromptSubmit()}
                  disabled={isLoading}
                />
                <Button onClick={handlePromptSubmit} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? "Working..." : "Submit"}
                </Button>
                <Button variant="outline" onClick={handleClear} disabled={isLoading}>
                  <Eraser className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            {/* AI Analysis Panel */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">AI Analysis</h3>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
              </div>

              {isLoading && !analysis && !quiz && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-blue-700">AI is thinking...</p>
                  </CardContent>
                </Card>
              )}

              {analysis && (
                <div className="space-y-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Lightbulb className="h-4 w-4 text-green-600" />
                        <span>Description</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-green-800">{analysis.description}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span>Key Facts</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="list-disc pl-4 text-sm text-blue-800 space-y-1">
                        {analysis.facts.map((fact, i) => (
                          <li key={i}>{fact}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {analysis.imageUrl && (
                    <Card className="bg-purple-50 border-purple-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span>Related Visual</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Image
                          src={analysis.imageUrl || "/placeholder.svg"}
                          alt="AI generated visual aid"
                          width={300}
                          height={200}
                          className="rounded-md object-cover w-full aspect-video"
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {quiz && (
                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <HelpCircle className="h-4 w-4 text-orange-600" />
                      <span>Quiz Time!</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <p className="font-medium text-orange-800">{quiz.question}</p>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-orange-700">
                      {quiz.options.map((option, i) => (
                        <li key={i}>{option}</li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t border-orange-200">
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Answer: {quiz.answer}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!analysis && !quiz && !isLoading && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-6 text-center">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">Ready to help!</p>
                    <p className="text-xs text-gray-500">Draw something or ask AI to generate a visual aid</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
