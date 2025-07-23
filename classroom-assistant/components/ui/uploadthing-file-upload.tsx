"use client"

import { useState } from "react"
import { useUploadThing } from "@/lib/uploadthing-core"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, FileText, ImageIcon, Video } from "lucide-react"

interface UploadThingFileUploadProps {
  onUploadComplete: (url: string, filename: string, key: string) => void
  acceptedTypes?: string[]
  maxSizeMB?: number
  disabled?: boolean
  className?: string
}

export function UploadThingFileUpload({
  onUploadComplete,
  acceptedTypes = ["application/pdf", "image/*", "video/*"],
  maxSizeMB = 10,
  disabled = false,
  className = "",
}: UploadThingFileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { startUpload, isUploading: uploadThingUploading } = useUploadThing("fileUploader", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const file = res[0]
        onUploadComplete(file.url, file.name, file.key)
        setUploadProgress(100)
        setIsUploading(false)
        setError(null)
      }
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress)
    },
    onUploadError: (error) => {
      setError(error.message)
      setIsUploading(false)
      setUploadProgress(0)
    },
  })

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const isValidType = acceptedTypes.some((type) => {
      if (type.endsWith("/*")) {
        const baseType = type.replace("/*", "")
        return file.type.startsWith(baseType)
      }
      return file.type === type || file.name.endsWith(type.replace(".", ""))
    })

    if (!isValidType) {
      setError(`Please select a valid file type: ${acceptedTypes.join(", ")}`)
      return
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      await startUpload([file])
    } catch (err) {
      setError("Upload failed. Please try again.")
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileIcon = () => {
    if (acceptedTypes.some(type => type.includes("pdf"))) return <FileText className="h-6 w-6 text-red-600" />
    if (acceptedTypes.some(type => type.includes("image"))) return <ImageIcon className="h-6 w-6 text-blue-600" />
    if (acceptedTypes.some(type => type.includes("video"))) return <Video className="h-6 w-6 text-purple-600" />
    return <FileText className="h-6 w-6 text-gray-600" />
  }

  const getFileTypeLabel = () => {
    const types = acceptedTypes.map(type => {
      if (type === "application/pdf") return "PDF"
      if (type === "image/*") return "Image"
      if (type === "video/*") return "Video"
      if (type.startsWith(".")) return type.toUpperCase()
      return type
    })
    return types.join(", ")
  }

  const isDisabled = disabled || isUploading || uploadThingUploading

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          disabled={isDisabled}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer flex flex-col items-center space-y-2 ${
            isDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
            {getFileIcon()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isUploading ? "Uploading file..." : "Click to upload file"}
            </p>
            <p className="text-xs text-gray-500">
              {getFileTypeLabel()} files up to {maxSizeMB}MB
            </p>
          </div>
          {!isUploading && <Upload className="h-4 w-4 text-gray-400" />}
        </label>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          <X className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
