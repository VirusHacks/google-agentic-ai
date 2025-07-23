"use client"

import { useState } from "react"
import { useUploadThing } from "@/lib/uploadthing-core"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, Upload, X } from "lucide-react"

interface UploadThingPDFUploadProps {
  onUploadComplete: (url: string, filename: string, key: string) => void
  disabled?: boolean
  className?: string
}

export function UploadThingPDFUpload({ onUploadComplete, disabled = false, className = "" }: UploadThingPDFUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { startUpload, isUploading: uploadThingUploading } = useUploadThing("pdfUploader", {
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
    if (file.type !== "application/pdf") {
      setError("Please select a PDF file")
      return
    }

    // Validate file size (16MB limit)
    if (file.size > 16 * 1024 * 1024) {
      setError("File size must be less than 16MB")
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

  const isDisabled = disabled || isUploading || uploadThingUploading

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          disabled={isDisabled}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className={`cursor-pointer flex flex-col items-center space-y-2 ${
            isDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
            <FileText className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isUploading ? "Uploading PDF..." : "Click to upload PDF"}
            </p>
            <p className="text-xs text-gray-500">PDF files up to 16MB</p>
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
