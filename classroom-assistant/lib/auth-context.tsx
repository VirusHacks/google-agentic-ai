"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase"
import { useRouter } from "next/navigation"

interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: "teacher" | "student"
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, displayName: string, role: "teacher" | "student") => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (role: "teacher" | "student") => Promise<void>
  logOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export const authContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(authContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const signUp = async (email: string, password: string, displayName: string, role: "teacher" | "student") => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Create user profile in Firestore
      const userProfileData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        displayName: displayName,
        role: role,
        createdAt: new Date(),
      }

      await setDoc(doc(db, "users", userCredential.user.uid), userProfileData)

      // Navigate based on role
      if (role === "teacher") {
        navigate.push("/teacher/dashboard")
      } else {
        navigate.push("/student/dashboard")
      }
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))

      if (userDoc.exists()) {
        const userData = userDoc.data()

        // Navigate based on role
        if (userData.role === "teacher") {
          navigate.push("/teacher/dashboard")
        } else if (userData.role === "student") {
          navigate.push("/student/dashboard")
        }
      } else {
        throw new Error("User profile not found. Please contact support.")
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const loginWithGoogle = async (role: "teacher" | "student") => {
    try {
      const googleProvider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, googleProvider)

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))

      if (!userDoc.exists()) {
        // Create new user profile
        const userProfileData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email || "",
          displayName: userCredential.user.displayName || userCredential.user.email?.split("@")[0] || "User",
          role: role,
          createdAt: new Date(),
        }

        await setDoc(doc(db, "users", userCredential.user.uid), userProfileData)
      }

      // Get updated user profile
      const updatedUserDoc = await getDoc(doc(db, "users", userCredential.user.uid))
      const userData = updatedUserDoc.data()

      // Navigate based on role
      if (userData?.role === "teacher") {
        navigate.push("/teacher/dashboard")
      } else {
        navigate.push("/student/dashboard")
      }
    } catch (error) {
      console.error("Google login error:", error)
      throw error
    }
  }

  const logOut = async () => {
    try {
      await signOut(auth)
      navigate.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error("Reset password error:", error)
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser)

          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, "users", currentUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUserProfile({
              ...userData,
              createdAt: userData.createdAt?.toDate() || new Date(),
            } as UserProfile)
          }
        } else {
          setUser(null)
          setUserProfile(null)
        }
      } catch (error) {
        console.error("Auth state change error:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <authContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        login,
        loginWithGoogle,
        logOut,
        resetPassword,
      }}
    >
      {children}
    </authContext.Provider>
  )
}
