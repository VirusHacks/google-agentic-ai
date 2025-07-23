"use client"

import { useState, useCallback } from "react"
import { CloudinaryService, type CloudinaryUploadResponse } from "@/lib/cloudinary"

interface UploadState {
  loading: boolean
  progress: number
  error: string | null
  response: CloudinaryUploadResponse | null
}

export function useCloudinaryUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    loading: false,
    progress: 0,
    error: null,
    response: null,
  })

  const uploadFile = useCallback(async (file: File, acceptedTypes?: string[]): Promise<CloudinaryUploadResponse> => {
    setUploadState({
      loading: true,
      progress: 0,
      error: null,
      response: null,
    })

    try {
      // Validate file type if specified
      if (acceptedTypes && acceptedTypes.length > 0 && !acceptedTypes.includes("*")) {
        const fileExtension = file.name.split(".").pop()?.toLowerCase()
        const isValidType = acceptedTypes.some((type) => {
          if (type.startsWith(".")) {
            return type.slice(1) === fileExtension
          }
          if (type.includes("/")) {
            return file.type.match(type.replace("*", ".*"))
          }
          return false
        })

        if (!isValidType) {
          throw new Error(`File type not supported. Accepted types: ${acceptedTypes.join(", ")}`)
        }
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error("File size must be less than 10MB")
      }

      const response = await CloudinaryService.uploadFile(file, (progress) => {
        setUploadState((prev) => ({
          ...prev,
          progress,
        }))
      })

      setUploadState({
        loading: false,
        progress: 100,
        error: null,
        response,
      })

      return response
    } catch (error: any) {
      const errorMessage = error.message || "Upload failed"
      setUploadState({
        loading: false,
        progress: 0,
        error: errorMessage,
        response: null,
      })
      throw error
    }
  }, [])

  const resetState = useCallback(() => {
    setUploadState({
      loading: false,
      progress: 0,
      error: null,
      response: null,
    })
  }, [])

  return {
    uploadFile,
    uploadState,
    resetState,
  }
}
