"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert } from "@/components/ui/alert"
import { Loader2, BookOpen } from "lucide-react"

export default function LoginPage() {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "student" as "teacher" | "student",
  })

  const [googleRole, setGoogleRole] = useState<"teacher" | "student">("student")
  const [resetEmail, setResetEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const { login, signUp, loginWithGoogle, resetPassword } = useAuth()

  const handleLoginChange = ({ target: { name, value } }: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [name]: value })
  }

  const handleSignupChange = ({ target: { name, value } }: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData({ ...signupData, [name]: value })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(loginData.email, loginData.password)
    } catch (error: any) {
      console.error("Login Error:", error)

      if (error.code === "auth/user-not-found") {
        setError("No account found with this email address.")
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password.")
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.")
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.")
      } else {
        setError(error.message || "Login failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!signupData.displayName.trim()) {
      setError("Please enter your full name")
      return
    }

    if (signupData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setLoading(true)

    try {
      await signUp(signupData.email, signupData.password, signupData.displayName.trim(), signupData.role)
    } catch (error: any) {
      console.error("Signup Error:", error)

      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please try logging in instead.")
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.")
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else {
        setError(error.message || "Signup failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    setLoading(true)

    try {
      await loginWithGoogle(googleRole)
    } catch (error: any) {
      console.error("Google Login Error:", error)

      if (error.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled. Please try again.")
      } else if (error.code === "auth/popup-blocked") {
        setError("Popup was blocked. Please allow popups and try again.")
      } else {
        setError(error.message || "Google sign-in failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError("Please enter your email address")
      return
    }

    setError("")
    setSuccess("")
    setLoading(true)

    try {
      await resetPassword(resetEmail)
      setSuccess("We sent you an email with a link to reset your password")
    } catch (error: any) {
      console.error("Reset Password Error:", error)
      setError(error.message || "Failed to send reset email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Sahayak</h1>
          </div>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <Alert message={error} type="error" />}
          {success && <Alert message={success} type="success" />}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" disabled={loading}>
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" disabled={loading}>
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => {
                      const email = prompt("Enter your email address:")
                      if (email) {
                        setResetEmail(email)
                        handleResetPassword()
                      }
                    }}
                    disabled={loading}
                  >
                    Forgot Password?
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-displayName">Full Name</Label>
                  <Input
                    id="signup-displayName"
                    name="displayName"
                    value={signupData.displayName}
                    onChange={handleSignupChange}
                    disabled={loading}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    disabled={loading}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    disabled={loading}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Role</Label>
                  <Select
                    value={signupData.role}
                    onValueChange={(value: "teacher" | "student") => setSignupData({ ...signupData, role: value })}
                    disabled={loading}
                  >
                    <SelectTrigger id="signup-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="space-y-2">
                <Label htmlFor="google-role">Role for Google Sign-In</Label>
                <Select
                  value={googleRole}
                  onValueChange={(value: "teacher" | "student") => setGoogleRole(value)}
                  disabled={loading}
                >
                  <SelectTrigger id="google-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full bg-transparent"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Continue with Google
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
