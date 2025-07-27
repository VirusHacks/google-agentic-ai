"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useFirestoreCollection } from "@/lib/hooks/use-firestore"
import { where } from "firebase/firestore"
import type { Classroom, Assignment } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
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
  CalendarIcon,
  Clock,
  TrendingUp,
  Plus,
  Video,
  FileText,
  Bell,
  Settings,
  LogOut,
  CheckCircle,
  Download,
  Eye,
  User,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import Link from "next/link"

interface StudentDashboardProps {
  className?: string
}

export function StudentDashboard({ className }: StudentDashboardProps) {
  const { userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Fetch classrooms where user is a student
  const { data: classrooms, loading: classroomsLoading } = useFirestoreCollection<Classroom>(
    "classrooms",
    userProfile ? [where("students", "array-contains", userProfile.uid)] : [],
  )

  // Fetch all assignments
  const { data: allAssignments } = useFirestoreCollection<Assignment>("assignments")

  // Mock data for demonstration
  const mockLiveSessions = [
    { id: 1, title: "Advanced Mathematics", time: "10:00 AM", date: "Today", teacher: "Dr. Smith", status: "upcoming" },
    { id: 2, title: "Physics Lab", time: "2:00 PM", date: "Today", teacher: "Prof. Johnson", status: "live" },
    { id: 3, title: "Chemistry Basics", time: "9:00 AM", date: "Tomorrow", teacher: "Dr. Brown", status: "scheduled" },
  ]

  const mockAssignments = [
    {
      id: 1,
      title: "Calculus Problem Set",
      subject: "Mathematics",
      dueDate: "2024-01-20",
      status: "pending",
      grade: null,
    },
    { id: 2, title: "Physics Lab Report", subject: "Physics", dueDate: "2024-01-18", status: "submitted", grade: null },
    { id: 3, title: "Chemistry Quiz", subject: "Chemistry", dueDate: "2024-01-15", status: "graded", grade: 85 },
  ]

  const mockMaterials = [
    { id: 1, title: "Calculus Chapter 5.pdf", subject: "Mathematics", uploadDate: "2024-01-15", size: "2.5 MB" },
    { id: 2, title: "Physics Lab Manual.pptx", subject: "Physics", uploadDate: "2024-01-14", size: "5.2 MB" },
    { id: 3, title: "Chemical Reactions.pdf", subject: "Chemistry", uploadDate: "2024-01-13", size: "1.8 MB" },
  ]

  const performanceData = [
    { month: "Jan", grade: 85, attendance: 92 },
    { month: "Feb", grade: 88, attendance: 89 },
    { month: "Mar", grade: 92, attendance: 95 },
    { month: "Apr", grade: 87, attendance: 91 },
    { month: "May", grade: 90, attendance: 88 },
    { month: "Jun", grade: 93, attendance: 94 },
  ]

  const gradeDistribution = [
    { name: "A (90-100)", value: 35, color: "#10B981" },
    { name: "B (80-89)", value: 40, color: "#3B82F6" },
    { name: "C (70-79)", value: 20, color: "#F59E0B" },
    { name: "D (60-69)", value: 5, color: "#EF4444" },
  ]

  // Calculate stats
  const stats = useMemo(() => {
    const enrolledClasses = classrooms.length
    const pendingAssignments = mockAssignments.filter((a) => a.status === "pending").length
    const completedAssignments = mockAssignments.filter((a) => a.status === "graded").length
    const averageGrade =
      mockAssignments.filter((a) => a.grade !== null).reduce((sum, a) => sum + (a.grade || 0), 0) /
        mockAssignments.filter((a) => a.grade !== null).length || 0

    return {
      enrolledClasses,
      pendingAssignments,
      completedAssignments,
      averageGrade: Math.round(averageGrade),
      attendanceRate: 91,
    }
  }, [classrooms])

  const upcomingEvents = [
    { date: new Date(2024, 0, 20), title: "Calculus Assignment Due", type: "assignment" },
    { date: new Date(2024, 0, 22), title: "Physics Lab Session", type: "class" },
    { date: new Date(2024, 0, 25), title: "Chemistry Quiz", type: "quiz" },
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
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userProfile?.displayName || "Student"}</h1>
          <p className="text-gray-600 mt-1">Here's your learning progress and upcoming tasks.</p>
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
                  <AvatarFallback>{userProfile?.displayName?.charAt(0) || "S"}</AvatarFallback>
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
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
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
            <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enrolledClasses}</div>
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
            <div className="text-2xl font-bold">{stats.averageGrade}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Class attendance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">My Classes</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="live-classes">Live Classes</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>Upcoming sessions, assignments, and deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                  <div className="space-y-4">
                    <h4 className="font-medium">Upcoming Events</h4>
                    {upcomingEvents.map((event, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            event.type === "assignment"
                              ? "bg-blue-500"
                              : event.type === "class"
                                ? "bg-green-500"
                                : "bg-orange-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.date.toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Tracker</CardTitle>
                <CardDescription>Your academic progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Assignments Completed</span>
                    <span>
                      {stats.completedAssignments}/{stats.completedAssignments + stats.pendingAssignments}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average Grade</span>
                    <span className="font-medium text-green-600">{stats.averageGrade}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Attendance Rate</span>
                    <span className="font-medium text-blue-600">{stats.attendanceRate}%</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h5 className="text-sm font-medium mb-2">Personalized Tips</h5>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                      📚 Great job on maintaining high grades! Keep up the excellent work.
                    </p>
                    <p className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                      ⏰ You have 2 assignments due this week. Plan your time accordingly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Classes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Live Classes</CardTitle>
              <CardDescription>Join your scheduled sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockLiveSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          session.status === "live"
                            ? "bg-red-500 animate-pulse"
                            : session.status === "upcoming"
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                        }`}
                      />
                      <Badge variant={session.status === "live" ? "destructive" : "default"}>{session.status}</Badge>
                    </div>
                    <h4 className="font-medium">{session.title}</h4>
                    <p className="text-sm text-gray-500">{session.teacher}</p>
                    <p className="text-sm text-gray-500">
                      {session.time} • {session.date}
                    </p>
                    <Button
                      className={`w-full mt-3 ${session.status === "live" ? "bg-red-600 hover:bg-red-700" : ""}`}
                      size="sm"
                    >
                      {session.status === "live" ? (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          Join Live
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          {session.status === "upcoming" ? "Starting Soon" : "Scheduled"}
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">My Classes</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Join Class
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
                      <p className="text-xs text-gray-400 mt-1">{classroom.teacherName}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>

                    <Link href={`/student/classroom/${classroom.id}`}>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Materials
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Assignments & Materials</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Assignments</CardTitle>
                <CardDescription>Track your assignment progress</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                            <p className="text-sm text-gray-500">{assignment.subject}</p>
                          </div>
                        </TableCell>
                        <TableCell>{assignment.dueDate}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignment.status === "graded"
                                ? "default"
                                : assignment.status === "submitted"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {assignment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{assignment.grade ? `${assignment.grade}%` : "--"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Your performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {gradeDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full`} style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="live-classes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Live Classes</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockLiveSessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-4 w-4 rounded-full ${
                        session.status === "live"
                          ? "bg-red-500 animate-pulse"
                          : session.status === "upcoming"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                      }`}
                    />
                    <Badge variant={session.status === "live" ? "destructive" : "default"}>{session.status}</Badge>
                  </div>

                  <h4 className="font-semibold text-lg mb-2">{session.title}</h4>
                  <p className="text-sm text-gray-600 mb-1">Instructor: {session.teacher}</p>
                  <p className="text-sm text-gray-600 mb-4">
                    {session.time} • {session.date}
                  </p>

                  {session.status === "live" && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">🔴 Live Now</p>
                      <p className="text-xs text-red-600">Join now to participate in the session</p>
                    </div>
                  )}

                  <Button className={`w-full ${session.status === "live" ? "bg-red-600 hover:bg-red-700" : ""}`}>
                    {session.status === "live" ? (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        Join Live Session
                      </>
                    ) : session.status === "upcoming" ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Starting Soon
                      </>
                    ) : (
                      <>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Scheduled
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Learning Resources</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recently Uploaded Materials</CardTitle>
                <CardDescription>Latest resources from your teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMaterials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{material.title}</h4>
                          <p className="text-sm text-gray-500">
                            {material.subject} • {material.size}
                          </p>
                          <p className="text-xs text-gray-400">{material.uploadDate}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
                <CardDescription>Track your academic progress</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="grade" stroke="#8884d8" strokeWidth={2} name="Grade" />
                    <Line type="monotone" dataKey="attendance" stroke="#82ca9d" strokeWidth={2} name="Attendance" />
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
