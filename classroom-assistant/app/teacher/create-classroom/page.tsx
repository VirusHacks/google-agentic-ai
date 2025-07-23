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
import { PDFParserService, type ParsedCurriculum, type ParsedTimetable } from "@/lib/pdf-parser-service"
import { useToast } from "@/hooks/use-toast"
import { Loader2, BookOpen, Calendar, Users, Upload, X, Brain } from "lucide-react"

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
  const [parsingPDFs, setParsingPDFs] = useState(false)
  const [parsedCurriculum, setParsedCurriculum] = useState<ParsedCurriculum | null>(null)
  const [parsedTimetable, setParsedTimetable] = useState<ParsedTimetable | null>(null)

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

  const handleCurriculumUpload = async (url: string, filename: string, key: string) => {
    setCurriculumFile({ url, key, filename })
    toast({
      title: "Curriculum Uploaded",
      description: `${filename} uploaded successfully to UploadThing`,
    })

    // Automatically parse the curriculum PDF
    try {
      setParsingPDFs(true)
      toast({
        title: "AI Analysis Started",
        description: "Analyzing curriculum content with AI...",
      })

      const parsed = await PDFParserService.parseCurriculumPDF(url, "temp-id")
      setParsedCurriculum(parsed)

      toast({
        title: "AI Analysis Complete",
        description: "Curriculum has been analyzed and structured!",
      })
    } catch (error: any) {
      console.error("Error parsing curriculum:", error)
      toast({
        title: "AI Analysis Failed",
        description: "Could not analyze curriculum, but file was uploaded successfully",
        variant: "destructive",
      })
    } finally {
      setParsingPDFs(false)
    }
  }

  const handleTimetableUpload = async (url: string, filename: string, key: string) => {
    setTimetableFile({ url, key, filename })
    toast({
      title: "Timetable Uploaded",
      description: `${filename} uploaded successfully to UploadThing`,
    })

    // Automatically parse the timetable PDF
    try {
      setParsingPDFs(true)
      toast({
        title: "AI Analysis Started",
        description: "Analyzing timetable structure with AI...",
      })

      const parsed = await PDFParserService.parseTimetablePDF(url, "temp-id")
      setParsedTimetable(parsed)

      toast({
        title: "AI Analysis Complete",
        description: "Timetable has been analyzed and structured!",
      })
    } catch (error: any) {
      console.error("Error parsing timetable:", error)
      toast({
        title: "AI Analysis Failed",
        description: "Could not analyze timetable, but file was uploaded successfully",
        variant: "destructive",
      })
    } finally {
      setParsingPDFs(false)
    }
  }

  const removeCurriculumFile = () => {
    setCurriculumFile(null)
    setParsedCurriculum(null)
    toast({
      title: "File Removed",
      description: "Curriculum file removed",
    })
  }

  const removeTimetableFile = () => {
    setTimetableFile(null)
    setParsedTimetable(null)
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
      // Create classroom document with UploadThing URLs and parsed data
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
        curriculumParsed: parsedCurriculum || null,
        timetableUrl: timetableFile?.url || "",
        timetableKey: timetableFile?.key || "",
        timetableFilename: timetableFile?.filename || "",
        timetableParsed: parsedTimetable || null,
        curriculumProgress: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const classroomId = await addDocument("classrooms", classroomData)

      // If we have PDFs but haven't parsed them yet, trigger parsing with the actual classroom ID
      if ((curriculumFile && !parsedCurriculum) || (timetableFile && !parsedTimetable)) {
        toast({
          title: "Classroom Created",
          description: "Classroom created! AI analysis will continue in the background.",
        })

        // Trigger background parsing with actual classroom ID
        if (curriculumFile && !parsedCurriculum) {
          PDFParserService.parseCurriculumPDF(curriculumFile.url, classroomId).catch(console.error)
        }
        if (timetableFile && !parsedTimetable) {
          PDFParserService.parseTimetablePDF(timetableFile.url, classroomId).catch(console.error)
        }
      } else {
        toast({
          title: "Success",
          description: "Classroom created successfully with AI-analyzed content!",
        })
      }

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
            <p className="text-gray-600 mt-2">
              Set up a new classroom for your students with AI-powered content analysis
            </p>
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

            {/* File Uploads with AI Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Upload className="h-6 w-6 mr-3" />
                  Resources & AI Analysis
                </CardTitle>
                <CardDescription>
                  Upload curriculum and timetable documents - AI will automatically analyze and structure the content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label>Curriculum Document (Optional)</Label>
                    {parsingPDFs && <Brain className="h-4 w-4 animate-pulse text-blue-600" />}
                  </div>
                  {!curriculumFile ? (
                    <UploadThingPDFUpload
                      onUploadComplete={handleCurriculumUpload}
                      disabled={isLoading || parsingPDFs}
                    />
                  ) : (
                    <div className="space-y-3">
                      <UploadThingFileDisplay
                        url={curriculumFile.url}
                        filename={curriculumFile.filename}
                        title="Curriculum Document"
                        showPreview={true}
                      />
                      {parsedCurriculum && (
                        <Card className="bg-blue-50 border-blue-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-sm">
                              <Brain className="h-4 w-4 mr-2 text-blue-600" />
                              AI Analysis Results
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xs text-gray-600 space-y-1">
                              <p>
                                <strong>Subject:</strong> {parsedCurriculum.subject}
                              </p>
                              <p>
                                <strong>Grade Level:</strong> {parsedCurriculum.gradeLevel}
                              </p>
                              <p>
                                <strong>Topics:</strong> {parsedCurriculum.topics.length} topics identified
                              </p>
                              <p>
                                <strong>Objectives:</strong> {parsedCurriculum.objectives.length} learning objectives
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeCurriculumFile}
                        disabled={isLoading || parsingPDFs}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove File
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload a PDF containing the curriculum outline - AI will extract topics, objectives, and structure
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label>Weekly Timetable (Optional)</Label>
                    {parsingPDFs && <Brain className="h-4 w-4 animate-pulse text-blue-600" />}
                  </div>
                  {!timetableFile ? (
                    <UploadThingFileUpload
                      onUploadComplete={handleTimetableUpload}
                      acceptedTypes={["application/pdf", "image/*"]}
                      maxSizeMB={10}
                      disabled={isLoading || parsingPDFs}
                    />
                  ) : (
                    <div className="space-y-3">
                      <UploadThingFileDisplay
                        url={timetableFile.url}
                        filename={timetableFile.filename}
                        title="Weekly Timetable"
                        showPreview={true}
                      />
                      {parsedTimetable && (
                        <Card className="bg-green-50 border-green-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-sm">
                              <Brain className="h-4 w-4 mr-2 text-green-600" />
                              AI Analysis Results
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xs text-gray-600 space-y-1">
                              <p>
                                <strong>Period:</strong> {parsedTimetable.period}
                              </p>
                              <p>
                                <strong>Days:</strong> {parsedTimetable.schedule.length} days scheduled
                              </p>
                              <p>
                                <strong>Time Slots:</strong>{" "}
                                {parsedTimetable.schedule.reduce((total, day) => total + day.timeSlots.length, 0)} total
                                slots
                              </p>
                              {parsedTimetable.breaks && (
                                <p>
                                  <strong>Breaks:</strong> {parsedTimetable.breaks.length} break periods
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeTimetableFile}
                        disabled={isLoading || parsingPDFs}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove File
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload your weekly timetable (PDF or image) - AI will extract schedule, subjects, and time slots
                  </p>
                </div>

                {parsingPDFs && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">AI Analysis in Progress</p>
                          <p className="text-xs text-yellow-600">
                            Analyzing document content and extracting structured information...
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end space-x-4 pb-8">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading || parsingPDFs}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || parsingPDFs} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : parsingPDFs ? (
                  <>
                    <Brain className="h-5 w-5 mr-2 animate-pulse" />
                    AI Analyzing...
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
