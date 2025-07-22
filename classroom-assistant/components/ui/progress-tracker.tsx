"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Target, Flame } from "lucide-react"

interface ProgressData {
  completed: number
  pending: number
  overdue: number
  total: number
  averageScore: number
  streak: number
}

interface ProgressTrackerProps {
  data: ProgressData
}

export function ProgressTracker({ data }: ProgressTrackerProps) {
  const completionRate = data.total > 0 ? (data.completed / data.total) * 100 : 0

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return "default"
    if (score >= 80) return "secondary"
    if (score >= 70) return "outline"
    return "destructive"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Progress Tracker
        </CardTitle>
        <CardDescription>Your learning progress overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall Completion</span>
            <span className="text-sm text-gray-600">{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
          <p className="text-xs text-gray-500">
            {data.completed} of {data.total} assignments completed
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{data.completed}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{data.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{data.overdue}</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className={`h-5 w-5 ${getScoreColor(data.averageScore)}`} />
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(data.averageScore)}`}>
              {data.averageScore > 0 ? Math.round(data.averageScore) : "--"}%
            </p>
            <p className="text-xs text-gray-500">Avg Score</p>
          </div>
        </div>

        {/* Performance Badge */}
        {data.averageScore > 0 && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <Badge variant={getScoreBadgeVariant(data.averageScore)}>
              {data.averageScore >= 90
                ? "Excellent"
                : data.averageScore >= 80
                  ? "Good"
                  : data.averageScore >= 70
                    ? "Average"
                    : "Needs Improvement"}
            </Badge>
          </div>
        )}

        {/* Study Streak */}
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Flame className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Study Streak</span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-orange-600">{data.streak}</p>
            <p className="text-xs text-orange-600">days</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Quick Actions</p>
          <div className="grid grid-cols-1 gap-2">
            {data.pending > 0 && (
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm">
                <span>You have {data.pending} pending assignments</span>
                <Badge variant="secondary">Review</Badge>
              </div>
            )}
            {data.overdue > 0 && (
              <div className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                <span>{data.overdue} assignments are overdue</span>
                <Badge variant="destructive">Urgent</Badge>
              </div>
            )}
            {data.overdue === 0 && data.pending === 0 && data.completed > 0 && (
              <div className="flex items-center justify-between p-2 bg-green-50 rounded text-sm">
                <span>All caught up! Great work!</span>
                <Badge variant="default">✓</Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
