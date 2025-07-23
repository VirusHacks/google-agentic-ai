"use client"
import { FileUpload } from "./file-upload"

interface NoteUploaderProps {
  onUpload: (url: string, filename: string, publicId: string, fileType: string) => void
  onError?: (error: string) => void
  label?: string
  maxSizeMB?: number
  disabled?: boolean
}

export function NoteUploader({
  onUpload,
  onError,
  label = "Upload File",
  maxSizeMB = 25,
  disabled = false,
}: NoteUploaderProps) {
  const handleFileUpload = (url: string, filename: string, publicId: string) => {
    // Determine file type based on filename extension
    const extension = filename.split(".").pop()?.toLowerCase()
    let fileType = "document"

    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) {
      fileType = "image"
    } else if (["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(extension || "")) {
      fileType = "video"
    } else if (["pdf"].includes(extension || "")) {
      fileType = "pdf"
    }

    onUpload(url, filename, publicId, fileType)
  }

  return (
    <FileUpload
      onUpload={handleFileUpload}
      onError={onError}
      accept="image/*,video/*,application/pdf,.pdf,.doc,.docx,.txt,.ppt,.pptx"
      maxSizeMB={maxSizeMB}
      label={label}
      disabled={disabled}
    />
  )
}
