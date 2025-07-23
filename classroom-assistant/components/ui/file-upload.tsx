"use client"

import type React from "react"

import { useState, useRef } from "react"
import { CloudinaryService } from "@/lib/cloudinary"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react"

interface FileUploadProps {
  onUploadComplete: (url: string, filename: string, publicId?: string) => void
  acceptedTypes?: string[]
  maxSizeMB?: number
  storageType?: string
  className?: string
  disabled?: boolean
}

export function FileUpload({
  onUploadComplete,
  acceptedTypes = ["*"],
  maxSizeMB = 10,
  storageType = "general",
  className = "",
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<{
    url: string
    filename: string
    publicId: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`
    }

    // Check file type if specified
    if (acceptedTypes.length > 0 && !acceptedTypes.includes("*")) {
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
      const mimeType = file.type

      const isValidType = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return type === fileExtension
        }
        if (type.includes("/")) {
          return mimeType.match(type.replace("*", ".*"))
        }
        return false
      })

      if (!isValidType) {
        return `File type not supported. Accepted types: ${acceptedTypes.join(", ")}`
      }
    }

    return null
  }

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      toast({
        title: "Upload Error",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const response = await CloudinaryService.uploadFile(file, (progress) => {
        setProgress(progress)
      })

      setUploadedFile({
        url: response.secure_url,
        filename: file.name,
        publicId: response.public_id,
      })

      onUploadComplete(response.secure_url, file.name, response.public_id)

      toast({
        title: "Upload Successful",
        description: `${file.name} uploaded successfully`,
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileUpload(file)
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
    setUploadedFile(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const acceptString = acceptedTypes.includes("*") ? "*/*" : acceptedTypes.join(",")

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {!uploadedFile && !uploading && (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragOver
              ? "border-blue-500 bg-blue-50"
              : error
                ? "border-red-300 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Upload className={`h-8 w-8 mb-2 ${error ? "text-red-500" : "text-gray-400"}`} />
            <p className="text-sm font-medium mb-1">Upload File</p>
            <p className="text-xs text-gray-500">
              Drag and drop or click to select
              {maxSizeMB && ` (max ${maxSizeMB}MB)`}
            </p>
            {error && (
              <div className="flex items-center mt-2 text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                <p className="text-xs">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {uploading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <File className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Uploading...</p>
                <Progress value={progress} className="mt-2" />
                <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadedFile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm font-medium">{uploadedFile.filename}</p>
                  <p className="text-xs text-green-600">Upload successful</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearUpload}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
