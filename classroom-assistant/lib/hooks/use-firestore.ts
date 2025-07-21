"use client"

import { useState, useEffect, useCallback } from "react"
import {
  collection,
  doc,
  onSnapshot,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"

interface FirestoreState<T> {
  data: T[]
  loading: boolean
  error: string | null
  retry: () => void
}

interface FirestoreDocState<T> {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => void
}

export function useFirestoreCollection<T extends DocumentData>(
  collectionName: string,
  queryConstraints: any[] = [],
): FirestoreState<T & { id: string }> {
  const [data, setData] = useState<(T & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, authLoading } = useAuth()

  const retry = useCallback(() => {
    setError(null)
    setLoading(true)
  }, [])

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(authLoading)
      return
    }

    let unsubscribe: (() => void) | null = null

    const setupListener = async () => {
      try {
        setError(null)
        setLoading(true)

        const q =
          queryConstraints.length > 0
            ? query(collection(db, collectionName), ...queryConstraints)
            : collection(db, collectionName)

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const documents = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as (T & { id: string })[]

            setData(documents)
            setLoading(false)
          },
          (err) => {
            console.error(`Error listening to ${collectionName}:`, err)
            setError(err.message)
            setLoading(false)
          },
        )
      } catch (err: any) {
        console.error(`Error setting up listener for ${collectionName}:`, err)
        setError(err.message)
        setLoading(false)
      }
    }

    setupListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [collectionName, JSON.stringify(queryConstraints), user, authLoading])

  return { data, loading, error, retry }
}

export function useFirestoreDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string | null,
): FirestoreDocState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, authLoading } = useAuth()

  const retry = useCallback(() => {
    setError(null)
    setLoading(true)
  }, [])

  useEffect(() => {
    if (authLoading || !user || !documentId) {
      setLoading(authLoading)
      return
    }

    let unsubscribe: (() => void) | null = null

    const setupListener = async () => {
      try {
        setError(null)
        setLoading(true)

        unsubscribe = onSnapshot(
          doc(db, collectionName, documentId),
          (doc) => {
            if (doc.exists()) {
              setData({ id: doc.id, ...doc.data() } as T)
            } else {
              setData(null)
              setError("Document not found")
            }
            setLoading(false)
          },
          (err) => {
            console.error(`Error listening to ${collectionName}/${documentId}:`, err)
            setError(err.message)
            setLoading(false)
          },
        )
      } catch (err: any) {
        console.error(`Error setting up listener for ${collectionName}/${documentId}:`, err)
        setError(err.message)
        setLoading(false)
      }
    }

    setupListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [collectionName, documentId, user, authLoading])

  return { data, loading, error, retry }
}

export function useFirestoreOperations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addDocument = useCallback(async (collectionName: string, data: any) => {
    try {
      setLoading(true)
      setError(null)
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      return docRef.id
    } catch (err: any) {
      console.error(`Error adding document to ${collectionName}:`, err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDocument = useCallback(async (collectionName: string, documentId: string, data: any) => {
    try {
      setLoading(true)
      setError(null)
      await updateDoc(doc(db, collectionName, documentId), {
        ...data,
        updatedAt: new Date(),
      })
    } catch (err: any) {
      console.error(`Error updating document ${collectionName}/${documentId}:`, err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteDocument = useCallback(async (collectionName: string, documentId: string) => {
    try {
      setLoading(true)
      setError(null)
      await deleteDoc(doc(db, collectionName, documentId))
    } catch (err: any) {
      console.error(`Error deleting document ${collectionName}/${documentId}:`, err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const batchWrite = useCallback(
    async (operations: Array<{ type: "add" | "update" | "delete"; collection: string; id?: string; data?: any }>) => {
      try {
        setLoading(true)
        setError(null)
        const batch = writeBatch(db)

        operations.forEach((op) => {
          if (op.type === "add") {
            const docRef = doc(collection(db, op.collection))
            batch.set(docRef, { ...op.data, createdAt: new Date(), updatedAt: new Date() })
          } else if (op.type === "update" && op.id) {
            const docRef = doc(db, op.collection, op.id)
            batch.update(docRef, { ...op.data, updatedAt: new Date() })
          } else if (op.type === "delete" && op.id) {
            const docRef = doc(db, op.collection, op.id)
            batch.delete(docRef)
          }
        })

        await batch.commit()
      } catch (err: any) {
        console.error("Error in batch write:", err)
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return {
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    batchWrite,
  }
}
