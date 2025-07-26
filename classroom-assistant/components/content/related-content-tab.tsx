"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, ExternalLink, Eye } from "lucide-react"
import type { Content as ContentType } from "@/lib/types"

interface RelatedContentTabProps {
  contentId: string
  classroomId: string
}

export function RelatedContentTab({ contentId, classroomId }: RelatedContentTabProps) {
  const [relatedContent, setRelatedContent] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRelatedContent()
  }, [contentId, classroomId])

  const loadRelatedContent = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/find-related", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          classroomId,
          limit: 5,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setRelatedContent(data.relatedContent)
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError("Failed to find related content.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewContent = (content: ContentType) => {
    // This would open the content in a new modal or navigate to it
    window.open(content.url, "_blank")
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <h3 className="text-lg font-semibold text-slate-900">Related Content</h3>
        <p className="text-sm text-slate-600 mt-1">Content similar to this document based on AI analysis</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadRelatedContent} variant="outline">
              Try Again
            </Button>
          </div>
        ) : relatedContent.length > 0 ? (
          <div className="space-y-4">
            {relatedContent.map((content) => (
              <Card key={content.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">{content.title}</h4>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {content.description || "No description available"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {content.topic && (
                          <Badge variant="outline" className="text-xs">
                            {content.topic}
                          </Badge>
                        )}
                        <span className="text-xs text-slate-500">
                          {new Date(content.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewContent(content)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={content.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No related content found</p>
          </div>
        )}
      </div>
    </div>
  )
}
