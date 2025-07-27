"use server"

import { db } from "@/server/db"
import { cookies } from "next/headers"

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = cookies()
  const userCookie = cookieStore.get("firebase-user")

  if (!userCookie?.value) {
    return null
  }

  try {
    const userData = JSON.parse(userCookie.value)
    return userData.uid
  } catch {
    return null
  }
}

export async function fetchUserPresentations() {
  const userId = await getCurrentUserId()

  if (!userId) {
    return []
  }

  try {
    const presentations = await db.presentation.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        slides: true,
        theme: true,
        outline: true,
        isFavorite: true,
      },
    })

    return presentations
  } catch (error) {
    console.error("Error fetching presentations:", error)
    return []
  }
}

export async function fetchPresentationById(id: string) {
  const userId = await getCurrentUserId()

  if (!userId) {
    return null
  }

  try {
    const presentation = await db.presentation.findFirst({
      where: {
        id,
        userId,
      },
    })

    return presentation
  } catch (error) {
    console.error("Error fetching presentation by ID:", error)
    return null
  }
}

export async function fetchRecentPresentations(limit = 5) {
  const userId = await getCurrentUserId()

  if (!userId) {
    return []
  }

  try {
    const presentations = await db.presentation.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true,
        slides: true,
        theme: true,
      },
    })

    return presentations
  } catch (error) {
    console.error("Error fetching recent presentations:", error)
    return []
  }
}

export async function fetchFavoritePresentations() {
  const userId = await getCurrentUserId()

  if (!userId) {
    return []
  }

  try {
    const presentations = await db.presentation.findMany({
      where: {
        userId,
        isFavorite: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true,
        slides: true,
        theme: true,
        isFavorite: true,
      },
    })

    return presentations
  } catch (error) {
    console.error("Error fetching favorite presentations:", error)
    return []
  }
}
