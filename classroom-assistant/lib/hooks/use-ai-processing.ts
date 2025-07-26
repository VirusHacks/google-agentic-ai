"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface ProcessingStatus {
  isProcessed: boolean
  processingProgress?: number
  error?: string
  status?: string
}

export function useAIProcessing(contentId: string) {
  const [status, setStatus] = useState<ProcessingStatus>({ isProcessed: false })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const checkProcessingStatus = useCallback(async () => {
    if (!contentId) return

    try {
      const response = await fetch(`/api/ai/processing-status?contentId=${contentId}`)
      const data = await response.json()

      if (data.success) {
        setStatus({
          isProcessed: data.isProcessed,
          processingProgress: data.processingProgress,
          error: data.error,
          status: data.status,
        })

        if (data.error) {
          toast({
            title: "Processing Error",
            description: data.error,
            variant: "destructive",
          })
        } else if (data.isProcessed && status.isProcessed === false) {
          toast({
            title: "Processing Complete",
            description: "Your content has been enhanced with AI features!",
          })
        }
      }
    } catch (error) {
      console.error("Failed to check processing status:", error)
      setStatus((prev) => ({ ...prev, error: "Failed to check status" }))
    } finally {
      setLoading(false)
    }
  }, [contentId, toast, status.isProcessed])

  useEffect(() => {
    checkProcessingStatus()

    // Poll for status updates if processing
    const interval = setInterval(() => {
      if (!status.isProcessed && !status.error) {
        checkProcessingStatus()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [checkProcessingStatus, status.isProcessed, status.error])

  const startProcessing = async (pdfUrl: string, title: string, subject?: string, gradeLevel?: string) => {
    try {
      setLoading(true)

      const response = await fetch("/api/ai/process-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          pdfUrl,
          title,
          subject,
          gradeLevel,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Processing Started",
          description: "AI is analyzing your content. This may take a few minutes.",
        })

        setStatus({ isProcessed: false, processingProgress: 0, status: "processing" })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      })
      setStatus((prev) => ({ ...prev, error: error.message }))
    } finally {
      setLoading(false)
    }
  }

  return {
    status,
    loading,
    startProcessing,
    checkProcessingStatus,
  }
}
