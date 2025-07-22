"use client"

import { useState, useMemo } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { useAuth } from "@/lib/auth-context"
import { useFirestoreCollection } from "@/lib/hooks/use-firestore"
import { where } from "firebase/firestore"
import type { Classroom, Assignment } from "@/lib/types"
import { CalendarWidget } from "@/components/ui/calendar-widget"
import { AIAssistantStub } from "@/components/agents/ai-assistant-stub"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Calendar, TrendingUp, Plus, Video, BarChart3, FileText, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function TeacherDashboard() {
  const { userProfile } = useAuth()
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  // Fetch teacher's classrooms
  const { data: classrooms, loading: classroomsLoading } = useFirestoreCollection<Classroom>(
    "classrooms",
    userProfile ? [where("teacherId", "==", userProfile.uid)] : [],
  )

  // Fetch all assignments for teacher's classrooms
  const { data: allAssignments } = useFirestoreCollection<Assignment>("assignments")

  // Calculate stats and upcoming events
  const { stats, upcomingEvents, recentActivity } = useMemo(() => {
    const classroomIds = classrooms.map((c) => c.id)
    const teacherAssignments = allAssignments.filter((a) => classroomIds.includes(a.classroomId))

    const totalStudents = classrooms.reduce((sum, c) => sum + c.students.length, 0)
    const pendingGrading = teacherAssignments.reduce((sum, a) => {
      return sum + Object.values(a.submissions || {}).filter((s) => s.status === "submitted").length
    }, 0)

    const completionRates = teacherAssignments.map((a) => {
      const totalStudents = classrooms.find((c) => c.id === a.classroomId)?.students.length || 0
      const submissions = Object.keys(a.submissions || {}).length
      return totalStudents > 0 ? (submissions / totalStudents) * 100 : 0
    })
    const avgCompletion =
      completionRates.length > 0 ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length : 0

    // Generate upcoming events
    const events = [
      ...teacherAssignments
        .filter((a) => {
          const dueDate = a.dueDate?.toDate?.() || new Date(a.dueDate)
          return dueDate > new Date()
        })
        .map((a) => ({
          id: a.id,
          title: a.title,
          date: a.dueDate?.toDate?.() || new Date(a.dueDate),
          type: "assignment" as const,
          classroom: classrooms.find((c) => c.id === a.classroomId)?.name,
        })),
      ...classrooms.flatMap((c) =>
        c.schedule.days.map((day) => ({
          id: `${c.id}-${day}`,
          title: `${c.name} Class`,
          date: getNextDateForDay(day),
          type: "class" as const,
          time: c.schedule.time,
          classroom: c.name,
        })),
      ),
    ]

    const recentActivity = teacherAssignments
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt)
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 5)

    return {
      stats: {
        activeClassrooms: classrooms.length,
        totalStudents,
        pendingGrading,
        avgCompletion: Math.round(avgCompletion),
      },
      upcomingEvents: events,
      recentActivity,
    }
  }, [classrooms, allAssignments])

  function getNextDateForDay(dayName: string): Date {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const today = new Date()
    const targetDay = days.indexOf(dayName)
    const todayDay = today.getDay()

    let daysUntilTarget = targetDay - todayDay
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7
    }

    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + daysUntilTarget)
    return targetDate
  }

  if (classroomsLoading) {
    return (
      <ProtectedRoute requiredRole="teacher">
        <SidebarLayout role="teacher">
          <div className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="teacher">
      <SidebarLayout role="teacher">
        <div className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userProfile?.displayName}</h1>
              <p className="text-gray-600">Here's what's happening in your classrooms today.</p>
            </div>
            <Button onClick={() => setShowAIAssistant(true)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Classrooms</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeClassrooms}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeClassrooms === 0 ? "Create your first classroom" : "Teaching actively"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">Across all classrooms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingGrading}</div>
                <p className="text-xs text-muted-foreground">Submissions awaiting review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgCompletion}%</div>
                <p className="text-xs text-muted-foreground">Overall progress</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Widget */}
            <div className="lg:col-span-2">
              <CalendarWidget
                events={upcomingEvents}
                onEventClick={(event) => {
                  console.log("Event clicked:", event)
                }}
              />
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks to get you started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/teacher/create-classroom">
                  <Button className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Classroom
                  </Button>
                </Link>
                <Link href="/agents/lecture-summarizer">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    AI Lecture Summarizer
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Lesson
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Classrooms Grid */}
          {classrooms.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Classrooms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classrooms.map((classroom) => (
                  <Card key={classroom.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{classroom.name}</h4>
                          <p className="text-sm text-gray-500">{classroom.subject}</p>
                          <Badge variant="secondary" className="mt-1">
                            {classroom.students.length} students
                          </Badge>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Link href={`/teacher/classroom/${classroom.id}`}>
                          <Button variant="outline" size="sm" className="w-full bg-transparent">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </Link>
                        <div className="grid grid-cols-2 gap-2">
                          {classroom.meetLink && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={classroom.meetLink} target="_blank" rel="noopener noreferrer">
                                <Video className="h-4 w-4 mr-1" />
                                Meet
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Analytics
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Set up your first classroom to begin teaching</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No classrooms yet</p>
                  <Link href="/teacher/create-classroom">
                    <Button>Create Your First Classroom</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest assignments and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((assignment) => {
                    const classroom = classrooms.find((c) => c.id === assignment.classroomId)
                    const submissionCount = Object.keys(assignment.submissions || {}).length

                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-sm text-gray-500">{classroom?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{submissionCount} submissions</Badge>
                          <Link href={`/teacher/classroom/${assignment.classroomId}`}>
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Assistant Dialog */}
          <AIAssistantStub role="teacher" open={showAIAssistant} onOpenChange={setShowAIAssistant} />
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  )
}
