"use client"

import type React from "react"

import { useState } from "react"
import { FileUpload } from "./file-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"

interface CurriculumData {
  title: string
  description: string
  fileUrl: string
  filename: string
  publicId: string
}

interface CurriculumUploaderProps {
  onUpload: (data: CurriculumData) => void
  onError?: (error: string) => void
  label?: string
  disabled?: boolean
}

export function CurriculumUploader({
  onUpload,
  onError,
  label = "Upload Curriculum",
  disabled = false,
}: CurriculumUploaderProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fileUrl: "",
    filename: "",
    publicId: "",
  })

  const handleFileUpload = (url: string, filename: string, publicId: string) => {
    setFormData((prev) => ({
      ...prev,
      fileUrl: url,
      filename,
      publicId,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      onError?.("Please enter a curriculum title")
      return
    }

    if (!formData.fileUrl) {
      onError?.("Please upload a curriculum file")
      return
    }

    onUpload({
      title: formData.title.trim(),
      description: formData.description.trim(),
      fileUrl: formData.fileUrl,
      filename: formData.filename,
      publicId: formData.publicId,
    })

    // Reset form
    setFormData({
      title: "",
      description: "",
      fileUrl: "",
      filename: "",
      publicId: "",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Curriculum Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Mathematics Grade 10 Curriculum"
              required
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the curriculum content..."
              rows={3}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Curriculum File *</Label>
            <FileUpload
              onUpload={handleFileUpload}
              onError={onError}
              accept="application/pdf,.pdf"
              maxSizeMB={25}
              label="Upload PDF curriculum file"
              disabled={disabled}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFormData({
                  title: "",
                  description: "",
                  fileUrl: "",
                  filename: "",
                  publicId: "",
                })
              }
              disabled={disabled}
            >
              Clear
            </Button>
            <Button type="submit" disabled={disabled || !formData.fileUrl || !formData.title.trim()}>
              Upload Curriculum
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
