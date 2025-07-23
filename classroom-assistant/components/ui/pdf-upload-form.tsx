"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Upload, type File, X, CheckCircle, AlertCircle, FileText } from "lucide-react"

interface PDFUploadFormProps {
  onUploadComplete: (url: string, filename: string, publicId?: string) => void
  disabled?: boolean
  className?: string
}

export function PDFUploadForm({ onUploadComplete, disabled = false, className = "" }: PDFUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<{
    url: string
    filename: string
    publicId: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const { toast } = useToast()

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== "application/pdf") {
      return "Only PDF files are allowed"
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return "File size must be less than 10MB"
    }

    return null
  }

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      toast({
        title: "Invalid File",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("pdfFile", file)

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progressPercent = Math.round((event.loaded / event.total) * 100)
          setProgress(progressPercent)
        }
      })

      // Handle response
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (error) {
              reject(new Error("Invalid response format"))
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              reject(new Error(errorResponse.error || "Upload failed"))
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"))
        })

        xhr.addEventListener("timeout", () => {
          reject(new Error("Upload timeout"))
        })
      })

      xhr.open("POST", "/api/upload-pdf")
      xhr.timeout = 60000 // 60 second timeout
      xhr.send(formData)

      const response = (await uploadPromise) as any

      setUploadedFile({
        url: response.url,
        filename: response.originalFilename,
        publicId: response.publicId,
      })

      onUploadComplete(response.url, response.originalFilename, response.publicId)

      toast({
        title: "Upload Successful",
        description: `${response.originalFilename} uploaded successfully`,
      })
    } catch (error: any) {
      const errorMessage = error.message || "Upload failed"
      setError(errorMessage)
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const clearUpload = () => {
    setFile(null)
    setUploadedFile(null)
    setError(null)
    setProgress(0)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={className}>
      {!file && !uploadedFile && (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragOver
              ? "border-blue-500 bg-blue-50"
              : error
                ? "border-red-300 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !disabled && document.getElementById("pdf-file-input")?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Upload className={`h-10 w-10 mb-4 ${error ? "text-red-500" : "text-gray-400"}`} />
            <p className="text-lg font-medium mb-2">Upload PDF Document</p>
            <p className="text-sm text-gray-500 mb-4">Drag and drop your PDF file here, or click to select</p>
            <p className="text-xs text-gray-400">Maximum file size: 10MB</p>
            {error && (
              <div className="flex items-center mt-4 text-red-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <input
        id="pdf-file-input"
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          const selectedFile = e.target.files?.[0]
          if (selectedFile) {
            handleFileSelect(selectedFile)
          }
        }}
        className="hidden"
        disabled={disabled}
      />

      {file && !uploading && !uploadedFile && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-red-600" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUpload} disabled={disabled}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={clearUpload}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {uploading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">Uploading {file?.name}...</p>
                <Progress value={progress} className="mt-2" />
                <p className="text-sm text-gray-500 mt-1">{progress}% complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadedFile && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">{uploadedFile.filename}</p>
                  <p className="text-sm text-green-600">Upload successful</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer">
                    View PDF
                  </a>
                </Button>
                <Button variant="ghost" size="sm" onClick={clearUpload}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
