"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Maximize2, 
  Minimize2,
  FileText,
  Eye,
  Clock,
  Loader2,
} from "lucide-react"

interface PDFViewerProps {
  url: string
  title: string
}

export function PDFViewer({ url, title }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  return (
    <div 
      ref={containerRef} 
      className={`h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Enhanced PDF Controls */}
      <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm border-b border-sel-border shadow-sm">
        <div className="flex items-center gap-6">
          {/* Document Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">{title}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Eye className="w-3 h-3" />
                <span>PDF Viewer</span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomOut} 
              disabled={zoom <= 50}
              className="border-sel-border hover:bg-sel-accent/20"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-3 min-w-[160px]">
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={50}
                max={200}
                step={25}
                className="flex-1"
              />
              <Badge variant="outline" className="text-xs bg-sel-accent/20 border-sel-border min-w-[50px] text-center">
                {zoom}%
              </Badge>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomIn} 
              disabled={zoom >= 200}
              className="border-sel-border hover:bg-sel-accent/20"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Rotation Control */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRotate}
            className="border-sel-border hover:bg-sel-accent/20"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Rotate
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFullscreen}
            className="border-sel-border hover:bg-sel-accent/20"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 mr-2" />
                Exit
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 mr-2" />
                Fullscreen
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="border-sel-border hover:bg-sel-accent/20"
          >
            <a href={url} download={title}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </div>

      {/* PDF Embed with Enhanced Loading */}
      <div className="flex-1 overflow-hidden relative bg-white rounded-b-lg">
        {isLoading && (
          <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Loading Document</h3>
              <p className="text-sm text-slate-600">Please wait while we prepare your PDF...</p>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={`${url}#zoom=${zoom}&rotate=${rotation}`}
          className="w-full h-full border-0"
          title={title}
          loading="lazy"
          onLoad={handleIframeLoad}
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "center center",
            transition: "transform 0.3s ease-in-out",
          }}
        />
      </div>
    </div>
  )
}
