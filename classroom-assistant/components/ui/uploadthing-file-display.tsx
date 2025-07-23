"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, FileText, ImageIcon, Video, Eye, ExternalLink } from "lucide-react"

interface UploadThingFileDisplayProps {
  url: string
  filename: string
  title?: string
  showPreview?: boolean
  className?: string
  onView?: () => void
}

export function UploadThingFileDisplay({ 
  url, 
  filename, 
  title, 
  showPreview = true, 
  className = "", 
  onView 
}: UploadThingFileDisplayProps) {
  const displayTitle = title || filename
  
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename) || 
                  url.includes('image') || 
                  filename.toLowerCase().includes('image')
  
  const isPdf = /\.pdf$/i.test(filename) || 
                url.includes('pdf') || 
                filename.toLowerCase().includes('pdf')
  
  const isVideo = /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(filename) || 
                  url.includes('video') || 
                  filename.toLowerCase().includes('video')

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = () => {
    if (onView) {
      onView()
    } else {
      // Fallback to opening in new tab
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-5 w-5 text-blue-600" />
    if (isPdf) return <FileText className="h-5 w-5 text-red-600" />
    if (isVideo) return <Video className="h-5 w-5 text-purple-600" />
    return <FileText className="h-5 w-5 text-gray-600" />
  }

  const getFileTypeLabel = () => {
    if (isImage) return "Image"
    if (isPdf) return "PDF Document"
    if (isVideo) return "Video"
    return "File"
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              {getFileIcon()}
            </div>
            <div>
              <h4 className="font-medium text-sm">{displayTitle}</h4>
              <p className="text-xs text-gray-500">{getFileTypeLabel()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(isPdf || isImage) && (
              <Button size="sm" variant="outline" onClick={handleView}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </a>
            </Button>
          </div>
        </div>

        {showPreview && (
          <div className="mt-3">
            {isImage && (
              <img
                src={url}
                alt={displayTitle}
                className="w-full h-32 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=128&width=400&text=Image+Preview+Failed"
                }}
              />
            )}

            {isPdf && (
              <div className="border rounded p-4 bg-red-50 text-center">
                <FileText className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-700 font-medium">PDF Document</p>
                <p className="text-xs text-gray-500">{filename}</p>
                <Button size="sm" variant="outline" className="mt-2 bg-transparent" onClick={handleView}>
                  <Eye className="h-3 w-3 mr-1" />
                  Preview PDF
                </Button>
              </div>
            )}

            {isVideo && (
              <video
                src={url}
                controls
                className="w-full h-32 rounded border"
                preload="metadata"
                onError={(e) => {
                  console.error("Video load error:", e)
                }}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
