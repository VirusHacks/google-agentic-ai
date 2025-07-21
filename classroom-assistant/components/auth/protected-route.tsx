"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "teacher" | "student"
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
        return
      }

      if (requiredRole && userProfile?.role !== requiredRole) {
        // Redirect to appropriate dashboard based on actual role
        if (userProfile?.role === "teacher") {
          router.push("/teacher/dashboard")
        } else if (userProfile?.role === "student") {
          router.push("/student/dashboard")
        } else {
          router.push("/login")
        }
        return
      }
    }
  }, [user, userProfile, loading, requiredRole, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || (requiredRole && userProfile?.role !== requiredRole)) {
    return null
  }

  return <>{children}</>
}
