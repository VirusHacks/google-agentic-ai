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
import { FileUpload } from "@/components/ui/file-upload"
import { CloudinaryService } from "@/lib/cloudinary"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, FileText, Calendar, Clock, CheckCircle, Download, Video, TrendingUp, Award } from "lucide-react"

// Helper to format dates from Firestore Timestamp or native Date
const formatDate = (d: Timestamp | Date): string => {
  const dateObj = (d as any)?.toDate ? (d as any).toDate() : (d as Date)
  return dateObj.toLocaleDateString()
}

const formatDateTime = (d: Timestamp | Date): string => {
  const dateObj = (d as any)?.toDate ? (d as any).toDate() : (d as Date)
  return dateObj.toLocaleString()
}

export default function StudentClassroomPage() {
  const params = useParams()
  const classroomId = params.id as string
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)

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
        submittedAt: new Date(),
        status: "submitted" as const,
        content: submissionText,
        attachments: submissionFile ? [submissionFile.url] : [],
      }

      await updateDoc(doc(db, "assignments", selectedAssignment.id), {
        [`submissions.${userProfile.uid}`]: submissionData,
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

  const handleSubmissionUpload = (url: string, filename: string) => {
    setSubmissionFile({ url, filename })
    toast({
      title: "File Uploaded",
      description: `${filename} uploaded successfully to Cloudinary`,
    })
  }

  if (loading) {
    return (
      <SidebarLayout role="student">
        <div className="p-6 flex items-center justify-center">
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
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Classroom Not Found</h1>
          <p className="text-gray-600">The classroom you're looking for doesn't exist.</p>
        </div>
      </SidebarLayout>
    )
  }

  // Calculate student progress
  const userSubmissions = assignments.filter((a) => a.submissions?.[userProfile?.uid || ""])
  const completedAssignments = userSubmissions.filter((a) => a.submissions[userProfile?.uid || ""].status === "graded")
  const pendingAssignments = assignments.filter((a) => !a.submissions?.[userProfile?.uid || ""])
  const overdueAssignments = pendingAssignments.filter((a) => {
    const dueDate = a.dueDate?.toDate?.() || new Date(a.dueDate)
    return dueDate < new Date()
  })

  const grades = completedAssignments
    .map((a) => a.submissions[userProfile?.uid || ""].grade)
    .filter((grade) => grade !== undefined) as number[]
  const averageGrade = grades.length > 0 ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0

  return (
    <SidebarLayout role="student">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
              <p className="text-gray-600">
                {classroom.subject} • {classroom.teacherName}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {classroom.meetLink && (
                <Button asChild>
                  <a href={classroom.meetLink} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-2" />
                    Join Class
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="content">Resources</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignments.length}</div>
                  <p className="text-xs text-muted-foreground">In this class</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{completedAssignments.length}</div>
                  <p className="text-xs text-muted-foreground">Assignments done</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{pendingAssignments.length}</div>
                  <p className="text-xs text-muted-foreground">To complete</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageGrade > 0 ? Math.round(averageGrade) : "--"}%</div>
                  <p className="text-xs text-muted-foreground">Overall performance</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
                <CardDescription>Track your completion and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Assignment Completion</span>
                    <span className="text-sm text-gray-600">
                      {assignments.length > 0
                        ? Math.round((completedAssignments.length / assignments.length) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={assignments.length > 0 ? (completedAssignments.length / assignments.length) * 100 : 0}
                  />
                </div>

                {overdueAssignments.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">
                        {overdueAssignments.length} overdue assignment{overdueAssignments.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">Please complete these assignments as soon as possible.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Assignments</CardTitle>
                <CardDescription>Assignments due soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingAssignments
                    .sort((a, b) => {
                      const dateA = a.dueDate?.toDate?.() || new Date(a.dueDate)
                      const dateB = b.dueDate?.toDate?.() || new Date(b.dueDate)
                      return dateA.getTime() - dateB.getTime()
                    })
                    .slice(0, 5)
                    .map((assignment) => {
                      const dueDate = assignment.dueDate?.toDate?.() || new Date(assignment.dueDate)
                      const isOverdue = dueDate < new Date()

                      return (
                        <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                              <p className="text-sm text-gray-500">Due: {formatDateTime(assignment.dueDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                            <Badge variant="outline">{assignment.totalPoints} pts</Badge>
                            <Button size="sm" onClick={() => setSelectedAssignment(assignment)}>
                              Submit
                            </Button>
                          </div>
                        </div>
                      )
                    })}

                  {pendingAssignments.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <p className="text-gray-500">All assignments completed! Great work!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const userSubmission = assignment.submissions?.[userProfile?.uid || ""]
                const dueDate = assignment.dueDate?.toDate?.() || new Date(assignment.dueDate)
                const isOverdue = dueDate < new Date() && !userSubmission

                return (
                  <Card key={assignment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-lg">{assignment.title}</h4>
                            <Badge variant="outline">{assignment.totalPoints} points</Badge>
                            {userSubmission && (
                              <Badge
                                variant={
                                  userSubmission.status === "graded"
                                    ? "default"
                                    : userSubmission.status === "submitted"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {userSubmission.status === "graded"
                                  ? "Graded"
                                  : userSubmission.status === "submitted"
                                    ? "Submitted"
                                    : "Draft"}
                              </Badge>
                            )}
                            {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                          </div>
                          <p className="text-gray-600 mb-3">{assignment.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Due: {formatDateTime(assignment.dueDate)}
                            </span>
                            {userSubmission?.grade !== undefined && (
                              <span className="flex items-center">
                                <Award className="h-4 w-4 mr-1" />
                                Grade: {userSubmission.grade}/{assignment.totalPoints}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {assignment.attachments && assignment.attachments.length > 0 && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={assignment.attachments[0]} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          )}
                          {!userSubmission && (
                            <Button size="sm" onClick={() => setSelectedAssignment(assignment)}>
                              Submit
                            </Button>
                          )}
                          {userSubmission && userSubmission.status !== "graded" && (
                            <Button size="sm" variant="outline" onClick={() => setSelectedAssignment(assignment)}>
                              Edit Submission
                            </Button>
                          )}
                        </div>
                      </div>

                      {userSubmission && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <h5 className="font-medium mb-2">Your Submission</h5>
                          <p className="text-sm text-gray-600 mb-2">{userSubmission.content}</p>
                          <p className="text-xs text-gray-500">
                            Submitted: {formatDateTime(userSubmission.submittedAt)}
                          </p>
                          {userSubmission.attachments && userSubmission.attachments.length > 0 && (
                            <div className="mt-2">
                              <Button size="sm" variant="outline" asChild>
                                <a href={userSubmission.attachments[0]} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-3 w-3 mr-1" />
                                  View Attachment
                                </a>
                              </Button>
                            </div>
                          )}
                          {userSubmission.feedback && (
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <p className="text-sm font-medium text-blue-800">Teacher Feedback:</p>
                              <p className="text-sm text-blue-700">{userSubmission.feedback}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}

              {assignments.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                  <p className="text-gray-500">Your teacher hasn't posted any assignments yet.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        {item.type === "pdf" && <FileText className="h-5 w-5 text-green-600" />}
                        {item.type === "image" && <BookOpen className="h-5 w-5 text-green-600" />}
                        {item.type === "video" && <Video className="h-5 w-5 text-green-600" />}
                        {item.type === "link" && <BookOpen className="h-5 w-5 text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-gray-500">{item.topic}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(item.uploadedAt)}</p>
                        {CloudinaryService.isImageFile(item.url) && (
                          <img
                            src={
                              CloudinaryService.getOptimizedUrl(item.url, {
                                width: 200,
                                height: 150 || "/placeholder.svg",
                              }) || "/placeholder.svg"
                            }
                            alt={item.title}
                            className="mt-2 rounded border max-w-full h-auto"
                          />
                        )}
                        <Button size="sm" className="mt-2" asChild>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" />
                            {item.type === "link" ? "Visit" : "Download"}
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {content.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
                  <p className="text-gray-500">Your teacher hasn't uploaded any learning materials yet.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Grade Summary</CardTitle>
                <CardDescription>Your performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{completedAssignments.length}</div>
                    <p className="text-sm text-gray-500">Graded Assignments</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {averageGrade > 0 ? Math.round(averageGrade) : "--"}%
                    </div>
                    <p className="text-sm text-gray-500">Average Grade</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {grades.reduce((sum, grade) => sum + grade, 0)}
                    </div>
                    <p className="text-sm text-gray-500">Total Points Earned</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {completedAssignments.map((assignment) => {
                    const submission = assignment.submissions[userProfile?.uid || ""]
                    const percentage = ((submission.grade || 0) / assignment.totalPoints) * 100

                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{assignment.title}</h4>
                          <p className="text-sm text-gray-500">Submitted: {formatDate(submission.submittedAt)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {submission.grade}/{assignment.totalPoints}
                          </div>
                          <div
                            className={`text-sm ${
                              percentage >= 90
                                ? "text-green-600"
                                : percentage >= 80
                                  ? "text-blue-600"
                                  : percentage >= 70
                                    ? "text-yellow-600"
                                    : "text-red-600"
                            }`}
                          >
                            {Math.round(percentage)}%
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {completedAssignments.length === 0 && (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No grades yet</p>
                      <p className="text-sm text-gray-400">Complete assignments to see your grades here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assignment Submission Dialog */}
        <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Assignment: {selectedAssignment?.title}</DialogTitle>
              <DialogDescription>Complete your assignment submission below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="submission">Your Response</Label>
                <Textarea
                  id="submission"
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Type your assignment response here..."
                  rows={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Attachment (Optional)</Label>
                <FileUpload
                  onUploadComplete={(url, filename, publicId) => {
                    setSubmissionFile({ url, filename })
                  }}
                  acceptedTypes={["application/pdf", ".doc", ".docx", ".txt", "image/*"]}
                  maxSizeMB={10}
                  disabled={submitting}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedAssignment(null)}
                  disabled={submitting}
                >
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
    </SidebarLayout>
  )
}
