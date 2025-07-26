"use client"

import { useCallback } from "react"
import { doc, updateDoc, increment, arrayUnion } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useContentAnalytics(contentId: string, classroomId: string) {
  const trackView = useCallback(async () => {
    try {
      const contentRef = doc(db, "content", contentId)
      const userId = "current-user-id" // Replace with actual user ID

      await updateDoc(contentRef, {
        "analytics.views": increment(1),
        "analytics.viewers": arrayUnion(userId),
        "analytics.lastViewed": new Date(),
      })
    } catch (error) {
      console.error("Failed to track view:", error)
    }
  }, [contentId])

  const trackTimeSpent = useCallback(
    async (timeSpent: number) => {
      try {
        const contentRef = doc(db, "content", contentId)

        await updateDoc(contentRef, {
          "analytics.totalTimeSpent": increment(timeSpent),
        })
      } catch (error) {
        console.error("Failed to track time spent:", error)
      }
    },
    [contentId],
  )

  return { trackView, trackTimeSpent }
}
