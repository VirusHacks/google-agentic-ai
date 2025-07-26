"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  RefreshCw, 
  List, 
  FileText, 
  Zap, 
  BookOpen,
  Sparkles,
  Clock,
  Target,
  Brain,
  Copy,
  CheckCircle,
} from "lucide-react"

interface SummaryTabProps {
  contentId: string
}

type SummaryType = "short" | "bullets" | "detailed"

export function SummaryTab({ contentId }: SummaryTabProps) {
  const [summaryType, setSummaryType] = useState<SummaryType>("short")
  const [summaries, setSummaries] = useState<Record<SummaryType, string>>({
    short: "",
    bullets: "",
    detailed: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadSummary()
  }, [contentId, summaryType])

  const loadSummary = async () => {
    if (summaries[summaryType]) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          type: summaryType,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSummaries((prev) => ({
          ...prev,
          [summaryType]: data.summary,
        }))
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError("Failed to generate summary. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const regenerateSummary = async () => {
    setSummaries((prev) => ({
      ...prev,
      [summaryType]: "",
    }))
    await loadSummary()
  }

  const copyToClipboard = async () => {
    const text = summaries[summaryType]
    if (text) {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getSummaryTypeInfo = (type: SummaryType) => {
    switch (type) {
      case "short":
        return {
          icon: Zap,
          title: "Quick Overview",
          description: "2-3 sentence summary",
          color: "from-blue-500 to-indigo-600",
        }
      case "bullets":
        return {
          icon: List,
          title: "Key Points",
          description: "Bullet point format",
          color: "from-green-500 to-emerald-600",
        }
      case "detailed":
        return {
          icon: BookOpen,
          title: "Comprehensive",
          description: "Detailed analysis",
          color: "from-purple-500 to-pink-600",
        }
    }
  }

  const currentTypeInfo = getSummaryTypeInfo(summaryType)

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Header */}
      <div className="p-6 bg-white/90 backdrop-blur-sm border-b border-sel-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${currentTypeInfo.color} text-white shadow-lg`}>
              <currentTypeInfo.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold text-sel-text-dark">AI Summary</h3>
              <p className="text-sm text-slate-600">Intelligent content analysis and summarization</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard}
              disabled={!summaries[summaryType] || loading}
              className="border-sel-border hover:bg-sel-accent/20"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={regenerateSummary} 
              disabled={loading}
              className="border-sel-border hover:bg-sel-accent/20"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>
        </div>

        {/* Enhanced Summary Type Selector */}
        <div className="flex gap-3">
          {(["short", "bullets", "detailed"] as SummaryType[]).map((type) => {
            const typeInfo = getSummaryTypeInfo(type)
            const Icon = typeInfo.icon
            
            return (
              <Button
                key={type}
                variant={summaryType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSummaryType(type)}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  summaryType === type 
                    ? `bg-gradient-to-r ${typeInfo.color} text-white shadow-lg` 
                    : "border-sel-border hover:bg-sel-accent/20"
                }`}
              >
                <Icon className="w-4 h-4" />
                {typeInfo.title}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Generating Summary</h4>
                <p className="text-sm text-slate-600">AI is analyzing the content...</p>
              </div>
            </div>
            
            <Card className="border-sel-border bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                  <Brain className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-red-900">Generation Failed</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : summaries[summaryType] ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Estimated reading time: 2-3 minutes</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>AI-powered analysis</span>
              </div>
            </div>

            {/* Summary Content */}
            <Card className="border-sel-border bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="prose prose-slate max-w-none">
                  {summaryType === "bullets" ? (
                    <div className="space-y-2">
                      {summaries[summaryType].split('\n').map((line, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mt-2 flex-shrink-0" />
                          <p className="text-slate-700 leading-relaxed">{line.replace(/^[•\-]\s*/, '')}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {summaries[summaryType].split('\n\n').map((paragraph, index) => (
                        <p key={index} className="text-slate-700 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Features Badge */}
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700">
                <Sparkles className="w-3 h-3 mr-1" />
                Powered by AI
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-medium text-slate-900 mb-2">No Summary Available</h4>
            <p className="text-slate-600 mb-4">Click "Regenerate" to create a new summary</p>
            <Button 
              onClick={regenerateSummary}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Summary
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
