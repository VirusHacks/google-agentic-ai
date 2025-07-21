"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useFirestoreOperations } from "@/lib/hooks/use-firestore"
import { useFirebaseStorage } from "@/lib/hooks/use-storage"
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
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2, BookOpen, Calendar, Users, X } from "lucide-react"

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
  const { uploadFile, uploadState, resetState } = useFirebaseStorage()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
    schedule: {
      days: [] as string[],
      time: "",
    },
  })

  const [curriculumFile, setCurriculumFile] = useState<File | null>(null)
  const [timetableFile, setTimetableFile] = useState<File | null>(null)
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

  const handleFileRemove = (type: "curriculum" | "timetable") => {
    if (type === "curriculum") {
      setCurriculumFile(null)
    } else {
      setTimetableFile(null)
    }
    resetState()
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

    setSubmitting(true)

    try {
      let curriculumUrl = ""
      let timetableUrl = ""

      // Upload files if provided
      if (curriculumFile) {
        const curriculumPath = `classrooms/${userProfile.uid}/${Date.now()}_curriculum_${curriculumFile.name}`
        curriculumUrl = await uploadFile(curriculumFile, curriculumPath, ["application/pdf"])
      }

      if (timetableFile) {
        const timetablePath = `classrooms/${userProfile.uid}/${Date.now()}_timetable_${timetableFile.name}`
        timetableUrl = await uploadFile(timetableFile, timetablePath, ["application/pdf", "image/*"])
      }

      // Create classroom document
      const classroomData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        subject: formData.subject,
        teacherId: userProfile.uid,
        teacherName: userProfile.displayName,
        schedule: formData.schedule,
        students: [],
        inviteCode: generateInviteCode(),
        curriculumUrl,
        timetableUrl,
        curriculumProgress: 0,
        isActive: true,
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

  const isLoading = submitting || firestoreLoading || uploadState.loading

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
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Resources
              </CardTitle>
              <CardDescription>Upload curriculum and timetable documents (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="curriculum">Curriculum PDF</Label>
                {curriculumFile ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{curriculumFile.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(curriculumFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileRemove("curriculum")}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Input
                    id="curriculum"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setCurriculumFile(e.target.files?.[0] || null)}
                    disabled={isLoading}
                  />
                )}
                <p className="text-xs text-gray-500">Upload a PDF containing the curriculum outline</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timetable">Weekly Timetable</Label>
                {timetableFile ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{timetableFile.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(timetableFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileRemove("timetable")}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Input
                    id="timetable"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setTimetableFile(e.target.files?.[0] || null)}
                    disabled={isLoading}
                  />
                )}
                <p className="text-xs text-gray-500">Upload your weekly timetable (PDF or image)</p>
              </div>

              {/* Upload Progress */}
              {uploadState.loading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading files...</span>
                    <span>{Math.round(uploadState.progress)}%</span>
                  </div>
                  <Progress value={uploadState.progress} />
                </div>
              )}

              {uploadState.error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{uploadState.error}</div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
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
