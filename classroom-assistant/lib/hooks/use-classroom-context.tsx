"use client"

import type React from "react"

import { createContext, useContext } from "react"
import { useFirestoreDocument } from "./use-firestore"
import type { Classroom } from "@/lib/types"

interface ClassroomContextType {
  classroom: Classroom | null
  loading: boolean
  error: string | null
}

const ClassroomContext = createContext<ClassroomContextType>({
  classroom: null,
  loading: true,
  error: null,
})

export function useClassroomContext() {
  return useContext(ClassroomContext)
}

export function ClassroomProvider({
  children,
  classroomId,
}: {
  children: React.ReactNode
  classroomId: string
}) {
  const { data: classroom, loading, error } = useFirestoreDocument<Classroom>("classrooms", classroomId)

  return <ClassroomContext.Provider value={{ classroom, loading, error }}>{children}</ClassroomContext.Provider>
}
