"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Worksheet, Classroom } from "@/lib/types"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WorksheetUploader } from "@/components/forms/worksheet-uploader"
import { useToast } from "@/hooks/use-toast"
import { Plus, FileText, Download, Trash2, Search, Calendar, BookOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formatDate = (d: any): string => {
  const dateObj = d?.toDate ? d.toDate() : new Date(d)
  return dateObj.toLocaleDateString()
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "easy":
      return "bg-green-100 text-green-800"
    case "medium":
      return "bg-yellow-100 text-yellow-800"
    case "hard":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function ClassroomWorksheetsPage() {
  const params = useParams()
  const classroomId = params.id as string
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [worksheets, setWorksheets] = useState<Worksheet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [gradeFilter, setGradeFilter] = useState<string>("all")

  // Dialog states
  const [showAddWorksheet, setShowAddWorksheet] = useState(false)

  useEffect(() => {
    if (!classroomId) return

    // Fetch classroom data
    const unsubscribeClassroom = onSnapshot(doc(db, "classrooms", classroomId), (doc) => {
      if (doc.exists()) {
        setClassroom({ id: doc.id, ...doc.data() } as Classroom)
      }
      setLoading(false)
    })

    // Fetch worksheets
    const worksheetsQuery = query(
      collection(db, "worksheets"),
      where("classroomId", "==", classroomId),
      orderBy("createdAt", "desc"),
    )
    const unsubscribeWorksheets = onSnapshot(worksheetsQuery, (snapshot) => {
      const worksheetData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Worksheet[]
      setWorksheets(worksheetData)
    })

    return () => {
      unsubscribeClassroom()
      unsubscribeWorksheets()
    }
  }, [classroomId])

  const handleWorksheetUpload = async (worksheetData: any) => {
    if (!userProfile || !classroom) return

    try {
      await addDoc(collection(db, "worksheets"), {
        ...worksheetData,
        classroomId: classroom.id,
        createdBy: userProfile.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      setShowAddWorksheet(false)
      toast({
        title: "Worksheet Added",
        description: "Your worksheet has been uploaded successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (worksheetId: string) => {
    try {
      await deleteDoc(doc(db, "worksheets", worksheetId))
      toast({
        title: "Worksheet Deleted",
        description: "Worksheet has been deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Filter worksheets
  const filteredWorksheets = worksheets.filter((worksheet) => {
    const matchesSearch =
      worksheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worksheet.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = subjectFilter === "all" || worksheet.subject === subjectFilter
    const matchesDifficulty = difficultyFilter === "all" || worksheet.difficulty === difficultyFilter
    const matchesGrade = gradeFilter === "all" || worksheet.gradeLevel === gradeFilter

    return matchesSearch && matchesSubject && matchesDifficulty && matchesGrade
  })

  // Get unique filter values
  const subjects = Array.from(new Set(worksheets.map((w) => w.subject).filter(Boolean)))
  const difficulties = Array.from(new Set(worksheets.map((w) => w.difficulty)))
  const grades = Array.from(new Set(worksheets.map((w) => w.gradeLevel).filter(Boolean)))

  if (loading) {
    return (
      <SidebarLayout role="teacher">
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading worksheets...</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout role="teacher">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Worksheets</h1>
              <p className="text-gray-600">{classroom?.name}</p>
            </div>
            <Button onClick={() => setShowAddWorksheet(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Worksheet
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search worksheets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject.charAt(0).toUpperCase() + subject.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(subjectFilter !== "all" || difficultyFilter !== "all" || gradeFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSubjectFilter("all")
                  setDifficultyFilter("all")
                  setGradeFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Worksheets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorksheets.map((worksheet) => (
            <Card key={worksheet.id} className="h-fit">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{worksheet.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(worksheet.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" asChild>
                      <a href={worksheet.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3" />
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(worksheet.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-3">{worksheet.description}</p>

                {/* File info */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium">{worksheet.filename}</span>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={worksheet.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3 w-3" />
                    </a>
                  </Button>
                </div>

                {/* Metadata badges */}
                <div className="flex flex-wrap gap-2">
                  {worksheet.subject && (
                    <Badge variant="outline" className="text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {worksheet.subject.charAt(0).toUpperCase() + worksheet.subject.slice(1)}
                    </Badge>
                  )}
                  {worksheet.gradeLevel && (
                    <Badge variant="outline" className="text-xs">
                      {worksheet.gradeLevel}
                    </Badge>
                  )}
                  <Badge className={`text-xs ${getDifficultyColor(worksheet.difficulty)}`}>
                    {worksheet.difficulty.charAt(0).toUpperCase() + worksheet.difficulty.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredWorksheets.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || subjectFilter !== "all" || difficultyFilter !== "all" || gradeFilter !== "all"
                ? "No worksheets found"
                : "No worksheets yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || subjectFilter !== "all" || difficultyFilter !== "all" || gradeFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Upload your first worksheet to get started"}
            </p>
            {!searchTerm && subjectFilter === "all" && difficultyFilter === "all" && gradeFilter === "all" && (
              <Button onClick={() => setShowAddWorksheet(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Worksheet
              </Button>
            )}
          </div>
        )}

        {/* Add Worksheet Dialog */}
        <Dialog open={showAddWorksheet} onOpenChange={setShowAddWorksheet}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Worksheet</DialogTitle>
              <DialogDescription>Upload a worksheet file and provide details for your students</DialogDescription>
            </DialogHeader>
            <WorksheetUploader
              onUpload={handleWorksheetUpload}
              onError={(error) =>
                toast({
                  title: "Upload Error",
                  description: error,
                  variant: "destructive",
                })
              }
            />
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  )
}
