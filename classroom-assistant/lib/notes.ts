"use client"

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Note {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export async function saveNote(contentId: string, content: string, noteId?: string): Promise<Note> {
  // This would normally get the current user from auth context
  const userId = "current-user-id" // Replace with actual user ID

  if (noteId) {
    // Update existing note
    const noteRef = doc(db, "notes", noteId)
    const updatedAt = new Date()

    await updateDoc(noteRef, {
      content,
      updatedAt,
    })

    return {
      id: noteId,
      content,
      createdAt: new Date(), // This would be fetched from existing note
      updatedAt,
    }
  } else {
    // Create new note
    const now = new Date()
    const docRef = await addDoc(collection(db, "notes"), {
      contentId,
      userId,
      content,
      createdAt: now,
      updatedAt: now,
    })

    return {
      id: docRef.id,
      content,
      createdAt: now,
      updatedAt: now,
    }
  }
}

export async function getUserNotes(contentId: string): Promise<Note[]> {
  const userId = "current-user-id" // Replace with actual user ID

  const q = query(
    collection(db, "notes"),
    where("contentId", "==", contentId),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    content: doc.data().content,
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  }))
}

export async function deleteNote(noteId: string): Promise<void> {
  await deleteDoc(doc(db, "notes", noteId))
}
