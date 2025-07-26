"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { UploadThingService } from "@/lib/uploadthing-service"
import {
  BookOpen,
  FileText,
  Plus,
  Trash2,
  Video,
  ExternalLink,
  Eye,
  Clock,
  Users,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  BookMarked,
  Target,
  TrendingUp,
  Calendar,
  FileImage,
  Link,
} from "lucide-react"
import type { Content as ContentType } from "@/lib/types"
import { ContentModal } from "./content-modal"
import { useToast } from "@/hooks/use-toast"

// Helper to format dates from Firestore Timestamp or native Date
const formatDate = (d: any): string => {
  try {
    const dateObj = d?.toDate ? d.toDate() : d
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return new Date().toLocaleDateString()
  }
}

// Helper to truncate description
const truncateDescription = (text: string, maxLength = 100): string => {
  if (!text) return "No description available"
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "..."
}

interface ContentTabProps {
  content: ContentType[]
  onShowAddContent: () => void
  deleteContent: (contentId: string) => void
  userRole: "teacher" | "student"
  classroomId: string
}

export function ContentTab({ content, onShowAddContent, deleteContent, userRole, classroomId }: ContentTabProps) {
  const [selectedContent, setSelectedContent] = useState<ContentType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<Record<string, any>>({})
  const { toast } = useToast()

  // Check processing status for all content
  useEffect(() => {
    const checkAllProcessingStatus = async () => {
      const statusPromises = content.map(async (item) => {
        if (UploadThingService.isPdfFile(item.url)) {
          try {
            const response = await fetch(`/api/ai/processing-status?contentId=${item.id}`)
            const data = await response.json()
            return { id: item.id, ...data }
          } catch (error) {
            return { id: item.id, isProcessed: false, error: "Failed to check status" }
          }
        }
        return { id: item.id, isProcessed: true } // Non-PDF content doesn't need processing
      })

      const statuses = await Promise.all(statusPromises)
      const statusMap = statuses.reduce((acc, status) => {
        acc[status.id] = status
        return acc
      }, {})

      setProcessingStatus(statusMap)
    }

    if (content.length > 0) {
      checkAllProcessingStatus()
    }
  }, [content])

  const handleViewContent = (item: ContentType) => {
    const status = processingStatus[item.id]

    if (UploadThingService.isPdfFile(item.url) && !status?.isProcessed) {
      toast({
        title: "Content Processing",
        description: "This content is still being processed by AI. Please wait a moment.",
        variant: "default",
      })
      return
    }

    setSelectedContent(item)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedContent(null)
  }

  const getContentTypeIcon = (type: string, url: string) => {
    if (UploadThingService.isPdfFile(url)) return FileText
    if (type === "image") return FileImage
    if (type === "video") return Video
    if (type === "link") return Link
    return BookOpen
  }

  const getContentTypeColor = (type: string, url: string) => {
    if (UploadThingService.isPdfFile(url)) return "from-blue-500 to-indigo-600"
    if (type === "image") return "from-green-500 to-emerald-600"
    if (type === "video") return "from-purple-500 to-pink-600"
    if (type === "link") return "from-orange-500 to-red-600"
    return "from-slate-500 to-gray-600"
  }

  const getContentTypeBadge = (type: string, url: string) => {
    if (UploadThingService.isPdfFile(url)) return "PDF"
    if (type === "image") return "Image"
    if (type === "video") return "Video"
    if (type === "link") return "Link"
    return "Document"
  }

  const getProcessingStatusBadge = (item: ContentType) => {
    const status = processingStatus[item.id]
    
    if (!UploadThingService.isPdfFile(item.url)) return null
    
    if (!status) {
      return (
        <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Checking...
        </Badge>
      )
    }
    
    if (status.isProcessed) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          AI Enhanced
        </Badge>
      )
    }
    
    if (status.error) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      )
    }
    
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Processing...
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-serif font-semibold text-sel-text-dark">Content Library</h3>
          <p className="text-slate-600 mt-1">Manage and explore educational materials</p>
        </div>
        {userRole === "teacher" && (
          <Button 
            onClick={onShowAddContent}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        )}
      </div>

      {/* Content Grid */}
      {content.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.map((item) => {
            const Icon = getContentTypeIcon(item.type, item.url)
            const gradientClass = getContentTypeColor(item.type, item.url)
            const badgeText = getContentTypeBadge(item.type, item.url)
            const processingBadge = getProcessingStatusBadge(item)
            
            return (
              <Card 
                key={item.id} 
                className="group hover:shadow-xl transition-all duration-300 border-sel-border bg-white hover:bg-sel-bg-light cursor-pointer overflow-hidden"
                onClick={() => handleViewContent(item)}
              >
                <div className="relative">
                  {/* Header with gradient */}
                  <div className={`h-24 bg-gradient-to-br ${gradientClass} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute top-3 right-3">
                      {processingBadge}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Title and Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-semibold text-sel-text-dark group-hover:text-blue-600 transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        <Badge variant="outline" className="text-xs bg-sel-accent/20 border-sel-border flex-shrink-0">
                          {badgeText}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-600 line-clamp-3">
                        {truncateDescription(item.title || "No description available")}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.uploadedAt)}
                          </div>
                          {item.topic && (
                            <div className="flex items-center gap-1">
                              <BookMarked className="w-3 h-3" />
                              {item.topic}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        {userRole === "teacher" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-sel-border hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteContent(item.id)
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Enhanced Empty State */
        <div className="text-center py-16">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No content yet</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {userRole === "teacher" 
              ? "Start building your content library by uploading educational materials."
              : "Your teacher hasn't added any content yet."
            }
          </p>
          {userRole === "teacher" && (
            <Button 
              onClick={onShowAddContent}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Content
            </Button>
          )}
        </div>
      )}

      {/* Content Modal */}
      {selectedContent && (
        <ContentModal
          content={selectedContent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          userRole={userRole}
          classroomId={classroomId}
        />
      )}
    </div>
  )
}
