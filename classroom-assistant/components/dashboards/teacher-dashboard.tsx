"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useFirestoreCollection } from "@/lib/hooks/use-firestore"
import { where } from "firebase/firestore"
import type { Classroom, Assignment } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  Video,
  FileText,
  Bell,
  Settings,
  LogOut,
  Play,
  Edit,
  Trash2,
  Upload,
  AlertCircle,
  Eye,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import Link from "next/link"

interface TeacherDashboardProps {
  className?: string
}

export function TeacherDashboard({ className }: TeacherDashboardProps) {
  const { userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch teacher's classrooms
  const { data: classrooms, loading: classroomsLoading } = useFirestoreCollection<Classroom>(
    "classrooms",
    userProfile ? [where("teacherId", "==", userProfile.uid)] : [],
  )

  // Fetch all assignments for teacher's classrooms
  const { data: allAssignments } = useFirestoreCollection<Assignment>("assignments")

  // Mock data for demonstration
  const mockLiveSessions = [
    { id: 1, title: "Advanced Mathematics", time: "10:00 AM", date: "Today", students: 25, status: "upcoming" },
    { id: 2, title: "Physics Lab", time: "2:00 PM", date: "Today", students: 18, status: "live" },
    { id: 3, title: "Chemistry Basics", time: "9:00 AM", date: "Tomorrow", students: 22, status: "scheduled" },
  ]

  const mockMaterials = [
    { id: 1, title: "Calculus Chapter 5.pdf", subject: "Mathematics", uploadDate: "2024-01-15", downloads: 45 },
    { id: 2, title: "Physics Lab Manual.pptx", subject: "Physics", uploadDate: "2024-01-14", downloads: 32 },
    { id: 3, title: "Chemical Reactions.pdf", subject: "Chemistry", uploadDate: "2024-01-13", downloads: 28 },
  ]

  const mockRecentActivity = [
    { id: 1, type: "upload", message: "Uploaded new material: Calculus Chapter 5", time: "2 hours ago" },
    {
      id: 2,
      type: "assignment",
      message: "Assignment 'Physics Lab Report' submitted by 15 students",
      time: "4 hours ago",
    },
    { id: 3, type: "class", message: "Completed live session: Advanced Mathematics", time: "1 day ago" },
    { id: 4, type: "submission", message: "New submissions received for Chemistry Quiz", time: "2 days ago" },
  ]

  const performanceData = [
    { month: "Jan", attendance: 85, completion: 78, satisfaction: 92 },
    { month: "Feb", attendance: 88, completion: 82, satisfaction: 89 },
    { month: "Mar", attendance: 92, completion: 85, satisfaction: 94 },
    { month: "Apr", attendance: 87, completion: 79, satisfaction: 91 },
    { month: "May", attendance: 90, completion: 88, satisfaction: 96 },
    { month: "Jun", attendance: 93, completion: 91, satisfaction: 95 },
  ]

  // Calculate stats
  const stats = useMemo(() => {
    const totalStudents = classrooms.reduce((sum, c) => sum + c.students.length, 0)
    const totalMaterials = mockMaterials.length
    const activeClassrooms = classrooms.length
    const upcomingSessions = mockLiveSessions.filter((s) => s.status === "upcoming" || s.status === "scheduled").length

    return {
      totalStudents,
      totalMaterials,
      activeClassrooms,
      upcomingSessions,
      attendanceRate: 89,
    }
  }, [classrooms])

  const topPerformers = [
    { name: "Alice Johnson", score: 95, trend: "up" },
    { name: "Bob Smith", score: 92, trend: "up" },
    { name: "Carol Davis", score: 88, trend: "stable" },
  ]

  const underPerformers = [
    { name: "David Wilson", score: 65, trend: "down" },
    { name: "Eva Brown", score: 58, trend: "down" },
    { name: "Frank Miller", score: 62, trend: "stable" },
  ]

  if (classroomsLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userProfile?.displayName || "Teacher"}</h1>
          <p className="text-gray-600 mt-1">Here's what's happening in your classrooms today.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.photoURL || ""} alt={userProfile?.displayName || ""} />
                  <AvatarFallback>{userProfile?.displayName?.charAt(0) || "T"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userProfile?.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{userProfile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <CardTitle className="text-sm font-medium">Materials Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaterials}</div>
            <p className="text-xs text-muted-foreground">PPTs and documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classrooms</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClassrooms}</div>
            <p className="text-xs text-muted-foreground">Currently teaching</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
            <p className="text-xs text-muted-foreground">Live classes scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Average attendance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
          <TabsTrigger value="live-sessions">Live Sessions</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Class Panel */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Today's Live Sessions</CardTitle>
                <CardDescription>Manage your upcoming and active classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockLiveSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            session.status === "live"
                              ? "bg-red-500 animate-pulse"
                              : session.status === "upcoming"
                                ? "bg-yellow-500"
                                : "bg-gray-400"
                          }`}
                        />
                        <div>
                          <h4 className="font-medium">{session.title}</h4>
                          <p className="text-sm text-gray-500">
                            {session.time} • {session.date}
                          </p>
                          <p className="text-xs text-gray-400">{session.students} students</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {session.status === "live" ? (
                          <Button size="sm" className="bg-red-600 hover:bg-red-700">
                            <Video className="h-4 w-4 mr-2" />
                            Join Live
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4 mr-2" />
                            Start Session
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div
                        className={`h-2 w-2 rounded-full mt-2 ${
                          activity.type === "upload"
                            ? "bg-blue-500"
                            : activity.type === "assignment"
                              ? "bg-green-500"
                              : activity.type === "class"
                                ? "bg-purple-500"
                                : "bg-orange-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Attendance, completion rates, and satisfaction over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="completion" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="satisfaction" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Insights</CardTitle>
                <CardDescription>Top and underperforming students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">Top Performers</h4>
                  {topPerformers.map((student, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <span className="text-sm">{student.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{student.score}%</span>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-2">Needs Attention</h4>
                  {underPerformers.map((student, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <span className="text-sm">{student.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{student.score}%</span>
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="classrooms" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">My Classrooms</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Classroom
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <Card key={classroom.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{classroom.name}</h4>
                      <p className="text-sm text-gray-500">{classroom.subject}</p>
                      <Badge variant="secondary" className="mt-2">
                        {classroom.students.length} students
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>

                    <div className="flex space-x-2">
                      <Link href={`/teacher/classroom/${classroom.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </Link>
                      {classroom.meetLink && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={classroom.meetLink} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="live-sessions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Live Sessions</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLiveSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.title}</TableCell>
                      <TableCell>
                        {session.date} at {session.time}
                      </TableCell>
                      <TableCell>{session.students}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            session.status === "live"
                              ? "destructive"
                              : session.status === "upcoming"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {session.status === "live" ? (
                            <Button size="sm" className="bg-red-600 hover:bg-red-700">
                              <Video className="h-4 w-4 mr-2" />
                              Join
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Play className="h-4 w-4 mr-2" />
                              Start
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Resource Library</h3>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Material
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.title}</TableCell>
                      <TableCell>{material.subject}</TableCell>
                      <TableCell>{material.uploadDate}</TableCell>
                      <TableCell>{material.downloads}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Attendance and completion trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="attendance" fill="#8884d8" />
                    <Bar dataKey="completion" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Satisfaction</CardTitle>
                <CardDescription>Feedback scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="satisfaction" stroke="#ffc658" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
