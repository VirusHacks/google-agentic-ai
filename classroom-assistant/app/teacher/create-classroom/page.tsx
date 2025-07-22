"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useFirestoreOperations } from "@/lib/hooks/use-firestore"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUpload } from "@/components/ui/file-upload"
import { useToast } from "@/hooks/use-toast"
import { Loader2, BookOpen, Calendar, Users } from "lucide-react"
import { CurriculumUploader } from "@/components/forms/curriculum-uploader"
import { CloudinaryService } from "@/lib/cloudinary"

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Geography",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Art",
  "Music",
  "Physical Education",
  "Other",
]

function CreateClassroomContent() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { addDocument, loading: firestoreLoading } = useFirestoreOperations()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
    gradeRange: "",
    meetLink: "",
    schedule: {
      days: [] as string[],
      time: "",
    },
  })

  const [curriculumFile, setCurriculumFile] = useState<{ url: string; publicId: string } | null>(null)
  const [timetableFile, setTimetableFile] = useState<{ url: string; publicId: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleDayToggle = (day: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        days: checked ? [...prev.schedule.days, day] : prev.schedule.days.filter((d) => d !== day),
      },
    }))
  }

  const handleCurriculumUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const res = await CloudinaryService.uploadFile(file)
      setCurriculumFile({ url: res.secure_url, publicId: res.public_id })
    } catch (err) {
      toast({ title: "Error", description: "Failed to upload curriculum file.", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleTimetableUpload = (url: string, filename: string, publicId: string) => {
    setTimetableFile({ url, publicId })
  }

  const handleFileRemove = (type: "curriculum" | "timetable") => {
    if (type === "curriculum") {
      setCurriculumFile(null)
    } else {
      setTimetableFile(null)
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Classroom name is required",
        variant: "destructive",
      })
      return false
    }

    if (!formData.subject) {
      toast({
        title: "Validation Error",
        description: "Please select a subject",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !validateForm()) return
    if (!curriculumFile) {
      toast({ title: "Error", description: "Please upload the curriculum file before submitting.", variant: "destructive" })
      return
    }
    if (!timetableFile) {
      toast({ title: "Error", description: "Please upload the timetable file before submitting.", variant: "destructive" })
      return
    }
    if (isUploading) {
      toast({ title: "Uploading", description: "Please wait for all files to finish uploading.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      // Create classroom document with Cloudinary URLs
      const classroomData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        subject: formData.subject,
        gradeRange: formData.gradeRange,
        meetLink: formData.meetLink,
        teacherId: userProfile.uid,
        teacherName: userProfile.displayName,
        schedule: formData.schedule,
        students: [],
        inviteCode: generateInviteCode(),
        curriculumUrl: curriculumFile.url,
        curriculumPublicId: curriculumFile.publicId,
        timetableUrl: timetableFile.url,
        timetablePublicId: timetableFile.publicId,
        curriculumProgress: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const classroomId = await addDocument("classrooms", classroomData)

      toast({
        title: "Success",
        description: "Classroom created successfully!",
      })

      router.push(`/teacher/classroom/${classroomId}`)
    } catch (error: any) {
      console.error("Error creating classroom:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create classroom",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = submitting || firestoreLoading

  return (
    <SidebarLayout role="teacher">
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Classroom</h1>
          <p className="text-gray-600">Set up a new classroom for your students</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>Enter the basic details for your classroom</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Classroom Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Mathematics Grade 10"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject.toLowerCase().replace(/\s+/g, "-")}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeRange">Target Grade/Age Range</Label>
                <Select
                  value={formData.gradeRange}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, gradeRange: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elementary">Elementary (K-5)</SelectItem>
                    <SelectItem value="middle">Middle School (6-8)</SelectItem>
                    <SelectItem value="high">High School (9-12)</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="adult">Adult Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetLink">Google Meet Link</Label>
                <Input
                  id="meetLink"
                  type="url"
                  value={formData.meetLink}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meetLink: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">Optional: Add a permanent Google Meet link for this class</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the classroom and what students will learn"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Schedule
              </CardTitle>
              <CardDescription>Set up the class schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Class Days</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={formData.schedule.days.includes(day)}
                        onCheckedChange={(checked) => handleDayToggle(day, checked as boolean)}
                        disabled={isLoading}
                      />
                      <Label htmlFor={day} className="text-sm">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Class Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.schedule.time}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, time: e.target.value },
                    }))
                  }
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>Upload curriculum and timetable documents (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Curriculum (Optional)</Label>
                <CurriculumUploader
                  onUpload={(data) => {
                    // Use fileUrl and publicId from data
                    setCurriculumFile({
                      url: data.fileUrl,
                      publicId: data.publicId,
                    })
                  }}
                  onError={(error: string) =>
                    toast({
                      title: "Upload Error",
                      description: error,
                      variant: "destructive",
                    })
                  }
                  disabled={isLoading || isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label>Weekly Timetable (Optional)</Label>
                <FileUpload
                  onUploadComplete={(url: string, filename: string, publicId?: string) => {
                    // Ensure all arguments are strings
                    handleTimetableUpload(url, filename, publicId || "")
                  }}
                  acceptedTypes={["application/pdf", "image/*"]}
                  maxSizeMB={10}
                  disabled={isLoading || isUploading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !curriculumFile || !timetableFile || submitting}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Create Classroom
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  )
}

export default function CreateClassroom() {
  return (
    <ProtectedRoute requiredRole="teacher">
      <ErrorBoundary>
        <CreateClassroomContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
