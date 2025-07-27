"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UploadThingFileUpload } from "@/components/ui/uploadthing-file-upload"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  BookOpen,
  FileText,
  Plus,
  Copy,
  Calendar,
  TrendingUp,
  Award,
  Target,
  Video,
  Brain,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Eye,
  X,
  Send,
  Paperclip,
  MessageSquare,
  Settings,
  Upload,
  MoreVertical,
  Presentation,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"
import { UploadThingPDFViewer } from "@/components/ui/uploadthing-pdf-viewer"
import { VisualAidGenerator } from "@/components/ui/visual-aid-generator"
import { AssignmentsTab } from "@/components/assignments-tab"
import { ContentTab } from "@/components/content/content-tab"
import ClassroomPlanningAgent from "@/components/agents/classroom-planning-agent"

// Helper to format dates from Firestore Timestamp or native Date
const formatDate = (d: Timestamp | Date): string => {
  const dateObj = (d as any)?.toDate ? (d as any).toDate() : (d as Date)
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const formatTime = (d: Timestamp | Date): string => {
  const dateObj = (d as any)?.toDate ? (d as any).toDate() : (d as Date)
  return dateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export default function TeacherClassroomPage() {
  const params = useParams()
  const router = useRouter()
  const classroomId = params.cid as string
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [content, setContent] = useState<Content[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Stream/Feed states
  const [streamPosts, setStreamPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState("")
  const [postAttachment, setPostAttachment] = useState<{ url: string; filename: string } | null>(null)
  const [showPostDialog, setShowPostDialog] = useState(false)

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

    // Fetch stream posts
    const streamQuery = query(collection(db, "stream_posts"), where("classroomId", "==", classroomId))
    const unsubscribeStream = onSnapshot(streamQuery, (snapshot) => {
      const posts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setStreamPosts(posts.sort((a, b) => b.createdAt?.toDate?.()?.getTime() - a.createdAt?.toDate?.()?.getTime()))
    })

    return () => {
      unsubscribeClassroom()
      unsubscribeAssignments()
      unsubscribeContent()
      unsubscribeStudents()
      unsubscribeStream()
    }
  }, [classroomId])

  const handlePostToStream = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !classroom || !newPost.trim()) return

    try {
      await addDoc(collection(db, "stream_posts"), {
        classroomId: classroom.id,
        content: newPost.trim(),
        attachments: postAttachment ? [postAttachment.url] : [],
        authorId: userProfile.uid,
        authorName: userProfile.displayName,
        authorRole: "teacher",
        createdAt: new Date(),
        type: "announcement",
      })

      setNewPost("")
      setPostAttachment(null)
      setShowPostDialog(false)

      toast({
        title: "Posted to Stream",
        description: "Your announcement has been posted successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !classroom) return

    try {
      const assignmentDoc = await addDoc(collection(db, "assignments"), {
        classroomId: classroom.id,
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: new Date(newAssignment.dueDate),
        totalPoints: newAssignment.totalPoints,
        attachments: assignmentFile ? [assignmentFile.url] : [],
        submissions: {},
        createdAt: new Date(),
      })

      // Also post to stream
      await addDoc(collection(db, "stream_posts"), {
        classroomId: classroom.id,
        content: `New assignment posted: ${newAssignment.title}`,
        authorId: userProfile.uid,
        authorName: userProfile.displayName,
        authorRole: "teacher",
        createdAt: new Date(),
        type: "assignment",
        relatedId: assignmentDoc.id,
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
      const contentDoc = await addDoc(collection(db, "content"), {
        classroomId: classroom.id,
        title: newContent.title,
        type: newContent.type,
        topic: newContent.topic,
        url: newContent.url,
        uploadedAt: new Date(),
        uploadedBy: userProfile.uid,
      })

      // Also post to stream
      await addDoc(collection(db, "stream_posts"), {
        classroomId: classroom.id,
        content: `New material uploaded: ${newContent.title}`,
        authorId: userProfile.uid,
        authorName: userProfile.displayName,
        authorRole: "teacher",
        createdAt: new Date(),
        type: "material",
        relatedId: contentDoc.id,
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

  const handlePostUpload = (url: string, filename: string, key: string) => {
    setPostAttachment({ url, filename })
    toast({
      title: "Attachment Uploaded",
      description: `${filename} uploaded successfully`,
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
      { grade: "A", count: Math.floor(Math.random() * 10) + 5, color: "#10b981" },
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
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-600 font-medium">Loading classroom...</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  if (!classroom) {
    return (
      <SidebarLayout role="teacher">
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto" />
            <h1 className="text-2xl font-semibold text-slate-900">Classroom Not Found</h1>
            <p className="text-slate-600">The classroom you're looking for doesn't exist.</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  const classroomStudents = students.filter((student) => classroom.students.includes(student.id))
  const { performanceData, gradeDistribution } = generateAnalytics()

  return (
    <SidebarLayout role="teacher">
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white border-b border-slate-200 px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{classroom.name}</h1>
                <div className="flex items-center gap-4 text-slate-600">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {classroom.subject}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {classroom.students.length} students
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyInviteCode}
                    className="font-mono text-xs hover:bg-slate-100"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    {classroom.inviteCode}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/teacher/classroom/${classroomId}/settings`)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button onClick={() => setShowAddContent(true)} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Material
                </Button>
                <Button onClick={() => setShowAIPlanning(true)} className="bg-slate-900 hover:bg-slate-800">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Planning
                </Button>
                {classroom.meetLink && (
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <a href={classroom.meetLink} target="_blank" rel="noopener noreferrer">
                      <Video className="w-4 h-4 mr-2" />
                      Start Live
                    </a>
                  </Button>
                )}
                <Button onClick={() => router.push(`/teacher/classroom/${classroomId}/presentation`)} className="bg-slate-900 hover:bg-slate-800">
                  <Presentation className="w-4 h-4 mr-2" />
                  AI PPT Generator
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border-b border-slate-200 px-6">
            <Tabs defaultValue="stream" className="w-full">
              <TabsList className="grid w-full grid-cols-7 bg-transparent h-auto p-0 border-0">
                <TabsTrigger
                  value="stream"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none py-4 px-4 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  📝 Stream
                </TabsTrigger>
                <TabsTrigger
                  value="assignments"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none py-4 px-4 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  📚 Assignments
                </TabsTrigger>
                <TabsTrigger
                  value="tests"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none py-4 px-4 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  🧪 Tests
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none py-4 px-4 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  📊 Results
                </TabsTrigger>
                <TabsTrigger
                  value="students"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none py-4 px-4 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  👨‍🎓 Students
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none py-4 px-4 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  📁 Resources
                </TabsTrigger>
                <TabsTrigger
                  value="schedule"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none py-4 px-4 font-medium text-slate-600 data-[state=active]:text-slate-900"
                >
                  📅 Schedule
                </TabsTrigger>
              </TabsList>

              {/* Stream Tab - Google Classroom Style Feed */}
              <TabsContent value="stream" className="mt-0 p-6 space-y-6">
                {/* Post Input */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        {userProfile?.photoURL ? (
                          <img
                            src={userProfile.photoURL || "/placeholder.svg"}
                            alt={userProfile.displayName || "Teacher"}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-slate-600">
                            {userProfile?.displayName?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full justify-start text-slate-500 bg-slate-50 hover:bg-slate-100"
                          onClick={() => setShowPostDialog(true)}
                        >
                          Share something with your class...
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddAssignment(true)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Assignment
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/teacher/classroom/${classroomId}/tests/create`)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddContent(true)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Material
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Stream Posts */}
                <div className="space-y-4">
                  {streamPosts.map((post) => (
                    <Card key={post.id} className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-slate-600">
                              {post.authorName?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-slate-900">{post.authorName}</span>
                              <Badge variant="secondary" className="text-xs">
                                {post.authorRole}
                              </Badge>
                              <span className="text-sm text-slate-500">{formatTime(post.createdAt)}</span>
                            </div>
                            <p className="text-slate-700 mb-3">{post.content}</p>
                            {post.attachments && post.attachments.length > 0 && (
                              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                                <Paperclip className="w-4 h-4 text-slate-500" />
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={post.attachments[0]} target="_blank" rel="noopener noreferrer">
                                    View Attachment
                                  </a>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {streamPosts.length === 0 && (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No posts yet</h3>
                      <p className="text-slate-600 mb-4">
                        Share announcements, assignments, and materials with your class
                      </p>
                      <Button onClick={() => setShowPostDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Post
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Assignments Tab */}
              <TabsContent value="assignments" className="mt-0 p-6">
                <AssignmentsTab
                  assignments={assignments}
                  onShowAddAssignment={() => setShowAddAssignment(true)}
                  onDeleteAssignment={deleteAssignment}
                />
              </TabsContent>

              {/* Tests Tab */}
              <TabsContent value="tests" className="mt-0 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Test Generator</h2>
                    <p className="text-slate-600">Create and manage tests for your students</p>
                  </div>
                  <Button onClick={() => router.push(`/teacher/classroom/${classroomId}/tests/create`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Test
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">AI Test Generator</h3>
                      <p className="text-sm text-slate-600 mb-4">Create tests automatically using AI</p>
                      <Button
                        className="w-full"
                        onClick={() => router.push(`/teacher/classroom/${classroomId}/tests/create`)}
                      >
                        Generate Test
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">Manual Test</h3>
                      <p className="text-sm text-slate-600 mb-4">Create tests manually with custom questions</p>
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => router.push(`/teacher/classroom/${classroomId}/tests/create`)}
                      >
                        Create Manual
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Eye className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">View All Tests</h3>
                      <p className="text-sm text-slate-600 mb-4">Manage existing tests and view results</p>
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => router.push(`/teacher/classroom/${classroomId}/tests`)}
                      >
                        View Tests
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="mt-0 p-6 space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Analytics Dashboard</h2>
                  <p className="text-slate-600">Track student performance and engagement</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-green-900 mb-1">
                        {Math.round(
                          performanceData.reduce((sum, item) => sum + item.average, 0) / performanceData.length,
                        )}
                        %
                      </div>
                      <p className="text-sm text-green-700">Class Average</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-6 text-center">
                      <Award className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-blue-900 mb-1">
                        {gradeDistribution.find((g) => g.grade === "A")?.count || 0}
                      </div>
                      <p className="text-sm text-blue-700">Top Performers</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="p-6 text-center">
                      <Target className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-orange-900 mb-1">
                        {(gradeDistribution.find((g) => g.grade === "D")?.count || 0) +
                          (gradeDistribution.find((g) => g.grade === "F")?.count || 0)}
                      </div>
                      <p className="text-sm text-orange-700">Need Support</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <BarChart3 className="w-5 h-5" />
                        Performance by Topic
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Average scores across different topics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="topic"
                            tick={{ fontSize: 12, fill: "#64748b" }}
                            axisLine={{ stroke: "#e2e8f0" }}
                          />
                          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                          />
                          <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <PieChart className="w-5 h-5" />
                        Grade Distribution
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Overall grade distribution in the class
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
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
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="mt-0 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Students</h2>
                    <p className="text-slate-600">{classroomStudents.length} enrolled students</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={copyInviteCode} className="font-mono text-sm bg-transparent">
                      <Copy className="w-4 h-4 mr-2" />
                      Invite Code: {classroom.inviteCode}
                    </Button>
                    <Button variant="outline">
                      <Users className="w-4 h-4 mr-2" />
                      Add Students
                    </Button>
                  </div>
                </div>

                {classroomStudents.length > 0 ? (
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
                      }

                      return (
                        <Card key={student.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                                  {student.photoURL ? (
                                    <img
                                      src={student.photoURL || "/placeholder.svg"}
                                      alt={student.displayName}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-lg font-semibold text-slate-600">
                                      {student.displayName?.charAt(0)?.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-slate-900">{student.displayName}</h3>
                                  <p className="text-sm text-slate-600">{student.email}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeStudent(student.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-slate-600">Completed</p>
                                  <p className="font-semibold text-slate-900">
                                    {studentData.stats.assignmentsCompleted}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-600">Average</p>
                                  <p className="font-semibold text-slate-900">{studentData.stats.averageScore}%</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Last Active</span>
                                <span className="text-slate-900">{formatDate(studentData.stats.lastActive)}</span>
                              </div>

                              {studentData.stats.assignmentsPending > 0 && (
                                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                  <AlertCircle className="w-3 h-3" />
                                  {studentData.stats.assignmentsPending} pending assignments
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No students enrolled yet</h3>
                    <p className="text-slate-600 mb-6">Share the invite code with your students to get started</p>
                    <Button onClick={copyInviteCode}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Invite Code
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="mt-0 p-6 space-y-6">
                <ContentTab
                  content={content}
                  onShowAddContent={() => setShowAddContent(true)}
                  deleteContent={deleteContent}
                  userRole="teacher"
                  classroomId={classroomId}
                />

                {/* Visual Aid Generator Section */}
                <div className="mt-12">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">Visual Aid Generator</h2>
                      <p className="text-slate-600">Create educational diagrams and visual aids for your students</p>
                    </div>
                    <Badge variant="outline" className="w-fit bg-purple-50 text-purple-700 border-purple-200">
                      <Brain className="w-3 h-3 mr-1" />
                      AI Powered
                    </Badge>
                  </div>

                  <VisualAidGenerator />
                </div>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="mt-0 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Class Schedule</h2>
                    <p className="text-slate-600">Manage your class schedule and upcoming sessions</p>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Session
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Current Schedule */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900">Current Schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Days</Label>
                        <p className="text-sm text-slate-600 mt-1">
                          {classroom.schedule?.days?.join(", ") || "No schedule set"}
                        </p>
                      </div>
                      {classroom.schedule?.time && (
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Time</Label>
                          <p className="text-sm text-slate-600 mt-1">{classroom.schedule.time}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Duration</Label>
                        <p className="text-sm text-slate-600 mt-1">60 minutes</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Upcoming Sessions */}
                  <Card className="border-0 shadow-sm lg:col-span-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-slate-900">Upcoming Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Mock upcoming sessions */}
                        {[1, 2, 3].map((session) => (
                          <div
                            key={session}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900">
                                  {classroom.name} - Session {session}
                                </h4>
                                <p className="text-sm text-slate-600">
                                  {new Date(Date.now() + session * 24 * 60 * 60 * 1000).toLocaleDateString()} at{" "}
                                  {classroom.schedule?.time || "10:00 AM"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Scheduled</Badge>
                              {classroom.meetLink && (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={classroom.meetLink} target="_blank" rel="noopener noreferrer">
                                    <Video className="w-3 h-3 mr-1" />
                                    Join
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Modals */}
          {/* Post to Stream Dialog */}
          <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Share with your class</DialogTitle>
                <DialogDescription>Post an announcement or share materials with your students</DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePostToStream} className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share something with your class..."
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Attachment (Optional)</Label>
                  <UploadThingFileUpload
                    onUploadComplete={handlePostUpload}
                    acceptedTypes={["application/pdf", ".doc", ".docx", ".txt", "image/*"]}
                    maxSizeMB={10}
                    disabled={false}
                  />
                  {postAttachment && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      {postAttachment.filename} uploaded successfully
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowPostDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Assignment Dialog */}
          <Dialog open={showAddAssignment} onOpenChange={setShowAddAssignment}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Create New Assignment</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Add a new assignment for your students to complete
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAssignment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                      Assignment Title
                    </Label>
                    <Input
                      id="title"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      placeholder="Enter assignment title"
                      className="border-slate-300 focus:border-slate-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points" className="text-sm font-medium text-slate-700">
                      Total Points
                    </Label>
                    <Input
                      id="points"
                      type="number"
                      value={newAssignment.totalPoints}
                      onChange={(e) =>
                        setNewAssignment({ ...newAssignment, totalPoints: Number.parseInt(e.target.value) })
                      }
                      className="border-slate-300 focus:border-slate-500"
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    placeholder="Describe the assignment requirements and instructions"
                    className="border-slate-300 focus:border-slate-500"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm font-medium text-slate-700">
                    Due Date
                  </Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    className="border-slate-300 focus:border-slate-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Attachment (Optional)</Label>
                  <UploadThingFileUpload
                    onUploadComplete={handleAssignmentUpload}
                    acceptedTypes={["application/pdf", ".doc", ".docx", ".txt"]}
                    maxSizeMB={10}
                    disabled={isLoading}
                  />
                  {assignmentFile && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      {assignmentFile.filename} uploaded successfully
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddAssignment(false)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">
                    Create Assignment
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Content Dialog */}
          <Dialog open={showAddContent} onOpenChange={setShowAddContent}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Add Learning Content</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Upload or link to learning materials for your students
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddContent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contentTitle" className="text-sm font-medium text-slate-700">
                      Title
                    </Label>
                    <Input
                      id="contentTitle"
                      value={newContent.title}
                      onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                      placeholder="Enter content title"
                      className="border-slate-300 focus:border-slate-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic" className="text-sm font-medium text-slate-700">
                      Topic
                    </Label>
                    <Input
                      id="topic"
                      value={newContent.topic}
                      onChange={(e) => setNewContent({ ...newContent, topic: e.target.value })}
                      placeholder="e.g., Chapter 1, Algebra"
                      className="border-slate-300 focus:border-slate-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentType" className="text-sm font-medium text-slate-700">
                    Content Type
                  </Label>
                  <Select
                    value={newContent.type}
                    onValueChange={(value: "pdf" | "image" | "video" | "link") =>
                      setNewContent({ ...newContent, type: value })
                    }
                  >
                    <SelectTrigger className="border-slate-300 focus:border-slate-500">
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
                    <Label htmlFor="url" className="text-sm font-medium text-slate-700">
                      URL
                    </Label>
                    <Input
                      id="url"
                      type="url"
                      value={newContent.url}
                      onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                      placeholder="https://example.com"
                      className="border-slate-300 focus:border-slate-500"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Upload File</Label>
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
                    {newContent.url && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        File uploaded successfully
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddContent(false)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!newContent.url && newContent.type !== "link"}
                    className="bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-400"
                  >
                    Add Content
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* AI Planning Dialog */}
          <ClassroomPlanningAgent
            showAIPlanning={showAIPlanning}
            setShowAIPlanning={setShowAIPlanning}
            classroomId={classroomId}
          />

          {/* PDF Viewer Dialog */}
          <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
            <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
              <DialogHeader className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-semibold text-slate-900">
                      {selectedPdf?.title || "PDF Viewer"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                      View and interact with the document
                    </DialogDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPdfViewer(false)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </DialogHeader>
              <div className="h-[80vh] overflow-auto">
                {selectedPdf && <UploadThingPDFViewer url={selectedPdf.url} title={selectedPdf.title} />}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SidebarLayout>
  )
}
