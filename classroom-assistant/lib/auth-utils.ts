"use client"

// Utility functions to replace NextAuth functionality
import { useAuth } from "./auth-context"

// Hook to replace useSession from NextAuth
export function useSession() {
  const { user, userProfile, loading } = useAuth()

  return {
    data: user
      ? {
          user: {
            id: user.uid,
            name: userProfile?.displayName || user.displayName || user.email,
            email: user.email,
            image: user.photoURL,
            role: userProfile?.role || "admin",
          },
        }
      : null,
    status: loading ? "loading" : user ? "authenticated" : "unauthenticated",
  }
}

// Function to get current user server-side (for API routes)
export async function getCurrentUser() {
  // For now, return null since we're using client-side auth
  // In a real implementation, you'd verify the Firebase token
  return null
}
