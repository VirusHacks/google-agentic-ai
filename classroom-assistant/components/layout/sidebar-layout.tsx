"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Classroom } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  BookOpen,
  BarChart3,
  Settings,
  Menu,
  X,
  Home,
  Plus,
  MessageCircle,
  Calendar,
  User,
  Bot,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface SidebarLayoutProps {
  children: React.ReactNode
  role: "teacher" | "student"
}

const GRADE_ORDER = {
  elementary: 1,
  middle: 2,
  high: 3,
  college: 4,
  adult: 5,
}

const GRADE_LABELS = {
  elementary: "Elementary (K-5)",
  middle: "Middle School (6-8)",
  high: "High School (9-12)",
  college: "College",
  adult: "Adult Education",
}

export function SidebarLayout({ children, role }: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const router = useRouter()
  const { userProfile, logOut } = useAuth()

  const teacherNavItems = [
    { name: "Dashboard", href: "/teacher/dashboard", icon: Home },
    { name: "Create Classroom", href: "/teacher/create-classroom", icon: Plus },
    { name: "Analytics", href: "/teacher/analytics", icon: BarChart3 },
    { name: "AI Tools", href: "/agents/lecture-summarizer", icon: Bot },
  ]

  const studentNavItems = [
    { name: "Dashboard", href: "/student/dashboard", icon: Home },
    { name: "My Classes", href: "/student/classes", icon: BookOpen },
    { name: "Calendar", href: "/student/calendar", icon: Calendar },
    { name: "AI Tutor", href: "/agents/ai-tutor", icon: MessageCircle },
  ]

  const navItems = role === "teacher" ? teacherNavItems : studentNavItems

  // Fetch classrooms based on user role
  useEffect(() => {
    if (!userProfile) return

    const q =
      role === "teacher"
        ? query(collection(db, "classrooms"), where("teacherId", "==", userProfile.uid))
        : query(collection(db, "classrooms"), where("students", "array-contains", userProfile.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classroomData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Classroom[]
      setClassrooms(classroomData)
    })

    return () => unsubscribe()
  }, [userProfile, role])

  // Group classrooms by grade
  const classroomsByGrade = useMemo(() => {
    const grouped = classrooms.reduce(
      (acc, classroom) => {
        const grade = classroom.gradeRange || "other"
        if (!acc[grade]) {
          acc[grade] = []
        }
        acc[grade].push(classroom)
        return acc
      },
      {} as Record<string, Classroom[]>,
    )

    // Sort grades by predefined order
    const sortedGrades = Object.keys(grouped).sort((a, b) => {
      const orderA = GRADE_ORDER[a as keyof typeof GRADE_ORDER] || 999
      const orderB = GRADE_ORDER[b as keyof typeof GRADE_ORDER] || 999
      return orderA - orderB
    })

    return sortedGrades.reduce(
      (acc, grade) => {
        acc[grade] = grouped[grade].sort((a, b) => a.name.localeCompare(b.name))
        return acc
      },
      {} as Record<string, Classroom[]>,
    )
  }, [classrooms])

  const toggleGrade = (grade: string) => {
    const newExpanded = new Set(expandedGrades)
    if (newExpanded.has(grade)) {
      newExpanded.delete(grade)
    } else {
      newExpanded.add(grade)
    }
    setExpandedGrades(newExpanded)
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  const isClassroomActive = (classroomId: string) => {
    return pathname.includes(`/classroom/${classroomId}`)
  }

  const handleLogout = async () => {
    try {
      await logOut()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Classroom</span>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={(userProfile as any)?.photoURL || "/placeholder.svg"} />
                <AvatarFallback>{userProfile?.displayName?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userProfile?.displayName || "User"}</p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4 space-y-2 flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </div>

          <Separator className="mx-4 flex-shrink-0" />

          {/* Classrooms Section - Scrollable */}
          <div className="flex-1 overflow-hidden min-h-0">
            <div className="p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  {role === "teacher" ? "My Classrooms" : "Enrolled Classes"}
                </h3>
                {role === "teacher" && (
                  <Link href="/teacher/create-classroom">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>

              <ScrollArea className="h-full">
                <div className="space-y-2 pr-2">
                  {Object.keys(classroomsByGrade).length === 0 ? (
                    <div className="text-center py-4">
                      <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">
                        {role === "teacher" ? "No classrooms yet" : "No classes joined"}
                      </p>
                    </div>
                  ) : (
                    Object.entries(classroomsByGrade).map(([grade, gradeClassrooms]) => (
                      <Collapsible
                        key={grade}
                        open={expandedGrades.has(grade)}
                        onOpenChange={() => toggleGrade(grade)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-2 h-auto text-left">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-gray-600">
                                {GRADE_LABELS[grade as keyof typeof GRADE_LABELS] || grade.toUpperCase()}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {gradeClassrooms.length}
                              </Badge>
                            </div>
                            {expandedGrades.has(grade) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1 ml-2">
                          {gradeClassrooms.map((classroom) => (
                            <Link
                              key={classroom.id}
                              href={`/${role}/classroom/${classroom.id}`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <Button
                                variant={isClassroomActive(classroom.id) ? "secondary" : "ghost"}
                                className="w-full justify-start text-left h-auto p-2"
                              >
                                <div className="flex items-center space-x-2 w-full">
                                  <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{classroom.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{classroom.subject}</p>
                                  </div>
                                  {role === "teacher" && (
                                    <Badge variant="outline" className="text-xs">
                                      {classroom.students?.length || 0}
                                    </Badge>
                                  )}
                                </div>
                              </Button>
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Footer - Settings and Profile */}
          <div className="p-4 border-t space-y-2 flex-shrink-0">
            <Link href="/profile">
              <Button variant="ghost" className="w-full justify-start">
                <User className="h-4 w-4 mr-3" />
                Profile
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">Classroom</span>
            </div>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
