"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Note, Classroom } from "@/lib/types"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NoteUploader } from "@/components/forms/note-uploader"

import { useToast } from "@/hooks/use-toast"
import { Plus, FileText, ImageIcon, Video, Download, Edit, Trash2, Search, Tag, Calendar, X } from "lucide-react"

const formatDate = (d: any): string => {
  const dateObj = d?.toDate ? d.toDate() : new Date(d)
  return dateObj.toLocaleDateString()
}

export default function ClassroomNotesPage() {
  const params = useParams()
  const classroomId = params.id as string
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string>("")

  // Form states
  const [showAddNote, setShowAddNote] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    tags: [] as string[],
    fileUrl: "",
    filePublicId: "",
    filename: "",
    fileType: "",
  })
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    if (!classroomId) return

    // Fetch classroom data
    const unsubscribeClassroom = onSnapshot(doc(db, "classrooms", classroomId), (doc) => {
      if (doc.exists()) {
        setClassroom({ id: doc.id, ...doc.data() } as Classroom)
      }
      setLoading(false)
    })

    // Fetch notes
    const notesQuery = query(
      collection(db, "notes"),
      where("classroomId", "==", classroomId),
      orderBy("createdAt", "desc"),
    )
    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const noteData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[]
      setNotes(noteData)
    })

    return () => {
      unsubscribeClassroom()
      unsubscribeNotes()
    }
  }, [classroomId])

  const handleFileUpload = (url: string, filename: string, publicId: string, fileType: string) => {
    setNewNote((prev) => ({
      ...prev,
      fileUrl: url,
      filePublicId: publicId,
      filename,
      fileType,
    }))
    toast({
      title: "File Uploaded",
      description: `${filename} uploaded successfully to Cloudinary`,
    })
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !newNote.tags.includes(tagInput.trim())) {
      setNewNote((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setNewNote((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !classroom) return

    try {
      const noteData = {
        classroomId: classroom.id,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        tags: newNote.tags,
        fileUrl: newNote.fileUrl,
        filePublicId: newNote.filePublicId,
        filename: newNote.filename,
        fileType: newNote.fileType,
        createdBy: userProfile.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      if (editingNote) {
        await updateDoc(doc(db, "notes", editingNote.id), {
          ...noteData,
          updatedAt: new Date(),
        })
        toast({
          title: "Note Updated",
          description: "Your note has been updated successfully!",
        })
      } else {
        await addDoc(collection(db, "notes"), noteData)
        toast({
          title: "Note Created",
          description: "Your note has been created successfully!",
        })
      }

      // Reset form
      setNewNote({
        title: "",
        content: "",
        tags: [],
        fileUrl: "",
        filePublicId: "",
        filename: "",
        fileType: "",
      })
      setShowAddNote(false)
      setEditingNote(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setNewNote({
      title: note.title,
      content: note.content,
      tags: note.tags,
      fileUrl: note.fileUrl || "",
      filePublicId: note.filePublicId || "",
      filename: note.filename || "",
      fileType: note.fileType || "",
    })
    setShowAddNote(true)
  }

  const handleDelete = async (noteId: string) => {
    try {
      await deleteDoc(doc(db, "notes", noteId))
      toast({
        title: "Note Deleted",
        description: "Note has been deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return <ImageIcon className="h-4 w-4 text-green-600" />
      case "video":
        return <Video className="h-4 w-4 text-purple-600" />
      default:
        return <FileText className="h-4 w-4 text-blue-600" />
    }
  }

  // Filter notes based on search and tag
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = !selectedTag || note.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  // Get all unique tags
  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags)))

  if (loading) {
    return (
      <SidebarLayout role="teacher">
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading notes...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Class Notes</h1>
              <p className="text-gray-600">{classroom?.name}</p>
            </div>
            <Button onClick={() => setShowAddNote(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant={selectedTag === "" ? "default" : "outline"} size="sm" onClick={() => setSelectedTag("")}>
              All Tags
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(tag)}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="h-fit">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(note.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(note)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(note.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-3">{note.content}</p>

                {/* File attachment */}
                {note.fileUrl && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(note.fileType || "")}
                      <span className="text-xs font-medium">{note.filename}</span>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={note.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                )}

                {/* Image preview */}
                {note.fileType === "image" && note.fileUrl && (
                  <img
                    src={CloudinaryService.getOptimizedUrl(
                      note.fileUrl,
                      { width: 300, height: 200 || "/placeholder.svg" } || "/placeholder.svg",
                    )}
                    alt={note.title}
                    className="w-full h-32 object-cover rounded border"
                  />
                )}

                {/* Tags */}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedTag ? "No notes found" : "No notes yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedTag
                ? "Try adjusting your search or filter criteria"
                : "Create your first note to get started"}
            </p>
            {!searchTerm && !selectedTag && (
              <Button onClick={() => setShowAddNote(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Note
              </Button>
            )}
          </div>
        )}

        {/* Add/Edit Note Dialog */}
        <Dialog
          open={showAddNote}
          onOpenChange={(open) => {
            setShowAddNote(open)
            if (!open) {
              setEditingNote(null)
              setNewNote({
                title: "",
                content: "",
                tags: [],
                fileUrl: "",
                filePublicId: "",
                filename: "",
                fileType: "",
              })
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Edit Note" : "Add New Note"}</DialogTitle>
              <DialogDescription>
                {editingNote ? "Update your note" : "Create a new note for your class"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newNote.title}
                  onChange={(e) => setNewNote((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={newNote.content}
                  onChange={(e) => setNewNote((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your note content here..."
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {newNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newNote.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Attachment (Optional)</Label>
                <NoteUploader onUpload={handleFileUpload} label="Upload file attachment" maxSizeMB={25} />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddNote(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingNote ? "Update Note" : "Create Note"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  )
}
