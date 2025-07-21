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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  BookOpen,
  FileText,
  BarChart3,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit,
  Copy,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Target,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

// --- helper to print a readable date from Firestore Timestamp OR native Date ---
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
  const [contentFile, setContentFile] = useState<File | null>(null)
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null)

  // Dialog states
  const [showAddAssignment, setShowAddAssignment] = useState(false)
  const [showAddContent, setShowAddContent] = useState(false)
  const [showAIPlanning, setShowAIPlanning] = useState(false)
  const [showWorksheetGenerator, setShowWorksheetGenerator] = useState(false)

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
      let attachmentUrl = ""
      if (assignmentFile) {
        const fileRef = ref(storage, `assignments/${Date.now()}_${assignmentFile.name}`)
        await uploadBytes(fileRef, assignmentFile)
        attachmentUrl = await getDownloadURL(fileRef)
      }

      await addDoc(collection(db, "assignments"), {
        classroomId: classroom.id,
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: new Date(newAssignment.dueDate),
        totalPoints: newAssignment.totalPoints,
        attachments: attachmentUrl ? [attachmentUrl] : [],
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
      let contentUrl = newContent.url

      if (contentFile) {
        const fileRef = ref(storage, `content/${Date.now()}_${contentFile.name}`)
        await uploadBytes(fileRef, contentFile)
        contentUrl = await getDownloadURL(fileRef)
      }

      await addDoc(collection(db, "content"), {
        classroomId: classroom.id,
        title: newContent.title,
        type: newContent.type,
        topic: newContent.topic,
        url: contentUrl,
        uploadedAt: new Date(),
        uploadedBy: userProfile.uid,
      })

      setNewContent({ title: "", topic: "", type: "pdf", url: "" })
      setContentFile(null)
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
      <SidebarLayout role="teacher">
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Classroom Not Found</h1>
          <p className="text-gray-600">The classroom you're looking for doesn't exist.</p>
        </div>
      </SidebarLayout>
    )
  }

  const classroomStudents = students.filter((student) => classroom.students.includes(student.id))
  const { performanceData, gradeDistribution } = generateAnalytics()

  return (
    <SidebarLayout role="teacher">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
              <p className="text-gray-600">
                {classroom.subject} • {classroom.students.length} students
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="cursor-pointer" onClick={copyInviteCode}>
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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Classroom Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-gray-600 mt-1">{classroom.description || "No description provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Schedule</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {classroom.schedule.days.join(", ")} at {classroom.schedule.time || "No time set"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-gray-600 mt-1">{formatDate(classroom.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm font-medium">Curriculum Progress</Label>
                      <span className="text-sm text-gray-600">{Math.round(classroom.curriculumProgress)}%</span>
                    </div>
                    <Progress value={classroom.curriculumProgress} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{assignments.length}</p>
                      <p className="text-xs text-gray-500">Assignments</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{content.length}</p>
                      <p className="text-xs text-gray-500">Resources</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => setShowAddAssignment(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Assignment
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => setShowAddContent(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Content
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => setShowWorksheetGenerator(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Worksheet
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest assignments and submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.slice(0, 5).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No assignments yet</p>
                      <Button className="mt-2" onClick={() => setShowAddAssignment(true)}>
                        Create First Assignment
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* People Tab */}
          <TabsContent value="people" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Students ({classroomStudents.length})</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="cursor-pointer" onClick={copyInviteCode}>
                  <Copy className="h-3 w-3 mr-1" />
                  Invite Code: {classroom.inviteCode}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classroomStudents.map((student) => (
                <Card key={student.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback>{student.displayName?.charAt(0) || "S"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{student.displayName}</h4>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => removeStudent(student.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-600">{Math.floor(Math.random() * 10) + 5}</p>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600">{Math.floor(Math.random() * 20) + 70}%</p>
                        <p className="text-xs text-gray-500">Avg Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {classroomStudents.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                  <p className="text-gray-500 mb-4">Share the invite code with your students</p>
                  <Button onClick={copyInviteCode}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Invite Code
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Learning Resources</h3>
              <Button onClick={() => setShowAddContent(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                          {item.type === "pdf" && <FileText className="h-5 w-5 text-green-600" />}
                          {item.type === "image" && <BookOpen className="h-5 w-5 text-green-600" />}
                          {item.type === "video" && <Clock className="h-5 w-5 text-green-600" />}
                          {item.type === "link" && <BookOpen className="h-5 w-5 text-green-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-500">{item.topic}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(item.uploadedAt)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline" asChild>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteContent(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {content.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                  <p className="text-gray-500 mb-4">Upload notes, PDFs, images, or video links</p>
                  <Button onClick={() => setShowAddContent(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Resource
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Assignments</h3>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowWorksheetGenerator(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  AI Generator
                </Button>
                <Button onClick={() => setShowAddAssignment(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Assignment
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{assignment.title}</h4>
                        <p className="text-gray-600 mt-1">{assignment.description}</p>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Due: {formatDate(assignment.dueDate)}
                          </span>
                          <span className="flex items-center">
                            <Award className="h-4 w-4 mr-1" />
                            {assignment.totalPoints} points
                          </span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {Object.keys(assignment.submissions || {}).length} submissions
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteAssignment(assignment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {assignment.attachments && assignment.attachments.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium">Attachments:</Label>
                        <div className="flex space-x-2 mt-1">
                          {assignment.attachments.map((url, index) => (
                            <Button key={index} size="sm" variant="outline" asChild>
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3 w-3 mr-1" />
                                File {index + 1}
                              </a>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {Object.keys(assignment.submissions || {}).length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <Label className="text-sm font-medium">Recent Submissions:</Label>
                        <div className="mt-2 space-y-2">
                          {Object.values(assignment.submissions || {})
                            .slice(0, 3)
                            .map((submission, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span>{submission.studentName}</span>
                                <div className="flex items-center space-x-2">
                                  <Badge
                                    variant={
                                      submission.status === "graded"
                                        ? "default"
                                        : submission.status === "submitted"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                  >
                                    {submission.status}
                                  </Badge>
                                  {submission.grade && (
                                    <span className="font-medium">
                                      {submission.grade}/{assignment.totalPoints}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {assignments.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                  <p className="text-gray-500 mb-4">Create your first assignment to get started</p>
                  <Button onClick={() => setShowAddAssignment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance by Topic */}
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

              {/* Grade Distribution */}
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
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ grade, count }) => `${grade}: ${count}`}
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

              {/* Class Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Class Statistics</CardTitle>
                  <CardDescription>Key metrics for your classroom</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{Math.floor(Math.random() * 20) + 75}%</p>
                      <p className="text-sm text-gray-500">Class Average</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{Math.floor(Math.random() * 10) + 85}%</p>
                      <p className="text-sm text-gray-500">Completion Rate</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{Math.floor(Math.random() * 5) + 3}</p>
                      <p className="text-sm text-gray-500">Avg Time (hrs)</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{Math.floor(Math.random() * 3) + 1}</p>
                      <p className="text-sm text-gray-500">Late Submissions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Students with highest scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {classroomStudents.slice(0, 5).map((student, index) => (
                      <div key={student.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{student.displayName}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{Math.floor(Math.random() * 20) + 80}%</p>
                          <p className="text-xs text-gray-500">Average</p>
                        </div>
                      </div>
                    ))}
                    {classroomStudents.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No students enrolled yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Assignment Dialog */}
        <Dialog open={showAddAssignment} onOpenChange={setShowAddAssignment}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>Add a new assignment for your students</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddAssignment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment((prev) => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPoints">Total Points</Label>
                <Input
                  id="totalPoints"
                  type="number"
                  value={newAssignment.totalPoints}
                  onChange={(e) =>
                    setNewAssignment((prev) => ({ ...prev, totalPoints: Number.parseInt(e.target.value) }))
                  }
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignmentFile">Attachment (optional)</Label>
                <Input
                  id="assignmentFile"
                  type="file"
                  onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex justify-end space-x-2">
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Learning Content</DialogTitle>
              <DialogDescription>Upload notes, PDFs, images, or add video links</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddContent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contentTitle">Title *</Label>
                <Input
                  id="contentTitle"
                  value={newContent.title}
                  onChange={(e) => setNewContent((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={newContent.topic}
                  onChange={(e) => setNewContent((prev) => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g., Algebra, Geometry"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contentType">Type</Label>
                <Select
                  value={newContent.type}
                  onValueChange={(value: "pdf" | "image" | "video" | "link") =>
                    setNewContent((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video Link</SelectItem>
                    <SelectItem value="link">Web Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newContent.type === "video" || newContent.type === "link" ? (
                <div className="space-y-2">
                  <Label htmlFor="contentUrl">URL *</Label>
                  <Input
                    id="contentUrl"
                    type="url"
                    value={newContent.url}
                    onChange={(e) => setNewContent((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="contentFile">File *</Label>
                  <Input
                    id="contentFile"
                    type="file"
                    accept={newContent.type === "pdf" ? ".pdf" : "image/*"}
                    onChange={(e) => setContentFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddContent(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Content</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* AI Planning Dialog */}
        <Dialog open={showAIPlanning} onOpenChange={setShowAIPlanning}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>AI Planning Agent</DialogTitle>
              <DialogDescription>
                Get AI-powered suggestions for curriculum planning and lesson organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Curriculum Analysis</h4>
                <p className="text-sm text-blue-800">
                  Based on your {classroom.subject} curriculum, I recommend focusing on the following areas:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                  <li>Strengthen foundational concepts with interactive exercises</li>
                  <li>Introduce advanced topics gradually with practical examples</li>
                  <li>Schedule regular assessments to track progress</li>
                  <li>Incorporate multimedia resources for visual learners</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Suggested Next Steps</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate practice worksheets for current topic
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Calendar className="h-4 w-4 mr-2" />
                    Create weekly lesson plan template
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analyze student performance patterns
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Worksheet Generator Dialog */}
        <Dialog open={showWorksheetGenerator} onOpenChange={setShowWorksheetGenerator}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>AI Worksheet Generator</DialogTitle>
              <DialogDescription>Generate custom worksheets using AI</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input placeholder="e.g., Linear Equations" />
              </div>
              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quantity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="15">15 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowWorksheetGenerator(false)}>
                  Cancel
                </Button>
                <Button>Generate Worksheet</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  )
}
