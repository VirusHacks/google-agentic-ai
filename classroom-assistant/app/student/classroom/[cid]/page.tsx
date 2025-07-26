"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { doc, onSnapshot, collection, query, where, updateDoc, type Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Classroom, Assignment, Content } from "@/lib/types"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { UploadThingFileUpload } from "@/components/ui/uploadthing-file-upload"
import { UploadThingPDFViewer } from "@/components/ui/uploadthing-pdf-viewer"
import { UploadThingService } from "@/lib/uploadthing-service"
import { useToast } from "@/hooks/use-toast"
import {
  BookOpen,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  Download,
  Video,
  TrendingUp,
  Award,
  ExternalLink,
  Brain,
} from "lucide-react"
import { VisualAidGenerator } from "@/components/ui/visual-aid-generator"

// Helper to format dates from Firestore Timestamp or native Date
const formatDate = (d: Timestamp | Date): string => {
  if (!d) return "N/A"
  const dateObj = (d as any)?.toDate ? (d as any).toDate() : (d as Date)
  return dateObj.toLocaleDateString()
}

const formatDateTime = (d: Timestamp | Date): string => {
  if (!d) return "N/A"
  const dateObj = (d as any)?.toDate ? (d as any).toDate() : (d as Date)
  return dateObj.toLocaleString()
}

export default function StudentClassroomPage() {
  const params = useParams()
  const classroomId = params.cid as string
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string } | null>(null)

  // Submission states
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [submissionText, setSubmissionText] = useState("")
  const [submissionFile, setSubmissionFile] = useState<{ url: string; filename: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!classroomId) return

    // Fetch classroom data
    const unsubscribeClassroom = onSnapshot(doc(db, "classrooms", classroomId), (doc) => {
      if (doc.exists()) {
        setClassroom({ id: doc.id, ...doc.data() } as Classroom)
      }
      setLoading(false)
    })

    // Fetch assignments
    const assignmentsQuery = query(collection(db, "assignments"), where("classroomId", "==", classroomId))
    const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
      const assignmentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Assignment[]
      setAssignments(assignmentData)
    })

    // Fetch content
    const contentQuery = query(collection(db, "content"), where("classroomId", "==", classroomId))
    const unsubscribeContent = onSnapshot(contentQuery, (snapshot) => {
      const contentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Content[]
      setContent(contentData)
    })

    return () => {
      unsubscribeClassroom()
      unsubscribeAssignments()
      unsubscribeContent()
    }
  }, [classroomId])

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !selectedAssignment) return

    setSubmitting(true)

    try {
      const submissionData = {
        studentId: userProfile.uid,
        studentName: userProfile.displayName,
        submittedAt: new Date(),
        status: "submitted" as const,
        content: submissionText,
        attachments: submissionFile ? [submissionFile.url] : [],
      }

      await updateDoc(doc(db, "assignments", selectedAssignment.id), {
        [`submissions.${userProfile?.uid || "uid"}`]: submissionData,
      })

      setSubmissionText("")
      setSubmissionFile(null)
      setSelectedAssignment(null)

      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been submitted successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmissionUpload = (url: string, filename: string, key: string) => {
    setSubmissionFile({ url, filename })
    toast({
      title: "File Uploaded",
      description: `${filename} uploaded successfully to UploadThing`,
    })
  }

  const openPdfViewer = (url: string, title: string) => {
    setSelectedPdf({ url, title })
    setShowPdfViewer(true)
  }

  if (loading) {
    return (
      <SidebarLayout role="student">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading classroom...</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  if (!classroom) {
    return (
      <SidebarLayout role="student">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Classroom Not Found</h1>
            <p className="text-gray-600">The classroom you're looking for doesn't exist.</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  const completedAssignments = assignments.filter(
    (assignment) => assignment.submissions?.[userProfile?.uid || "uid"]?.status === "submitted",
  )
  const pendingAssignments = assignments.filter((assignment) => !assignment.submissions?.[userProfile?.uid || "uid"])
  const overdueAssignments = pendingAssignments.filter(
    (assignment) => new Date(assignment.dueDate.toDate ? assignment.dueDate.toDate() : assignment.dueDate) < new Date(),
  )

  return (
    <SidebarLayout role="student">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{classroom.name}</h1>
                <p className="text-gray-600 mt-1">
                  {classroom.subject} • {classroom.students.length} students
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">
                  {completedAssignments.length}/{assignments.length} assignments completed
                </Badge>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="content">Resources</TabsTrigger>
              <TabsTrigger value="visual-aids">Visual Aids</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Classroom Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Description</Label>
                      <p className="text-sm text-gray-600 mt-1">{classroom.description || "No description provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Schedule</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {classroom.schedule.days.join(", ")} at {classroom.schedule.time || "No time set"}
                      </p>
                    </div>
                    {classroom.curriculumUrl && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Curriculum</Label>
                        <div className="flex flex-col gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full bg-transparent"
                            onClick={() => openPdfViewer(classroom.curriculumUrl, "Classroom Curriculum")}
                          >
                            <FileText className="h-3 w-3 mr-2" />
                            View Curriculum PDF
                          </Button>
                          <Button size="sm" variant="outline" className="w-full bg-transparent" asChild>
                            <a href={classroom.curriculumUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3 w-3 mr-2" />
                              Download PDF
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Google Meet Section */}
                {classroom.meetLink && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-lg">
                        <Video className="h-5 w-5 mr-2" />
                        Google Meet
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-3">
                        <p className="text-sm text-gray-600">Join the class meeting</p>
                        <Button className="w-full" asChild>
                          <a href={classroom.meetLink} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-2" />
                            Join Class Meeting
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Your Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm font-medium text-gray-700">Assignment Progress</Label>
                        <span className="text-sm text-gray-600">
                          {Math.round((completedAssignments.length / Math.max(assignments.length, 1)) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={(completedAssignments.length / Math.max(assignments.length, 1)) * 100}
                        className="h-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{completedAssignments.length}</p>
                        <p className="text-xs text-gray-600">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{pendingAssignments.length}</p>
                        <p className="text-xs text-gray-600">Pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Assignments */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="h-5 w-5 mr-2" />
                    Upcoming Assignments
                  </CardTitle>
                  <CardDescription>Assignments due soon</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingAssignments.slice(0, 5).map((assignment) => {
                      const dueDate = assignment.dueDate.toDate
                        ? assignment.dueDate.toDate()
                        : new Date(assignment.dueDate)
                      const isOverdue = dueDate < new Date()
                      const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

                      return (
                        <div
                          key={assignment.id}
                          className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                            isOverdue ? "border-red-200 bg-red-50" : ""
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                isOverdue ? "bg-red-100" : "bg-blue-100"
                              }`}
                            >
                              <FileText className={`h-5 w-5 ${isOverdue ? "text-red-600" : "text-blue-600"}`} />
                            </div>
                            <div>
                              <h3 className="font-medium">{assignment.title}</h3>
                              <p className="text-sm text-gray-500">
                                Due: {formatDateTime(assignment.dueDate)}
                                {isOverdue
                                  ? " (Overdue)"
                                  : daysUntilDue === 0
                                    ? " (Due today)"
                                    : ` (${daysUntilDue} days)`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={isOverdue ? "destructive" : "secondary"}>
                              {assignment.totalPoints} points
                            </Badge>
                            <Button size="sm" variant="outline" onClick={() => setSelectedAssignment(assignment)}>
                              Submit
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    {pendingAssignments.length === 0 && (
                      <div className="text-center py-12">
                        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <p className="text-gray-500">All assignments completed!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Resources */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Recent Resources
                  </CardTitle>
                  <CardDescription>Latest learning materials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {content.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                          {item.type === "pdf" && <FileText className="h-5 w-5 text-green-600" />}
                          {item.type === "image" && <BookOpen className="h-5 w-5 text-green-600" />}
                          {item.type === "video" && <Video className="h-5 w-5 text-green-600" />}
                          {item.type === "link" && <ExternalLink className="h-5 w-5 text-green-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.title}</h4>
                          <p className="text-xs text-gray-500">{item.topic}</p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                    {content.length === 0 && (
                      <div className="col-span-full text-center py-8">
                        <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No resources available yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Visual Aids Tab */}
            <TabsContent value="visual-aids" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">Visual Aid Generator</h3>
                  <p className="text-gray-600">Create and analyze educational diagrams with AI assistance</p>
                </div>
                <Badge variant="outline" className="w-fit">
                  <Brain className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </div>

              <VisualAidGenerator />
            </TabsContent>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-semibold">Assignments</h3>
                <div className="flex gap-2">
                  <Badge variant="outline">{completedAssignments.length} completed</Badge>
                  <Badge variant="outline">{pendingAssignments.length} pending</Badge>
                  {overdueAssignments.length > 0 && (
                    <Badge variant="destructive">{overdueAssignments.length} overdue</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {assignments.map((assignment) => {
                  const submission = assignment.submissions?.[userProfile?.uid || "uid"]
                  const dueDate = assignment.dueDate.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate)
                  const isOverdue = dueDate < new Date() && !submission
                  const isSubmitted = submission?.status === "submitted"

                  return (
                    <Card
                      key={assignment.id}
                      className={`hover:shadow-md transition-shadow ${
                        isOverdue ? "border-red-200" : isSubmitted ? "border-green-200" : ""
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <h4 className="font-medium text-xl">{assignment.title}</h4>
                              <Badge variant="outline">{assignment.totalPoints} points</Badge>
                              {isSubmitted && <Badge className="bg-green-100 text-green-800">Submitted</Badge>}
                              {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                            </div>
                            <p className="text-gray-600 mb-4">{assignment.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Due: {formatDateTime(assignment.dueDate)}
                              </span>
                              {submission && (
                                <span className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  Submitted: {formatDateTime(submission.submittedAt)}
                                </span>
                              )}
                            </div>
                            {assignment.attachments && assignment.attachments.length > 0 && (
                              <div className="mb-4">
                                {UploadThingService.isPdfFile(assignment.attachments[0]) ? (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        openPdfViewer(assignment.attachments[0], `${assignment.title} - Attachment`)
                                      }
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      Preview PDF
                                    </Button>
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={assignment.attachments[0]} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Open in New Tab
                                      </a>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild>
                                      <a
                                        href={assignment.attachments[0]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        Download
                                      </a>
                                    </Button>
                                  </div>
                                ) : (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={assignment.attachments[0]} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-3 w-3 mr-1" />
                                      View Attachment
                                    </a>
                                  </Button>
                                )}
                              </div>
                            )}
                            {submission && (
                              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h5 className="font-medium text-green-800 mb-2">Your Submission</h5>
                                <p className="text-sm text-green-700 mb-2">{submission.content}</p>
                                {submission.attachments && submission.attachments.length > 0 && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={submission.attachments[0]} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-3 w-3 mr-1" />
                                      View Submission
                                    </a>
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!isSubmitted && (
                              <Button
                                size="sm"
                                onClick={() => setSelectedAssignment(assignment)}
                                className={isOverdue ? "bg-red-600 hover:bg-red-700" : ""}
                              >
                                Submit Assignment
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {assignments.length === 0 && (
                  <div className="text-center py-16">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                    <p className="text-gray-500">Your teacher hasn't posted any assignments yet</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-semibold">Learning Resources</h3>
                <Badge variant="outline">{content.length} resources available</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {content.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-3 mb-4">
                        <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                          {item.type === "pdf" && <FileText className="h-6 w-6 text-green-600" />}
                          {item.type === "image" && <BookOpen className="h-6 w-6 text-green-600" />}
                          {item.type === "video" && <Video className="h-6 w-6 text-green-600" />}
                          {item.type === "link" && <ExternalLink className="h-6 w-6 text-green-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{item.title}</h4>
                          <p className="text-sm text-gray-500">{item.topic}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(item.uploadedAt)}</p>
                        </div>
                      </div>

                      {UploadThingService.isImageFile(item.url) && (
                        <img
                          src={item.url || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-32 object-cover rounded-lg mb-4"
                        />
                      )}

                      {UploadThingService.isPdfFile(item.url) && (
                        <div className="mb-4 p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-sm font-medium">PDF Document</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openPdfViewer(item.url, item.title)}>
                              <FileText className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Open
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" asChild>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-2" />
                            {item.type === "link" ? "Visit Link" : "Download"}
                          </a>
                        </Button>
                        {UploadThingService.isPdfFile(item.url) && (
                          <Button size="sm" variant="outline" onClick={() => openPdfViewer(item.url, item.title)}>
                            <FileText className="h-3 w-3 mr-1" />
                            View PDF
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {content.length === 0 && (
                  <div className="col-span-full text-center py-16">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
                    <p className="text-gray-500">Your teacher hasn't uploaded any learning materials yet</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Award className="h-5 w-5 mr-2" />
                      Completion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {Math.round((completedAssignments.length / Math.max(assignments.length, 1)) * 100)}%
                    </div>
                    <p className="text-sm text-gray-500">Assignments completed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">{completedAssignments.length}</div>
                    <p className="text-sm text-gray-500">Assignments done</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Clock className="h-5 w-5 mr-2" />
                      Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">{pendingAssignments.length}</div>
                    <p className="text-sm text-gray-500">Still to do</p>
                  </CardContent>
                </Card>
              </div>

              {/* Assignment History */}
              <Card>
                <CardHeader>
                  <CardTitle>Assignment History</CardTitle>
                  <CardDescription>Your completed assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completedAssignments.map((assignment) => {
                      const submission = assignment.submissions?.[userProfile?.uid || "uid"]
                      return (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{assignment.title}</h3>
                              <p className="text-sm text-gray-500">
                                Submitted: {formatDateTime(submission?.submittedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                            <Badge variant="outline">{assignment.totalPoints} points</Badge>
                          </div>
                        </div>
                      )
                    })}
                    {completedAssignments.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No completed assignments yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* PDF Viewer Dialog */}
          <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedPdf?.title || "PDF Viewer"}</DialogTitle>
                <DialogDescription>View the document</DialogDescription>
              </DialogHeader>
              {selectedPdf && <UploadThingPDFViewer url={selectedPdf.url} title={selectedPdf.title} />}
            </DialogContent>
          </Dialog>

          {/* Assignment Submission Dialog */}
          <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit Assignment</DialogTitle>
                <DialogDescription>
                  {selectedAssignment?.title} - Due: {selectedAssignment && formatDateTime(selectedAssignment.dueDate)}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitAssignment} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="submissionText">Your Response</Label>
                  <Textarea
                    id="submissionText"
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter your assignment response here..."
                    rows={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Attachment (Optional)</Label>
                  <UploadThingFileUpload
                    onUploadComplete={handleSubmissionUpload}
                    acceptedTypes={["application/pdf", ".doc", ".docx", ".txt", "image/*"]}
                    maxSizeMB={10}
                    disabled={submitting}
                  />
                  {submissionFile && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                      ✓ {submissionFile.filename} uploaded successfully
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setSelectedAssignment(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Assignment"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SidebarLayout>
  )
}
