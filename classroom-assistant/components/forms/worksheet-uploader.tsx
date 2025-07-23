"use client"

import type React from "react"

import { useState } from "react"
import { FileUpload } from "./file-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

interface WorksheetData {
  title: string
  description: string
  subject: string
  gradeLevel: string
  difficulty: "easy" | "medium" | "hard"
  fileUrl: string
  filename: string
  publicId: string
}

interface WorksheetUploaderProps {
  onUpload: (data: WorksheetData) => void
  onError?: (error: string) => void
  disabled?: boolean
}

const SUBJECTS = [
  "mathematics",
  "science",
  "english",
  "history",
  "geography",
  "physics",
  "chemistry",
  "biology",
  "computer-science",
  "art",
  "music",
  "physical-education",
]

const GRADE_LEVELS = [
  "K",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
  "College",
]

export function WorksheetUploader({ onUpload, onError, disabled = false }: WorksheetUploaderProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    gradeLevel: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
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
      onError?.("Please enter a worksheet title")
      return
    }

    if (!formData.subject) {
      onError?.("Please select a subject")
      return
    }

    if (!formData.fileUrl) {
      onError?.("Please upload a worksheet file")
      return
    }

    onUpload({
      title: formData.title.trim(),
      description: formData.description.trim(),
      subject: formData.subject,
      gradeLevel: formData.gradeLevel,
      difficulty: formData.difficulty,
      fileUrl: formData.fileUrl,
      filename: formData.filename,
      publicId: formData.publicId,
    })

    // Reset form
    setFormData({
      title: "",
      description: "",
      subject: "",
      gradeLevel: "",
      difficulty: "medium",
      fileUrl: "",
      filename: "",
      publicId: "",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Upload Worksheet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Worksheet Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Algebra Practice Problems"
                required
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select
                value={formData.subject}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject.charAt(0).toUpperCase() + subject.slice(1).replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level</Label>
              <Select
                value={formData.gradeLevel}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, gradeLevel: value }))}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: "easy" | "medium" | "hard") =>
                  setFormData((prev) => ({ ...prev, difficulty: value }))
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the worksheet content and objectives..."
              rows={3}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Worksheet File *</Label>
            <FileUpload
              onUpload={handleFileUpload}
              onError={onError}
              accept="application/pdf,.pdf,.doc,.docx"
              maxSizeMB={25}
              label="Upload worksheet file (PDF or Word document)"
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
                  subject: "",
                  gradeLevel: "",
                  difficulty: "medium",
                  fileUrl: "",
                  filename: "",
                  publicId: "",
                })
              }
              disabled={disabled}
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={disabled || !formData.fileUrl || !formData.title.trim() || !formData.subject}
            >
              Upload Worksheet
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
