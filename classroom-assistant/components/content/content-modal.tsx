"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  X,
  FileText,
  MessageSquare,
  BookOpen,
  Lightbulb,
  Brain,
  StickyNote,
  BarChart3,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  BookMarked,
  Target,
  TrendingUp,
} from "lucide-react"
import type { Content as ContentType } from "@/lib/types"
import { PDFViewer } from "./pdf-viewer"
import { SummaryTab } from "./summary-tab"
import { PracticeQuestionsTab } from "./practice-questions-tab"
import { RelatedContentTab } from "./related-content-tab"
import { KeyConceptsTab } from "./key-concepts-tab"
import { AskAITab } from "./ask-ai-tab"
import { NotesTab } from "./notes-tab"
import { EngagementTrackerTab } from "./engagement-tracker-tab"
import { useContentAnalytics } from "@/hooks/use-content-analytics"
import { UploadThingService } from "@/lib/uploadthing-service"

interface ContentModalProps {
  content: ContentType
  isOpen: boolean
  onClose: () => void
  userRole: "teacher" | "student"
  classroomId: string
}

export function ContentModal({ content, isOpen, onClose, userRole, classroomId }: ContentModalProps) {
  const [activeTab, setActiveTab] = useState("pdf-viewer")
  const [processingStatus, setProcessingStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { trackView, trackTimeSpent } = useContentAnalytics(content.id, classroomId)

  const isPDF = UploadThingService.isPdfFile(content.url)

  // Check processing status
  useEffect(() => {
    const checkStatus = async () => {
      if (!isPDF) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/ai/processing-status?contentId=${content.id}`)
        const data = await response.json()
        setProcessingStatus(data)
      } catch (error) {
        console.error("Failed to check processing status:", error)
        setProcessingStatus({ isProcessed: false, error: "Failed to check status" })
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      checkStatus()
      trackView()
      const startTime = Date.now()

      return () => {
        const timeSpent = Date.now() - startTime
        trackTimeSpent(timeSpent)
      }
    }
  }, [isOpen, content.id, isPDF, trackView, trackTimeSpent])

  // Auto-refresh processing status
  useEffect(() => {
    if (!isOpen || !isPDF || processingStatus?.isProcessed) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/ai/processing-status?contentId=${content.id}`)
        const data = await response.json()
        setProcessingStatus(data)
      } catch (error) {
        console.error("Failed to refresh status:", error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isOpen, content.id, isPDF, processingStatus?.isProcessed])

  const tabs = [
    {
      value: "pdf-viewer",
      label: "Document",
      icon: FileText,
      description: "View the original content",
    },
    {
      value: "summary",
      label: "Summary",
      icon: BookOpen,
      description: "AI-generated summaries",
    },
    {
      value: "key-concepts",
      label: "Key Concepts",
      icon: Lightbulb,
      description: "Important terms and definitions",
    },
    {
      value: "practice-questions",
      label: "Practice",
      icon: Target,
      description: "Interactive questions and exercises",
    },
    {
      value: "ask-ai",
      label: "Ask AI",
      icon: Brain,
      description: "Get help from AI tutor",
    },
    {
      value: "related-content",
      label: "Related",
      icon: TrendingUp,
      description: "Similar content and resources",
    },
    {
      value: "notes",
      label: "Notes",
      icon: StickyNote,
      description: "Personal notes and annotations",
    },
    {
      value: "engagement",
      label: "Analytics",
      icon: BarChart3,
      description: "Learning progress and insights",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-gradient-to-br from-sel-bg-light via-white to-sel-bg-light">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b border-sel-border bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-semibold text-sel-text-dark">
                {content.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-sel-accent/20 border-sel-border">
                  {content.type || "Document"}
                </Badge>
                <span className="text-sm text-slate-500">
                  {(() => {
                    try {
                      const timestamp = content.uploadedAt as any
                      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp || Date.now())
                      return date.toLocaleDateString()
                    } catch {
                      return new Date().toLocaleDateString()
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-sel-border hover:bg-sel-accent/20"
              asChild
            >
              <a href={content.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-sel-border hover:bg-sel-accent/20"
              asChild
            >
              <a href={content.url} download>
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Processing Status Banner */}
        {isPDF && !processingStatus?.isProcessed && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">AI Processing in Progress</h3>
                <p className="text-sm text-blue-700">
                  {processingStatus?.error 
                    ? "Processing failed. Please try again later."
                    : "Analyzing content for summaries, key concepts, and practice questions..."
                  }
                </p>
                {processingStatus?.processingProgress && (
                  <Progress 
                    value={processingStatus.processingProgress} 
                    className="mt-2 h-2 bg-blue-100"
                  />
                )}
              </div>
              {processingStatus?.error && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>
        )}

        {/* Enhanced Tabs */}
        <div className="flex h-full">
          <div className="w-64 border-r border-sel-border bg-white/50 backdrop-blur-sm">
            <div className="p-4">
              <h3 className="text-sm font-medium text-slate-600 mb-3 px-2">Content Tools</h3>
              <TabsList className="grid w-full grid-cols-1 gap-2 bg-transparent">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isDisabled = isPDF && !processingStatus?.isProcessed && tab.value !== "pdf-viewer"
                  
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={`justify-start gap-3 h-auto p-4 rounded-xl border border-sel-border bg-white hover:bg-sel-accent/20 transition-all duration-200 ${
                        isDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={isDisabled}
                      onClick={() => setActiveTab(tab.value)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
                        <Icon className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-slate-900">{tab.label}</div>
                        <div className="text-xs text-slate-500">{tab.description}</div>
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full p-6 overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <TabsContent value="pdf-viewer" className="mt-0 h-full">
                  <div className="h-full rounded-xl border border-sel-border bg-white shadow-sm overflow-hidden">
                    <PDFViewer url={content.url} title={content.title} />
                  </div>
                </TabsContent>

                <TabsContent value="summary" className="mt-0 h-full">
                  <SummaryTab contentId={content.id} />
                </TabsContent>

                <TabsContent value="key-concepts" className="mt-0 h-full">
                  <KeyConceptsTab contentId={content.id} />
                </TabsContent>

                <TabsContent value="practice-questions" className="mt-0 h-full">
                  <PracticeQuestionsTab contentId={content.id} />
                </TabsContent>

                <TabsContent value="ask-ai" className="mt-0 h-full">
                  <AskAITab contentId={content.id} contentTitle={content.title} />
                </TabsContent>

                <TabsContent value="related-content" className="mt-0 h-full">
                  <RelatedContentTab 
                    contentId={content.id} 
                    classroomId={classroomId}
                  />
                </TabsContent>

                <TabsContent value="notes" className="mt-0 h-full">
                  <NotesTab contentId={content.id} />
                </TabsContent>

                <TabsContent value="engagement" className="mt-0 h-full">
                  <EngagementTrackerTab contentId={content.id} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProcessingPlaceholder({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">
        {type} Processing
      </h3>
      <p className="text-slate-600 max-w-md">
        Our AI is analyzing this content to generate {type.toLowerCase()}. 
        This usually takes a few moments.
      </p>
    </div>
  )
}
