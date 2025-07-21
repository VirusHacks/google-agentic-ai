"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Classroom } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Settings, LogOut, Plus, Home, MessageCircle, Bell } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AIAssistant } from "@/components/ai-assistant"

interface SidebarLayoutProps {
  children: React.ReactNode
  role: "teacher" | "student"
}

export function SidebarLayout({ children, role }: SidebarLayoutProps) {
  const { userProfile, logout } = useAuth()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [showAI, setShowAI] = useState(false)
  const pathname = usePathname()

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

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="font-semibold text-gray-900">Classroom</h1>
              <p className="text-sm text-gray-500 capitalize">{role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <Link href={`/${role}/dashboard`}>
                <Button
                  variant={isActive(`/${role}/dashboard`) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>

              {role === "teacher" && (
                <Link href="/teacher/create-classroom">
                  <Button
                    variant={isActive("/teacher/create-classroom") ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Classroom
                  </Button>
                </Link>
              )}
            </div>

            <Separator className="mx-4" />

            {/* Classrooms */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Classrooms</h3>
                {role === "teacher" && (
                  <Link href="/teacher/create-classroom">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>

              <div className="space-y-1">
                {classrooms.map((classroom) => (
                  <Link key={classroom.id} href={`/${role}/classroom/${classroom.id}`}>
                    <Button
                      variant={isActive(`/${role}/classroom/${classroom.id}`) ? "secondary" : "ghost"}
                      className="w-full justify-start text-left h-auto p-2"
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{classroom.name}</p>
                          <p className="text-xs text-gray-500 truncate">{classroom.subject}</p>
                        </div>
                        {role === "teacher" && (
                          <Badge variant="secondary" className="text-xs">
                            {classroom.students.length}
                          </Badge>
                        )}
                      </div>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>{userProfile?.displayName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{userProfile?.displayName}</p>
                  <p className="text-xs text-gray-500">{userProfile?.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {pathname.includes("/dashboard")
                  ? "Dashboard"
                  : pathname.includes("/create-classroom")
                    ? "Create Classroom"
                    : pathname.includes("/classroom/")
                      ? "Classroom"
                      : "Classroom Assistant"}
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowAI(true)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>

      {/* AI Assistant */}
      <AIAssistant open={showAI} onOpenChange={setShowAI} context={pathname} role={role} />
    </div>
  )
}
