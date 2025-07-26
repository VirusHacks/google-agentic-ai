"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Edit3, Trash2, Plus, StickyNote } from "lucide-react"
import { saveNote, getUserNotes, deleteNote } from "@/lib/notes"

interface Note {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
}

interface NotesTabProps {
  contentId: string
}

export function NotesTab({ contentId }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotes()
  }, [contentId])

  const loadNotes = async () => {
    try {
      const userNotes = await getUserNotes(contentId)
      setNotes(userNotes)
    } catch (error) {
      console.error("Failed to load notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNewNote = async () => {
    if (!newNote.trim()) return

    setSaving(true)
    try {
      const savedNote = await saveNote(contentId, newNote.trim())
      setNotes((prev) => [savedNote, ...prev])
      setNewNote("")
    } catch (error) {
      console.error("Failed to save note:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note.id)
    setEditContent(note.content)
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return

    setSaving(true)
    try {
      const updatedNote = await saveNote(contentId, editContent.trim(), noteId)
      setNotes((prev) => prev.map((note) => (note.id === noteId ? updatedNote : note)))
      setEditingNote(null)
      setEditContent("")
    } catch (error) {
      console.error("Failed to update note:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId)
      setNotes((prev) => prev.filter((note) => note.id !== noteId))
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditingNote(null)
    setEditContent("")
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900">My Notes</h3>
          <Badge variant="secondary" className="bg-green-50 text-green-700">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </Badge>
        </div>
        <p className="text-sm text-slate-600 mt-1">Take notes while studying this content</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* New Note */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-900">Add New Note</span>
              </div>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write your thoughts, questions, or key takeaways..."
                className="min-h-[100px] border-slate-300 focus:border-slate-500"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNewNote}
                  disabled={!newNote.trim() || saving}
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Save className="w-3 h-3 mr-2" />
                  Save Note
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Notes */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {editingNote === note.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[100px] border-slate-300 focus:border-slate-500"
                      />
                      <div className="flex justify-end gap-2">
                        <Button onClick={handleCancelEdit} variant="outline" size="sm">
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSaveEdit(note.id)}
                          disabled={!editContent.trim() || saving}
                          size="sm"
                          className="bg-slate-900 hover:bg-slate-800 text-white"
                        >
                          <Save className="w-3 h-3 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-slate-700 leading-relaxed flex-1">{note.content}</p>
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            onClick={() => handleEditNote(note)}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteNote(note.id)}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          Created: {note.createdAt.toLocaleDateString()} at{" "}
                          {note.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {note.updatedAt.getTime() !== note.createdAt.getTime() && (
                          <span>
                            Updated: {note.updatedAt.toLocaleDateString()} at{" "}
                            {note.updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <StickyNote className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-900 mb-2">No notes yet</h4>
            <p className="text-slate-600">Start taking notes to remember key insights</p>
          </div>
        )}
      </div>
    </div>
  )
}
