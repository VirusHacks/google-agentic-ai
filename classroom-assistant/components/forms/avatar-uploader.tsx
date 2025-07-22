"use client"

import type React from "react"

import { useState } from "react"
import { CloudinaryService } from "@/lib/cloudinary"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Camera, Upload, X } from "lucide-react"

interface AvatarUploaderProps {
  currentAvatarUrl?: string
  fallbackText?: string
  onUpload: (url: string, publicId: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
}

export function AvatarUploader({
  currentAvatarUrl,
  fallbackText = "U",
  onUpload,
  onError,
  disabled = false,
  size = "md",
}: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      const error = "Please select an image file"
      onError?.(error)
      toast({
        title: "Invalid File",
        description: error,
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB limit for avatars)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      const error = "Image size must be less than 5MB"
      onError?.(error)
      toast({
        title: "File Too Large",
        description: error,
        variant: "destructive",
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    setProgress(0)

    try {
      const response = await CloudinaryService.uploadFile(file, (progress) => {
        setProgress(progress)
      })

      onUpload(response.secure_url, response.public_id)

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully",
      })
    } catch (error: any) {
      const errorMessage = error.message || "Upload failed"
      onError?.(errorMessage)
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
      setPreviewUrl(null)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const clearPreview = () => {
    setPreviewUrl(null)
  }

  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage
            src={
              displayUrl
                ? CloudinaryService.getOptimizedUrl(displayUrl, {
                    width: size === "lg" ? 128 : size === "md" ? 96 : 64,
                    height: size === "lg" ? 128 : size === "md" ? 96 : 64,
                    format: "auto",
                    quality: "auto",
                  })
                : undefined
            }
            alt="Avatar"
          />
          <AvatarFallback className="text-lg font-semibold">{fallbackText}</AvatarFallback>
        </Avatar>

        {!uploading && (
          <div className="absolute -bottom-2 -right-2">
            <Button
              size="sm"
              className="rounded-full h-8 w-8 p-0"
              onClick={() => document.getElementById("avatar-upload")?.click()}
              disabled={disabled}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        )}

        {previewUrl && !uploading && (
          <div className="absolute -top-2 -right-2">
            <Button size="sm" variant="destructive" className="rounded-full h-6 w-6 p-0" onClick={clearPreview}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {uploading && (
        <div className="w-full max-w-xs space-y-2">
          <div className="flex items-center space-x-2">
            <Upload className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Uploading...</span>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-gray-500 text-center">{Math.round(progress)}% complete</p>
        </div>
      )}

      {!uploading && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("avatar-upload")?.click()}
          disabled={disabled}
        >
          <Upload className="h-4 w-4 mr-2" />
          {currentAvatarUrl ? "Change Photo" : "Upload Photo"}
        </Button>
      )}
    </div>
  )
}
