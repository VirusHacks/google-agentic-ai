"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AvatarUploader } from "@/components/forms/avatar-uploader"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Calendar, GraduationCap, LogOut, AlertTriangle } from "lucide-react"

export default function ProfilePage() {
  const { userProfile, logOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    age: "",
    grade: "",
    avatarUrl: "",
  })

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        displayName: userProfile.displayName || "",
        email: userProfile.email || "",
        age: (userProfile as any).age || "",
        grade: (userProfile as any).grade || "",
        avatarUrl: (userProfile as any).avatarUrl || "",
      })
    }
  }, [userProfile])

  const handleSave = async () => {
    if (!userProfile) return

    setLoading(true)
    try {
      await updateDoc(doc(db, "users", userProfile.uid), {
        displayName: profileData.displayName,
        age: profileData.age ? Number.parseInt(profileData.age) : null,
        grade: profileData.grade,
        updatedAt: new Date(),
      })

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      })
      setEditing(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (url: string, publicId: string) => {
    if (!userProfile) return

    try {
      await updateDoc(doc(db, "users", userProfile.uid), {
        avatarUrl: url,
        avatarPublicId: publicId,
        updatedAt: new Date(),
      })

      setProfileData((prev) => ({ ...prev, avatarUrl: url }))

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRoleChange = async () => {
    if (!userProfile) return

    const newRole = userProfile.role === "teacher" ? "student" : "teacher"

    try {
      await updateDoc(doc(db, "users", userProfile.uid), {
        role: newRole,
        updatedAt: new Date(),
      })

      toast({
        title: "Role Changed",
        description: `Your role has been changed to ${newRole}. Please sign in again.`,
      })

      // Sign out and redirect to login
      await logOut()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    try {
      await logOut()
      router.push("/login")
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-6">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>

          <div className="space-y-6">
            {/* Profile Photo */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
                <CardDescription>Update your profile picture</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <AvatarUploader
                  currentAvatarUrl={profileData.avatarUrl}
                  fallbackText={profileData.displayName.charAt(0).toUpperCase()}
                  onUpload={handleAvatarUpload}
                  size="lg"
                />
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <Input
                        id="displayName"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, displayName: e.target.value }))}
                        disabled={!editing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <Input id="email" value={profileData.email} disabled className="bg-gray-50" />
                    </div>
                  </div>

                  {userProfile.role === "student" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <Input
                            id="age"
                            type="number"
                            value={profileData.age}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, age: e.target.value }))}
                            disabled={!editing}
                            min="5"
                            max="100"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="grade">Grade</Label>
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="h-4 w-4 text-gray-400" />
                          <Select
                            value={profileData.grade}
                            onValueChange={(value) => setProfileData((prev) => ({ ...prev, grade: value }))}
                            disabled={!editing}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={`Grade ${i + 1}`}>
                                  Grade {i + 1}
                                </SelectItem>
                              ))}
                              <SelectItem value="College">College</SelectItem>
                              <SelectItem value="Graduate">Graduate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  {editing ? (
                    <>
                      <Button variant="outline" onClick={() => setEditing(false)} disabled={loading}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditing(true)}>Edit Profile</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Current Role</h4>
                    <p className="text-sm text-gray-500 capitalize">{userProfile.role}</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowRoleChangeDialog(true)}>
                    Switch Role
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Account Created</h4>
                    <p className="text-sm text-gray-500">{userProfile.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sign Out */}
            <Card>
              <CardContent className="pt-6">
                <Button variant="destructive" onClick={handleSignOut} className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Role Change Dialog */}
          <Dialog open={showRoleChangeDialog} onOpenChange={setShowRoleChangeDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                  Change Role
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to change your role from {userProfile.role} to{" "}
                  {userProfile.role === "teacher" ? "student" : "teacher"}? This will sign you out and you'll need to
                  sign in again.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowRoleChangeDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRoleChange}>
                  Change Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
}
