"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CloudinaryService } from "@/lib/cloudinary"
import { Download, ExternalLink, FileText, Loader2, AlertCircle, Eye } from "lucide-react"

interface PDFViewerProps {
  url: string
  title: string
  className?: string
}

export function PDFViewer({ url, title, className = "" }: PDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [viewMethod, setViewMethod] = useState<"iframe" | "google" | "download">("iframe")

  // Get different URL formats
  const originalUrl = url
  const pdfViewUrl = CloudinaryService.getPdfViewUrl(url)
  const downloadUrl = CloudinaryService.getDownloadUrl(url, title)
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(originalUrl)}&embedded=true`

  useEffect(() => {
    // Reset states when URL changes
    setLoading(true)
    setError(false)
  }, [url])

  const handleLoad = () => {
    setLoading(false)
    setError(false)
  }

  const handleError = () => {
    setLoading(false)
    setError(true)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = title
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRetry = () => {
    if (viewMethod === "iframe") {
      setViewMethod("google")
    } else if (viewMethod === "google") {
      setViewMethod("download")
    } else {
      setViewMethod("iframe")
    }
    setLoading(true)
    setError(false)
  }

  const getCurrentUrl = () => {
    switch (viewMethod) {
      case "google":
        return googleViewerUrl
      case "iframe":
      default:
        return pdfViewUrl
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          {title}
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={originalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading PDF...</p>
              <p className="text-xs text-gray-400 mt-2">
                {viewMethod === "iframe" && "Using direct view"}
                {viewMethod === "google" && "Using Google Docs Viewer"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">Unable to display PDF</p>
              <p className="text-gray-500 text-sm mb-6">
                {viewMethod === "iframe" && "Direct viewing failed. Try alternative viewer or download."}
                {viewMethod === "google" && "Google Docs Viewer failed. Try downloading the file."}
                {viewMethod === "download" && "All viewing methods failed. Please download the file."}
              </p>
              <div className="flex gap-2 justify-center">
                {viewMethod !== "download" && (
                  <Button onClick={handleRetry} variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Try Alternative Viewer
                  </Button>
                )}
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMethod !== "download" && (
        <div className={`${loading || error ? "hidden" : "block"}`}>
          <div className="border rounded-lg overflow-hidden bg-white">
            <iframe
              src={getCurrentUrl()}
              width="100%"
              height="600"
              className="border-0"
              onLoad={handleLoad}
              onError={handleError}
              title={title}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">
              {viewMethod === "iframe" && "Direct PDF view"}
              {viewMethod === "google" && "Powered by Google Docs Viewer"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
