"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useFirestoreCollection, useFirestoreOperations } from "@/lib/hooks/use-firestore"
import { where, arrayUnion } from "firebase/firestore"
import type { Classroom, Assignment } from "@/lib/types"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ErrorBoundary, NetworkErrorFallback } from "@/components/ui/error-boundary"
import { DashboardSkeleton } from "@/components/ui/loading-skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, Calendar, Clock, TrendingUp, Plus, CheckCircle, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { CalendarWidget } from "@/components/ui/calendar-widget"
import { ProgressTracker } from "@/components/ui/progress-tracker"
import { AIAssistantStub } from "@/components/agents/ai-assistant-stub"
import Link from "next/link"

function StudentDashboardContent() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const { updateDocument, loading: operationLoading } = useFirestoreOperations()
  const router = useRouter()

  const [inviteCode, setInviteCode] = useState("")
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [joiningClassroom, setJoiningClassroom] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  // Fetch classrooms where user is a student
  const {
    data: classrooms,
    loading: classroomsLoading,
    error: classroomsError,
    retry: retryClassrooms,
  } = useFirestoreCollection<Classroom>(
    "classrooms",
    userProfile ? [where("students", "array-contains", userProfile.uid)] : [],
  )

  // Fetch all classrooms for invite code lookup
  const { data: allClassrooms, loading: allClassroomsLoading } = useFirestoreCollection<Classroom>("classrooms")

  // Fetch assignments from user's classrooms
  const {
    data: allAssignments,
    loading: assignmentsLoading,
    error: assignmentsError,
    retry: retryAssignments,
  } = useFirestoreCollection<Assignment>("assignments")

  // Filter assignments for user's classrooms and calculate stats
  const { userAssignments, stats } = useMemo(() => {
    if (!userProfile || !classrooms.length) {
      return {
        userAssignments: [],
        stats: {
          totalClassrooms: classrooms.length,
          pendingAssignments: 0,
          completedAssignments: 0,
          averageGrade: 0,
        },
      }
    }

    const userClassroomIds = classrooms.map((c) => c.id)
    const userAssignments = allAssignments.filter((a) => userClassroomIds.includes(a.classroomId))

    const pending = userAssignments.filter(
      (a) => !a.submissions?.[userProfile.uid] || a.submissions[userProfile.uid].status === "submitted",
    ).length

    const completed = userAssignments.filter((a) => a.submissions?.[userProfile.uid]?.status === "graded").length

    const grades = userAssignments
      .filter((a) => a.submissions?.[userProfile.uid]?.grade !== undefined)
      .map((a) => a.submissions[userProfile.uid].grade!)

    const avgGrade = grades.length > 0 ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0

    return {
      userAssignments,
      stats: {
        totalClassrooms: classrooms.length,
        pendingAssignments: pending,
        completedAssignments: completed,
        averageGrade: avgGrade,
      },
    }
  }, [classrooms, allAssignments, userProfile])

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !inviteCode.trim() || joiningClassroom) return

    setJoiningClassroom(true)

    try {
      // Find classroom with matching invite code
      const targetClassroom = allClassrooms.find(
        (classroom) => classroom.inviteCode === inviteCode.toUpperCase().trim(),
      )

      if (!targetClassroom) {
        toast({
          title: "Invalid Code",
          description: "No classroom found with this invite code",
          variant: "destructive",
        })
        return
      }

      // Check if already enrolled
      if (targetClassroom.students?.includes(userProfile.uid)) {
        toast({
          title: "Already Enrolled",
          description: "You are already a member of this classroom",
          variant: "destructive",
        })
        return
      }

      // Add student to classroom
      await updateDocument("classrooms", targetClassroom.id, {
        students: arrayUnion(userProfile.uid),
      })

      setInviteCode("")
      setShowJoinDialog(false)

      toast({
        title: "Success",
        description: `You have joined ${targetClassroom.name}!`,
      })
    } catch (error: any) {
      console.error("Error joining classroom:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to join classroom",
        variant: "destructive",
      })
    } finally {
      setJoiningClassroom(false)
    }
  }

  // Handle loading states
  if (classroomsLoading || assignmentsLoading || allClassroomsLoading) {
    return (
      <SidebarLayout role="student">
        <DashboardSkeleton />
      </SidebarLayout>
    )
  }

  // Handle errors
  if (classroomsError || assignmentsError) {
    return (
      <SidebarLayout role="student">
        <div className="p-6">
          <NetworkErrorFallback
            retry={() => {
              if (classroomsError) retryClassrooms()
              if (assignmentsError) retryAssignments()
            }}
          />
        </div>
      </SidebarLayout>
    )
  }

  const upcomingAssignments = userAssignments
    .filter((a) => {
      const dueDate = a.dueDate?.toDate?.() || new Date(a.dueDate)
      return dueDate > new Date() && !a.submissions?.[userProfile?.uid || ""]
    })
    .sort((a, b) => {
      const dateA = a.dueDate?.toDate?.() || new Date(a.dueDate)
      const dateB = b.dueDate?.toDate?.() || new Date(b.dueDate)
      return dateA.getTime() - dateB.getTime()
    })
    .slice(0, 5)

  const overdueAssignments = userAssignments.filter((a) => {
    const dueDate = a.dueDate?.toDate?.() || new Date(a.dueDate)
    return dueDate < new Date() && !a.submissions?.[userProfile?.uid || ""]
  })

  return (
    <SidebarLayout role="student">
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userProfile?.displayName}</h1>
            <p className="text-gray-600">Here's your learning progress and upcoming tasks.</p>
          </div>
          <Button onClick={() => setShowAIAssistant(true)}>
            <MessageCircle className="h-4 w-4 mr-2" />
            AI Tutor
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClassrooms}</div>
              <p className="text-xs text-muted-foreground">Active classrooms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAssignments}</div>
              <p className="text-xs text-muted-foreground">Assignments due</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedAssignments}</div>
              <p className="text-xs text-muted-foreground">Assignments finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageGrade > 0 ? Math.round(stats.averageGrade) : "--"}%
              </div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to help you stay organized</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                    <Plus className="h-6 w-6" />
                    <span>Join Classroom</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Join Classroom</DialogTitle>
                    <DialogDescription>Enter the invite code provided by your teacher</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleJoinClassroom} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteCode">Invite Code</Label>
                      <Input
                        id="inviteCode"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="Enter 6-character code"
                        maxLength={6}
                        className="uppercase"
                        disabled={joiningClassroom}
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowJoinDialog(false)}
                        disabled={joiningClassroom}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={joiningClassroom || operationLoading}>
                        {joiningClassroom ? "Joining..." : "Join Classroom"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
              >
                <Calendar className="h-6 w-6" />
                <span>View Schedule</span>
              </Button>
              <Link href="/agents/ai-tutor">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                >
                  <BookOpen className="h-6 w-6" />
                  <span>AI Tutor</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        {classrooms.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Join your first classroom to begin learning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No classrooms yet</p>
                <Button onClick={() => setShowJoinDialog(true)}>Join Your First Classroom</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Widget */}
          <div className="lg:col-span-2">
            <CalendarWidget
              events={upcomingAssignments.map((a) => ({
                id: a.id,
                title: a.title,
                date: a.dueDate?.toDate?.() || new Date(a.dueDate),
                type: "assignment" as const,
                classroom: classrooms.find((c) => c.id === a.classroomId)?.name,
              }))}
              onEventClick={(event) => {
                const assignment = upcomingAssignments.find((a) => a.id === event.id)
                if (assignment) {
                  router.push(`/student/classroom/${assignment.classroomId}`)
                }
              }}
            />
          </div>

          {/* Progress Tracker */}
          <ProgressTracker
            data={{
              completed: stats.completedAssignments,
              pending: stats.pendingAssignments,
              overdue: overdueAssignments.length,
              total: userAssignments.length,
              averageScore: stats.averageGrade,
              streak: Math.floor(Math.random() * 7) + 1, // Mock streak data
            }}
          />
        </div>

        {/* My Classrooms */}
        {classrooms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>My Classrooms</CardTitle>
              <CardDescription>Your enrolled classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classrooms.map((classroom) => (
                  <Link key={classroom.id} href={`/student/classroom/${classroom.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{classroom.teacherName}</p>
                            <p className="text-xs text-gray-500">
                              {classroom.schedule?.days?.join(", ") || "No schedule"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium">{classroom.name}</h3>
                          <p className="text-sm text-gray-500">{classroom.subject}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Assistant Dialog */}
        <AIAssistantStub role="student" open={showAIAssistant} onOpenChange={setShowAIAssistant} />
      </div>
    </SidebarLayout>
  )
}

export default function StudentDashboard() {
  return (
    <ProtectedRoute requiredRole="student">
      <ErrorBoundary>
        <StudentDashboardContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
