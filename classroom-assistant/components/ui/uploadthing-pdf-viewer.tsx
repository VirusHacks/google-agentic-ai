"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Download, ExternalLink, AlertCircle } from "lucide-react"

interface UploadThingPDFViewerProps {
  url: string
  title?: string
  className?: string
}

export function UploadThingPDFViewer({ url, title = "PDF Document", className = "" }: UploadThingPDFViewerProps) {
  const [pdfError, setPdfError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handlePdfLoad = () => {
    setIsLoading(false)
    setPdfError(false)
  }

  const handlePdfError = () => {
    setIsLoading(false)
    setPdfError(true)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = url
    link.download = title
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  if (pdfError) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load PDF</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          The PDF document could not be loaded. This might be due to browser restrictions or the file format.
        </p>
        <div className="flex gap-3">
          <Button onClick={handleOpenInNewTab} variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading PDF...</p>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-red-600" />
          <h3 className="font-medium">{title}</h3>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleOpenInNewTab}>
            <ExternalLink className="h-3 w-3 mr-1" />
            Open in New Tab
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <iframe
          src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
          className="w-full h-[600px] border-0"
          onLoad={handlePdfLoad}
          onError={handlePdfError}
          title={title}
        />
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          If the PDF doesn't load, try opening it in a new tab or downloading it.
        </p>
      </div>
    </div>
  )
}
