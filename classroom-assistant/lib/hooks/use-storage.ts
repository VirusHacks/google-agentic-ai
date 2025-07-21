"use client"

import { useState, useCallback } from "react"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"
import { storage } from "@/lib/firebase"

interface UploadState {
  progress: number
  loading: boolean
  error: string | null
  url: string | null
}

export function useFirebaseStorage() {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    loading: false,
    error: null,
    url: null,
  })

  const uploadFile = useCallback(
    async (
      file: File,
      path: string,
      allowedTypes: string[] = ["image/*", "application/pdf", "text/*"],
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        // Validate file type
        const isAllowed = allowedTypes.some((type) => {
          if (type.endsWith("/*")) {
            return file.type.startsWith(type.slice(0, -1))
          }
          return file.type === type
        })

        if (!isAllowed) {
          const error = `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(", ")}`
          setUploadState((prev) => ({ ...prev, error }))
          reject(new Error(error))
          return
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          const error = "File size must be less than 10MB"
          setUploadState((prev) => ({ ...prev, error }))
          reject(new Error(error))
          return
        }

        setUploadState({
          progress: 0,
          loading: true,
          error: null,
          url: null,
        })

        const storageRef = ref(storage, path)
        const uploadTask = uploadBytesResumable(storageRef, file)

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            setUploadState((prev) => ({ ...prev, progress }))
          },
          (error) => {
            console.error("Upload error:", error)
            setUploadState((prev) => ({
              ...prev,
              loading: false,
              error: error.message,
            }))
            reject(error)
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              setUploadState({
                progress: 100,
                loading: false,
                error: null,
                url: downloadURL,
              })
              resolve(downloadURL)
            } catch (error: any) {
              console.error("Error getting download URL:", error)
              setUploadState((prev) => ({
                ...prev,
                loading: false,
                error: error.message,
              }))
              reject(error)
            }
          },
        )
      })
    },
    [],
  )

  const deleteFile = useCallback(async (path: string) => {
    try {
      setUploadState((prev) => ({ ...prev, loading: true, error: null }))
      const storageRef = ref(storage, path)
      await deleteObject(storageRef)
      setUploadState((prev) => ({ ...prev, loading: false }))
    } catch (error: any) {
      console.error("Delete error:", error)
      setUploadState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
      throw error
    }
  }, [])

  const resetState = useCallback(() => {
    setUploadState({
      progress: 0,
      loading: false,
      error: null,
      url: null,
    })
  }, [])

  return {
    uploadState,
    uploadFile,
    deleteFile,
    resetState,
  }
}
