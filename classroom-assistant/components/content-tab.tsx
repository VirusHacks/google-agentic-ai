"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadThingService } from "@/lib/uploadthing-service"
import { BookOpen, FileText, Plus, Download, Trash2, Video, ExternalLink, Eye } from "lucide-react"
import type { Content as ContentType } from "@/lib/types"

// Helper to format dates from Firestore Timestamp or native Date
const formatDate = (d: any): string => {
  const dateObj = d?.toDate ? d.toDate() : d
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface ContentTabProps {
  content: ContentType[]
  onShowAddContent: () => void
  deleteContent: (contentId: string) => void
  openPdfViewer: (url: string, title: string) => void
}

export function ContentTab({ content, onShowAddContent, deleteContent, openPdfViewer }: ContentTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Learning Resources</h2>
          <p className="text-slate-600">Materials and resources for your students</p>
        </div>
        <Button onClick={onShowAddContent}>
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
      </div>

      {content.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {content.map((item) => (
            <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.type === "pdf" && <FileText className="w-6 h-6 text-red-600" />}
                      {item.type === "image" && <BookOpen className="w-6 h-6 text-blue-600" />}
                      {item.type === "video" && <Video className="w-6 h-6 text-purple-600" />}
                      {item.type === "link" && <ExternalLink className="w-6 h-6 text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{item.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{item.topic}</p>
                      <p className="text-xs text-slate-500 mt-2">{formatDate(item.uploadedAt)}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteContent(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {UploadThingService.isImageFile(item.url) && (
                  <div className="mb-4">
                    <img
                      src={item.url || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {UploadThingService.isPdfFile(item.url) && (
                  <div className="mb-4 p-4 bg-red-50 rounded-lg text-center">
                    <FileText className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900 mb-1">PDF Document</p>
                    <p className="text-xs text-slate-600">{item.title}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.type === "link" ? (
                        <>
                          <ExternalLink className="w-3 h-3 mr-2" />
                          Visit Link
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3 mr-2" />
                          Download
                        </>
                      )}
                    </a>
                  </Button>
                  {UploadThingService.isPdfFile(item.url) && (
                    <Button size="sm" variant="outline" onClick={() => openPdfViewer(item.url, item.title)}>
                      <Eye className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No content uploaded yet</h3>
          <p className="text-slate-600 mb-6">Upload learning materials for your students</p>
          <Button onClick={onShowAddContent}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Content
          </Button>
        </div>
      )}
    </div>
  )
} 