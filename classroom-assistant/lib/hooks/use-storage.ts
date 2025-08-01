"use client"

import { useState, useCallback } from "react"
import { CloudinaryService, type CloudinaryUploadResponse } from "@/lib/cloudinary"

interface StorageState {
  loading: boolean
  progress: number
  error: string | null
  response: CloudinaryUploadResponse | null
}

export function useFirebaseStorage() {
  const [uploadState, setUploadState] = useState<StorageState>({
    loading: false,
    progress: 0,
    error: null,
    response: null,
  })

  const uploadFile = useCallback(async (file: File, path: string, acceptedTypes?: string[]): Promise<string> => {
    console.warn("useFirebaseStorage is deprecated. Use useCloudinaryUpload instead.")

    setUploadState({
      loading: true,
      progress: 0,
      error: null,
      response: null,
    })

    try {
      // Validate file type if specified
      if (acceptedTypes && acceptedTypes.length > 0) {
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

      return response.secure_url
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
