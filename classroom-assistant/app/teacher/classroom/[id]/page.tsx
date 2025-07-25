"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Classroom, Assignment, Content, StudentAnalytics } from "@/lib/types"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UploadThingFileUpload } from "@/components/ui/uploadthing-file-upload"
import { StudentCard } from "@/components/ui/student-card"
import { UploadThingService } from "@/lib/uploadthing-service"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  BookOpen,
  FileText,
  Plus,
  Download,
  Trash2,
  Edit,
  Copy,
  Calendar,
  TrendingUp,
  Award,
  Target,
  Video,
  ExternalLink,
  Brain,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { UploadThingPDFViewer } from "@/components/ui/uploadthing-pdf-viewer"
import { VisualAidGenerator } from "@/components/ui/visual-aid-generator"
import ClassroomPlanningAgent from "@/components/agents/classroom-planning-agent"

// Helper to format dates from Firestore Timestamp or native Date
const formatDate = (d: Timestamp | Date): string => {
  const dateObj = (d as any)?.toDate ? (d as any).toDate() : (d as Date)
  return dateObj.toLocaleDateString()
}

export default function TeacherClassroomPage() {
  const params = useParams()
  const classroomId = params.id as string
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [content, setContent] = useState<Content[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Form states
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: "",
    totalPoints: 100,
  })
  const [newContent, setNewContent] = useState({
    title: "",
    topic: "",
    type: "pdf" as "pdf" | "image" | "video" | "link",
    url: "",
  })
  const [assignmentFile, setAssignmentFile] = useState<{ url: string; filename: string } | null>(null)

  // Dialog states
  const [showAddAssignment, setShowAddAssignment] = useState(false)
  const [showAddContent, setShowAddContent] = useState(false)
  const [showAIPlanning, setShowAIPlanning] = useState(false)
  const [showWorksheetGenerator, setShowWorksheetGenerator] = useState(false)

  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string } | null>(null)

  const openPdfViewer = (url: string, title: string) => {
    setSelectedPdf({ url, title })
    setShowPdfViewer(true)
  }

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

    // Fetch students and analytics
    const studentsQuery = query(collection(db, "users"), where("role", "==", "student"))
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const studentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setStudents(studentData)
    })

    return () => {
      unsubscribeClassroom()
      unsubscribeAssignments()
      unsubscribeContent()
      unsubscribeStudents()
    }
  }, [classroomId])

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !classroom) return

    try {
      await addDoc(collection(db, "assignments"), {
        classroomId: classroom.id,
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: new Date(newAssignment.dueDate),
        totalPoints: newAssignment.totalPoints,
        attachments: assignmentFile ? [assignmentFile.url] : [],
        submissions: {},
        createdAt: new Date(),
      })

      setNewAssignment({ title: "", description: "", dueDate: "", totalPoints: 100 })
      setAssignmentFile(null)
      setShowAddAssignment(false)

      toast({
        title: "Assignment Created",
        description: "Your assignment has been created successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !classroom) return

    try {
      await addDoc(collection(db, "content"), {
        classroomId: classroom.id,
        title: newContent.title,
        type: newContent.type,
        topic: newContent.topic,
        url: newContent.url,
        uploadedAt: new Date(),
        uploadedBy: userProfile.uid,
      })

      setNewContent({ title: "", topic: "", type: "pdf", url: "" })
      setShowAddContent(false)

      toast({
        title: "Content Added",
        description: "Your content has been uploaded successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleContentUpload = (url: string, filename: string, key: string) => {
    setNewContent((prev) => ({ ...prev, url }))
    toast({
      title: "File Uploaded",
      description: `${filename} uploaded successfully to UploadThing`,
    })
  }

  const handleAssignmentUpload = (url: string, filename: string, key: string) => {
    setAssignmentFile({ url, filename })
    toast({
      title: "Attachment Uploaded",
      description: `${filename} uploaded successfully to UploadThing`,
    })
  }

  const copyInviteCode = () => {
    if (classroom?.inviteCode) {
      navigator.clipboard.writeText(classroom.inviteCode)
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      })
    }
  }

  const removeStudent = async (studentId: string) => {
    if (!classroom) return

    try {
      const updatedStudents = classroom.students.filter((id) => id !== studentId)
      await updateDoc(doc(db, "classrooms", classroom.id), {
        students: updatedStudents,
      })

      toast({
        title: "Student Removed",
        description: "Student has been removed from the classroom",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const deleteAssignment = async (assignmentId: string) => {
    try {
      await deleteDoc(doc(db, "assignments", assignmentId))
      toast({
        title: "Assignment Deleted",
        description: "Assignment has been deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const deleteContent = async (contentId: string) => {
    try {
      await deleteDoc(doc(db, "content", contentId))
      toast({
        title: "Content Deleted",
        description: "Content has been deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Generate mock analytics data
  const generateAnalytics = () => {
    const topics = ["Algebra", "Geometry", "Statistics", "Calculus", "Trigonometry"]
    const performanceData = topics.map((topic) => ({
      topic,
      average: Math.floor(Math.random() * 40) + 60,
      submissions: Math.floor(Math.random() * 20) + 10,
    }))

    const gradeDistribution = [
      { grade: "A", count: Math.floor(Math.random() * 10) + 5, color: "#22c55e" },
      { grade: "B", count: Math.floor(Math.random() * 15) + 8, color: "#3b82f6" },
      { grade: "C", count: Math.floor(Math.random() * 12) + 6, color: "#f59e0b" },
      { grade: "D", count: Math.floor(Math.random() * 8) + 3, color: "#ef4444" },
      { grade: "F", count: Math.floor(Math.random() * 5) + 1, color: "#6b7280" },
    ]

    return { performanceData, gradeDistribution }
  }

  if (loading) {
    return (
      <SidebarLayout role="teacher">
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
      <SidebarLayout role="teacher">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Classroom Not Found</h1>
            <p className="text-gray-600">The classroom you're looking for doesn't exist.</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  const classroomStudents = students.filter((student) => classroom.students.includes(student.id))
  const { performanceData, gradeDistribution } = generateAnalytics()

  return (
    <SidebarLayout role="teacher">
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
                <Badge variant="outline" className="cursor-pointer hover:bg-gray-50" onClick={copyInviteCode}>
                  <Copy className="h-3 w-3 mr-1" />
                  {classroom.inviteCode}
                </Badge>
                <Button onClick={() => setShowAIPlanning(true)}>
                  <Target className="h-4 w-4 mr-2" />
                  AI Planning
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="visual-aids">Visual Aids</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Created</Label>
                      <p className="text-sm text-gray-600 mt-1">{formatDate(classroom.createdAt)}</p>
                    </div>
                    {classroom.curriculumUrl && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Curriculum</Label>
                        <Button size="sm" variant="outline" className="mt-2 w-full bg-transparent" asChild>
                          <a href={classroom.curriculumUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-2" />
                            View Curriculum PDF
                          </a>
                        </Button>
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
                      Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm font-medium text-gray-700">Curriculum Progress</Label>
                        <span className="text-sm text-gray-600">{Math.round(classroom.curriculumProgress)}%</span>
                      </div>
                      <Progress value={classroom.curriculumProgress} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{assignments.length}</p>
                        <p className="text-xs text-gray-600">Assignments</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{content.length}</p>
                        <p className="text-xs text-gray-600">Resources</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="h-5 w-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                      onClick={() => setShowAddAssignment(true)}
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-sm">New Assignment</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                      onClick={() => setShowAddContent(true)}
                    >
                      <BookOpen className="h-5 w-5" />
                      <span className="text-sm">Upload Content</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                      onClick={() => setShowWorksheetGenerator(true)}
                    >
                      <FileText className="h-5 w-5" />
                      <span className="text-sm">AI Worksheet</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                      onClick={() => setShowAIPlanning(true)}
                    >
                      <Target className="h-5 w-5" />
                      <span className="text-sm">Lesson Planner</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest assignments and submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignments.slice(0, 5).map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{assignment.title}</h3>
                            <p className="text-sm text-gray-500">Due: {formatDate(assignment.dueDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            {Object.keys(assignment.submissions || {}).length} submissions
                          </Badge>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                    {assignments.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No assignments yet</p>
                        <Button onClick={() => setShowAddAssignment(true)}>Create First Assignment</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* People Tab */}
            <TabsContent value="people" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-semibold">Students ({classroomStudents.length})</h3>
                <Badge variant="outline" className="cursor-pointer hover:bg-gray-50 w-fit" onClick={copyInviteCode}>
                  <Copy className="h-3 w-3 mr-1" />
                  Invite Code: {classroom.inviteCode}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {classroomStudents.map((student) => {
                  // Generate mock student data
                  const studentData = {
                    id: student.id,
                    displayName: student.displayName,
                    email: student.email,
                    photoURL: student.photoURL,
                    joinedAt: student.createdAt?.toDate?.() || new Date(student.createdAt),
                    stats: {
                      assignmentsCompleted: Math.floor(Math.random() * 15) + 5,
                      assignmentsPending: Math.floor(Math.random() * 5),
                      assignmentsOverdue: Math.floor(Math.random() * 3),
                      averageScore: Math.floor(Math.random() * 30) + 70,
                      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                      streak: Math.floor(Math.random() * 10),
                    },
                    recentGrades: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
                      assignmentTitle: `Assignment ${i + 1}`,
                      score: Math.floor(Math.random() * 30) + 70,
                      maxScore: 100,
                      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                    })),
                  }

                  return (
                    <StudentCard
                      key={student.id}
                      student={studentData}
                      onRemove={removeStudent}
                      showRemoveButton={true}
                    />
                  )
                })}
              </div>

              {classroomStudents.length === 0 && (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                  <p className="text-gray-500 mb-6">Share the invite code with your students to get started</p>
                  <Button onClick={copyInviteCode}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Invite Code
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-semibold">Learning Resources</h3>
                <Button onClick={() => setShowAddContent(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {content.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                            {item.type === "pdf" && <FileText className="h-6 w-6 text-green-600" />}
                            {item.type === "image" && <BookOpen className="h-6 w-6 text-green-600" />}
                            {item.type === "video" && <Video className="h-6 w-6 text-green-600" />}
                            {item.type === "link" && <BookOpen className="h-6 w-6 text-green-600" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">{item.title}</h4>
                            <p className="text-sm text-gray-500">{item.topic}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDate(item.uploadedAt)}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => deleteContent(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {UploadThingService.isImageFile(item.url) && (
                        <img
                          src={item.url || "/placeholder.svg"}
                          alt={item.title}
                          className="w-full h-32 object-cover rounded-lg mb-4"
                        />
                      )}

                      {UploadThingService.isPdfFile(item.url) && (
                        <div className="mb-4 p-4 border rounded-lg bg-red-50 text-center">
                          <FileText className="h-8 w-8 text-red-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-700 font-medium">PDF Document</p>
                          <p className="text-xs text-gray-500 mb-3">{item.title}</p>
                          <Button size="sm" variant="outline" onClick={() => openPdfViewer(item.url, item.title)}>
                            <FileText className="h-3 w-3 mr-1" />
                            Preview PDF
                          </Button>
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                    <p className="text-gray-500 mb-6">Upload learning materials for your students</p>
                    <Button onClick={() => setShowAddContent(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Content
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-semibold">Assignments</h3>
                <Button onClick={() => setShowAddAssignment(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </div>

              <div className="space-y-6">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <h4 className="font-medium text-xl">{assignment.title}</h4>
                            <Badge variant="outline">{assignment.totalPoints} points</Badge>
                          </div>
                          <p className="text-gray-600 mb-4">{assignment.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Due: {formatDate(assignment.dueDate)}
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {Object.keys(assignment.submissions || {}).length} submissions
                            </span>
                          </div>
                          {assignment.attachments && assignment.attachments.length > 0 && assignment.attachments[0] && (
                            <div className="mt-4">
                              {UploadThingService.isPdfFile(assignment.attachments[0] as string) ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (assignment.attachments[0]) {
                                        openPdfViewer(assignment.attachments[0], `${assignment.title} - Attachment`);
                                      }
                                    }}
                                  >
                                    <FileText className="h-3 w-3 mr-2" />
                                    Preview PDF
                                    Preview PDF
                                  </Button>
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={assignment.attachments[0]} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3 w-3 mr-2" />
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
                                      <Download className="h-3 w-3 mr-2" />
                                      Download
                                    </a>
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={assignment.attachments[0]} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-3 w-3 mr-2" />
                                    View Attachment
                                  </a>
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteAssignment(assignment.id)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {assignments.length === 0 && (
                  <div className="text-center py-16">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                    <p className="text-gray-500 mb-6">Create assignments to track student progress</p>
                    <Button onClick={() => setShowAddAssignment(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Assignment
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Visual Aids Tab */}
            <TabsContent value="visual-aids" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">Visual Aid Generator</h3>
                  <p className="text-gray-600">Create educational diagrams and visual aids for your students</p>
                </div>
                <Badge variant="outline" className="w-fit">
                  <Brain className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </div>

              <VisualAidGenerator />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Topic</CardTitle>
                    <CardDescription>Average scores across different topics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="topic" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="average" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Grade Distribution</CardTitle>
                    <CardDescription>Overall grade distribution in the class</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={gradeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ grade, count }) => `${grade}: ${count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {gradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Class Average
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {Math.round(
                        performanceData.reduce((sum, item) => sum + item.average, 0) / performanceData.length,
                      )}
                      %
                    </div>
                    <p className="text-sm text-gray-500">Overall performance</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Award className="h-5 w-5 mr-2" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {gradeDistribution.find((g) => g.grade === "A")?.count || 0}
                    </div>
                    <p className="text-sm text-gray-500">Students with A grades</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Target className="h-5 w-5 mr-2" />
                      Needs Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-4xl font-bold text-red-600 mb-2">
                      {(gradeDistribution.find((g) => g.grade === "D")?.count || 0) +
                        (gradeDistribution.find((g) => g.grade === "F")?.count || 0)}
                    </div>
                    <p className="text-sm text-gray-500">Students needing help</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Add Assignment Dialog */}
          <Dialog open={showAddAssignment} onOpenChange={setShowAddAssignment}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>Add a new assignment for your students</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAssignment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Assignment Title</Label>
                    <Input
                      id="title"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      placeholder="Enter assignment title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points">Total Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={newAssignment.totalPoints}
                      onChange={(e) =>
                        setNewAssignment({ ...newAssignment, totalPoints: Number.parseInt(e.target.value) })
                      }
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    placeholder="Describe the assignment requirements"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Attachment (Optional)</Label>
                  <UploadThingFileUpload
                    onUploadComplete={handleAssignmentUpload}
                    acceptedTypes={["application/pdf", ".doc", ".docx", ".txt"]}
                    maxSizeMB={10}
                    disabled={isLoading}
                  />
                  {assignmentFile && (
                    <div className="text-sm text-green-600">✓ {assignmentFile.filename} uploaded successfully</div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddAssignment(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Assignment</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Content Dialog */}
          <Dialog open={showAddContent} onOpenChange={setShowAddContent}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Learning Content</DialogTitle>
                <DialogDescription>Upload or link to learning materials</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddContent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contentTitle">Title</Label>
                    <Input
                      id="contentTitle"
                      value={newContent.title}
                      onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                      placeholder="Enter content title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      value={newContent.topic}
                      onChange={(e) => setNewContent({ ...newContent, topic: e.target.value })}
                      placeholder="e.g., Chapter 1, Algebra"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select
                    value={newContent.type}
                    onValueChange={(value: "pdf" | "image" | "video" | "link") =>
                      setNewContent({ ...newContent, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newContent.type === "link" ? (
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      type="url"
                      value={newContent.url}
                      onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <UploadThingFileUpload
                      onUploadComplete={handleContentUpload}
                      acceptedTypes={
                        newContent.type === "pdf"
                          ? ["application/pdf"]
                          : newContent.type === "image"
                            ? ["image/*"]
                            : ["video/*"]
                      }
                      maxSizeMB={50}
                      disabled={isLoading}
                    />
                    {newContent.url && <div className="text-sm text-green-600">✓ File uploaded successfully</div>}
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddContent(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!newContent.url && newContent.type !== "link"}>
                    Add Content
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* AI Planning Dialog */}
              <ClassroomPlanningAgent showAIPlanning={showAIPlanning} setShowAIPlanning={setShowAIPlanning} classroomId={classroomId} />

          {/* AI Worksheet Generator Dialog */}
          <Dialog open={showWorksheetGenerator} onOpenChange={setShowWorksheetGenerator}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI Worksheet Generator</DialogTitle>
                <DialogDescription>Create custom worksheets and practice problems</DialogDescription>
              </DialogHeader>
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-4">AI Worksheet Generator</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Generate custom worksheets, practice problems, and assessments tailored to your curriculum and student
                  level.
                </p>
                <Badge variant="secondary" className="text-sm">
                  Coming Soon
                </Badge>
              </div>
            </DialogContent>
          </Dialog>

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
        </div>
      </div>
    </SidebarLayout>
  )
}
