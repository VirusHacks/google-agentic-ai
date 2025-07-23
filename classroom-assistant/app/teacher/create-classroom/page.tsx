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
import { UploadThingPDFUpload } from "@/components/ui/uploadthing-pdf-upload"
import { UploadThingFileUpload } from "@/components/ui/uploadthing-file-upload"
import { UploadThingFileDisplay } from "@/components/ui/uploadthing-file-display"
import { useToast } from "@/hooks/use-toast"
import { Loader2, BookOpen, Calendar, Users, Upload, X } from "lucide-react"

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

  const [curriculumFile, setCurriculumFile] = useState<{
    url: string
    key: string
    filename: string
  } | null>(null)

  const [timetableFile, setTimetableFile] = useState<{
    url: string
    key: string
    filename: string
  } | null>(null)

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

  const handleCurriculumUpload = (url: string, filename: string, key: string) => {
    setCurriculumFile({ url, key, filename })
    toast({
      title: "Curriculum Uploaded",
      description: `${filename} uploaded successfully to UploadThing`,
    })
  }

  const handleTimetableUpload = (url: string, filename: string, key: string) => {
    setTimetableFile({ url, key, filename })
    toast({
      title: "Timetable Uploaded",
      description: `${filename} uploaded successfully to UploadThing`,
    })
  }

  const removeCurriculumFile = () => {
    setCurriculumFile(null)
    toast({
      title: "File Removed",
      description: "Curriculum file removed",
    })
  }

  const removeTimetableFile = () => {
    setTimetableFile(null)
    toast({
      title: "File Removed",
      description: "Timetable file removed",
    })
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
      // Create classroom document with UploadThing URLs
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
        curriculumUrl: curriculumFile?.url || "",
        curriculumKey: curriculumFile?.key || "",
        curriculumFilename: curriculumFile?.filename || "",
        timetableUrl: timetableFile?.url || "",
        timetableKey: timetableFile?.key || "",
        timetableFilename: timetableFile?.filename || "",
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Classroom</h1>
            <p className="text-gray-600 mt-2">Set up a new classroom for your students</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <BookOpen className="h-6 w-6 mr-3" />
                  Basic Information
                </CardTitle>
                <CardDescription>Enter the basic details for your classroom</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the classroom and what students will learn"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Calendar className="h-6 w-6 mr-3" />
                  Schedule
                </CardTitle>
                <CardDescription>Set up the class schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Class Days</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={formData.schedule.days.includes(day)}
                          onCheckedChange={(checked) => handleDayToggle(day, checked as boolean)}
                          disabled={isLoading}
                        />
                        <Label htmlFor={day} className="text-sm font-medium">
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
                    className="max-w-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* File Uploads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Upload className="h-6 w-6 mr-3" />
                  Resources
                </CardTitle>
                <CardDescription>Upload curriculum and timetable documents (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <Label>Curriculum Document (Optional)</Label>
                  {!curriculumFile ? (
                    <UploadThingPDFUpload onUploadComplete={handleCurriculumUpload} disabled={isLoading} />
                  ) : (
                    <div className="space-y-3">
                      <UploadThingFileDisplay
                        url={curriculumFile.url}
                        filename={curriculumFile.filename}
                        title="Curriculum Document"
                        showPreview={true}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeCurriculumFile}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove File
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Upload a PDF containing the curriculum outline</p>
                </div>

                <div className="space-y-4">
                  <Label>Weekly Timetable (Optional)</Label>
                  {!timetableFile ? (
                    <UploadThingFileUpload
                      onUploadComplete={handleTimetableUpload}
                      acceptedTypes={["application/pdf", "image/*"]}
                      maxSizeMB={10}
                      disabled={isLoading}
                    />
                  ) : (
                    <div className="space-y-3">
                      <UploadThingFileDisplay
                        url={timetableFile.url}
                        filename={timetableFile.filename}
                        title="Weekly Timetable"
                        showPreview={true}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeTimetableFile}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove File
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Upload your weekly timetable (PDF or image)</p>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end space-x-4 pb-8">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="h-5 w-5 mr-2" />
                    Create Classroom
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
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
