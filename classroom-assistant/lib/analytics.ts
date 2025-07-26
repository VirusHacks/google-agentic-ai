"use client"

// Mock analytics functions - replace with actual Firebase/analytics integration

export async function getContentAnalytics(contentId: string): Promise<any> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Generate mock data
  const now = new Date()
  const viewsByDay = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    views: Math.floor(Math.random() * 20) + 5,
  }))

  const topViewers = [
    { name: "Alice Johnson", timeSpent: 45, lastViewed: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    { name: "Bob Smith", timeSpent: 38, lastViewed: new Date(now.getTime() - 5 * 60 * 60 * 1000) },
    { name: "Carol Davis", timeSpent: 32, lastViewed: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    { name: "David Wilson", timeSpent: 28, lastViewed: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
    { name: "Eva Brown", timeSpent: 25, lastViewed: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
  ]

  return {
    totalViews: 156,
    uniqueViewers: 23,
    averageTimeSpent: 32,
    questionsAttempted: 89,
    notesCreated: 34,
    viewsByDay,
    topViewers,
  }
}
