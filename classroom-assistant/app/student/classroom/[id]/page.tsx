"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { doc, onSnapshot, collection, query, where, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import type { Classroom, Assignment, Content } from "@/lib/types"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, FileText, MessageCircle, Download, Calendar, Clock, Award } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

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
  const [submissionText, setSubmissionText] = useState("")
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false)

  // AI Chat states
  const [showAIChat, setShowAIChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; content: string; sender: "user" | "ai" }>>([])
  const [chatInput, setChatInput] = useState("")

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

    try {
      let attachmentUrl = ""
      if (submissionFile) {
        const fileRef = ref(storage, `submissions/${Date.now()}_${submissionFile.name}`)
        await uploadBytes(fileRef, submissionFile)
        attachmentUrl = await getDownloadURL(fileRef)
      }

      const submission = {
        studentId: userProfile.uid,
        studentName: userProfile.displayName,
        submittedAt: new Date(),
        attachments: attachmentUrl ? [attachmentUrl] : [],
        text: submissionText,
        status: "submitted" as const,
      }

      await updateDoc(doc(db, "assignments", selectedAssignment.id), {
        [`submissions.${userProfile.uid}`]: submission,
      })

      setSubmissionText("")
      setSubmissionFile(null)
      setSelectedAssignment(null)
      setShowSubmissionDialog(false)

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
    }
  }

  const handleAIChat = async () => {
    if (!chatInput.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      content: chatInput,
      sender: "user" as const,
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(chatInput, classroom?.subject || ""),
        sender: "ai" as const,
      }
      setChatMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  const getAIResponse = (query: string, subject: string) => {
    const responses = [
      `Based on the ${subject} curriculum, here's what I can help you with: ${query}`,
      `Let me explain this ${subject} concept in simpler terms...`,
      `For this ${subject} topic, I recommend reviewing the uploaded materials first.`,
      `This is a common question in ${subject}. Here's a step-by-step approach...`,
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // Generate mock performance data
  const generatePerformanceData = () => {
    const topics = ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
    return topics.map((topic) => ({
      topic,
      score: Math.floor(Math.random() * 40) + 60,
      average: Math.floor(Math.random() * 30) + 70,
    }))
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

  const userAssignments = assignments.map((assignment) => ({
    ...assignment,
    userSubmission: assignment.submissions?.[userProfile?.uid || ""],
  }))

  const performanceData = generatePerformanceData()

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
            <Button onClick={() => setShowAIChat(true)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask Doubt
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="doubt">Ask Doubt</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Resources</CardTitle>
                <CardDescription>Materials shared by your teacher</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {content.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No content available yet</p>
                    </div>
                  ) : (
                    content.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              {item.type === "pdf" && <FileText className="h-5 w-5 text-blue-600" />}
                              {item.type === "image" && <BookOpen className="h-5 w-5 text-blue-600" />}
                              {item.type === "video" && <Clock className="h-5 w-5 text-blue-600" />}
                              {item.type === "link" && <BookOpen className="h-5 w-5 text-blue-600" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{item.title}</h4>
                              <p className="text-sm text-gray-500">{item.topic}</p>
                              <p className="text-xs text-gray-400 mt-1">{item.uploadedAt.toLocaleDateString()}</p>
                              <Button size="sm" variant="outline" className="mt-2 bg-transparent" asChild>
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-3 w-3 mr-1" />
                                  View
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="space-y-4">
              {userAssignments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No assignments yet</p>
                  </CardContent>
                </Card>
              ) : (
                userAssignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-lg">{assignment.title}</h4>
                            {assignment.userSubmission ? (
                              <Badge
                                variant={
                                  assignment.userSubmission.status === "graded"
                                    ? "default"
                                    : assignment.userSubmission.status === "submitted"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {assignment.userSubmission.status === "graded"
                                  ? "Graded"
                                  : assignment.userSubmission.status === "submitted"
                                    ? "Submitted"
                                    : "Late"}
                              </Badge>
                            ) : (
                              <Badge variant={new Date(assignment.dueDate) < new Date() ? "destructive" : "outline"}>
                                {new Date(assignment.dueDate) < new Date() ? "Overdue" : "Pending"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{assignment.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Due: {assignment.dueDate.toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Award className="h-4 w-4 mr-1" />
                              {assignment.totalPoints} points
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          {assignment.userSubmission ? (
                            <div className="text-right">
                              {assignment.userSubmission.status === "graded" && assignment.userSubmission.grade && (
                                <div>
                                  <p className="text-lg font-bold text-green-600">
                                    {assignment.userSubmission.grade}/{assignment.totalPoints}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {Math.round((assignment.userSubmission.grade / assignment.totalPoints) * 100)}%
                                  </p>
                                </div>
                              )}
                              {assignment.userSubmission.feedback && (
                                <p className="text-xs text-gray-600 mt-2 max-w-xs">
                                  Feedback: {assignment.userSubmission.feedback}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Button
                              onClick={() => {
                                setSelectedAssignment(assignment)
                                setShowSubmissionDialog(true)
                              }}
                              disabled={new Date(assignment.dueDate) < new Date()}
                            >
                              Submit
                            </Button>
                          )}
                        </div>
                      </div>

                      {assignment.attachments && assignment.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <Label className="text-sm font-medium">Assignment Files:</Label>
                          <div className="flex space-x-2 mt-2">
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
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Topic-wise Performance</CardTitle>
                  <CardDescription>Your scores compared to class average</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="topic" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3b82f6" name="Your Score" />
                      <Bar dataKey="average" fill="#e5e7eb" name="Class Average" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Progress Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Progress Over Time</CardTitle>
                  <CardDescription>Your improvement trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={[
                        { week: "Week 1", score: 75 },
                        { week: "Week 2", score: 78 },
                        { week: "Week 3", score: 82 },
                        { week: "Week 4", score: 85 },
                        { week: "Week 5", score: 88 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Statistics</CardTitle>
                  <CardDescription>Key performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{Math.floor(Math.random() * 20) + 75}%</p>
                      <p className="text-sm text-gray-500">Overall Average</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {userAssignments.filter((a) => a.userSubmission?.status === "graded").length}
                      </p>
                      <p className="text-sm text-gray-500">Completed</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        {userAssignments.filter((a) => !a.userSubmission && new Date(a.dueDate) > new Date()).length}
                      </p>
                      <p className="text-sm text-gray-500">Pending</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        #{Math.floor(Math.random() * classroom.students.length) + 1}
                      </p>
                      <p className="text-sm text-gray-500">Class Rank</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Grades */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Grades</CardTitle>
                  <CardDescription>Your latest assignment scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userAssignments
                      .filter((a) => a.userSubmission?.status === "graded")
                      .slice(0, 5)
                      .map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                            <p className="text-sm text-gray-500">{assignment.dueDate.toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {assignment.userSubmission?.grade}/{assignment.totalPoints}
                            </p>
                            <p className="text-sm text-gray-500">
                              {assignment.userSubmission?.grade
                                ? Math.round((assignment.userSubmission.grade / assignment.totalPoints) * 100)
                                : 0}
                              %
                            </p>
                          </div>
                        </div>
                      ))}
                    {userAssignments.filter((a) => a.userSubmission?.status === "graded").length === 0 && (
                      <p className="text-center text-gray-500 py-4">No graded assignments yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ask Doubt Tab */}
          <TabsContent value="doubt" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Study Assistant</CardTitle>
                <CardDescription>
                  Ask questions about {classroom.subject} concepts, assignments, or study strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-gray-50">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-20">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Start a conversation with your AI study assistant</p>
                        <p className="text-sm mt-2">Ask about concepts, homework help, or study tips</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender === "user" ? "bg-blue-600 text-white" : "bg-white border"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask a question about the subject..."
                      onKeyPress={(e) => e.key === "Enter" && handleAIChat()}
                    />
                    <Button onClick={handleAIChat}>Send</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setChatInput("Can you explain the main concepts from today's lesson?")
                        handleAIChat()
                      }}
                    >
                      Explain today's lesson
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setChatInput("Help me understand this assignment better")
                        handleAIChat()
                      }}
                    >
                      Assignment help
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setChatInput("What should I study for the upcoming test?")
                        handleAIChat()
                      }}
                    >
                      Study suggestions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setChatInput("Can you create a study schedule for me?")
                        handleAIChat()
                      }}
                    >
                      Study schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assignment Submission Dialog */}
        <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Assignment</DialogTitle>
              <DialogDescription>{selectedAssignment?.title}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="submissionText">Your Answer</Label>
                <Textarea
                  id="submissionText"
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="submissionFile">Attachment (optional)</Label>
                <Input
                  id="submissionFile"
                  type="file"
                  onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowSubmissionDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Assignment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* AI Chat Dialog */}
        <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
          <DialogContent className="max-w-2xl h-[600px] flex flex-col">
            <DialogHeader>
              <DialogTitle>AI Study Assistant</DialogTitle>
              <DialogDescription>Get help with {classroom.subject} concepts and assignments</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-gray-50">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Ask me anything about {classroom.subject}!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === "user" ? "bg-blue-600 text-white" : "bg-white border"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-4 border-t">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question..."
                onKeyPress={(e) => e.key === "Enter" && handleAIChat()}
              />
              <Button onClick={handleAIChat}>Send</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  )
}
