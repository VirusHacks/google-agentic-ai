"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Lightbulb, RefreshCw, BookOpen } from "lucide-react"

interface Concept {
  term: string
  definition: string
  category: "formula" | "definition" | "concept" | "principle"
}

interface KeyConceptsTabProps {
  contentId: string
}

export function KeyConceptsTab({ contentId }: KeyConceptsTabProps) {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConcepts()
  }, [contentId])

  const loadConcepts = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ai/processing-status?contentId=${contentId}`)
      const statusData = await response.json()

      if (statusData.success && statusData.isProcessed) {
        // Get concepts from processed content
        const { getFromFirestore } = await import("@/lib/ai/utils/firestore-helpers")
        const analysis = await getFromFirestore("content_analysis", contentId)

        if (analysis && analysis.keyConcepts) {
          setConcepts(analysis.keyConcepts)
        } else {
          throw new Error("Key concepts not found")
        }
      } else {
        throw new Error("Content not processed yet")
      }
    } catch (err) {
      setError("Failed to extract key concepts. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const regenerateConcepts = async () => {
    setConcepts([])
    await loadConcepts()
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "formula":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "definition":
        return "bg-green-50 text-green-700 border-green-200"
      case "concept":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "principle":
        return "bg-orange-50 text-orange-700 border-orange-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "formula":
        return "∑"
      case "definition":
        return "📖"
      case "concept":
        return "💡"
      case "principle":
        return "⚖️"
      default:
        return "📝"
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Key Concepts</h3>
            <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
              <Lightbulb className="w-3 h-3 mr-1" />
              AI Extracted
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={regenerateConcepts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadConcepts} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : concepts.length > 0 ? (
          <div className="space-y-4">
            {concepts.map((concept, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getCategoryColor(concept.category)}`}
                    >
                      {getCategoryIcon(concept.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900">{concept.term}</h4>
                        <Badge variant="outline" className={`text-xs ${getCategoryColor(concept.category)}`}>
                          {concept.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{concept.definition}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No key concepts extracted yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
