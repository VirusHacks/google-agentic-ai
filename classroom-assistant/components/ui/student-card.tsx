"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Mail, Calendar, TrendingUp, Clock, AlertCircle, Trash2, Award, Target } from "lucide-react"

interface StudentData {
  id: string
  displayName: string
  email: string
  photoURL?: string
  joinedAt: Date
  stats: {
    assignmentsCompleted: number
    assignmentsPending: number
    assignmentsOverdue: number
    averageScore: number
    lastActive: Date
    streak: number
  }
  recentGrades: Array<{
    assignmentTitle: string
    score: number
    maxScore: number
    date: Date
  }>
}

interface StudentCardProps {
  student: StudentData
  onRemove?: (studentId: string) => void
  showRemoveButton?: boolean
  className?: string
}

export function StudentCard({ student, onRemove, showRemoveButton = false, className }: StudentCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getActivityStatus = (lastActive: Date) => {
    const now = new Date()
    const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)

    if (diffHours < 24) return { status: "Active today", color: "text-green-600" }
    if (diffHours < 168) return { status: "Active this week", color: "text-blue-600" }
    return { status: "Inactive", color: "text-gray-500" }
  }

  const activityStatus = getActivityStatus(student.stats.lastActive)
  const completionRate =
    student.stats.assignmentsCompleted + student.stats.assignmentsPending > 0
      ? (student.stats.assignmentsCompleted / (student.stats.assignmentsCompleted + student.stats.assignmentsPending)) *
        100
      : 0

  return (
    <Card className={`h-fit ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.photoURL || "/placeholder.svg"} alt={student.displayName} />
              <AvatarFallback className="bg-blue-100 text-blue-600">{getInitials(student.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{student.displayName}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Mail className="h-3 w-3 mr-1" />
                {student.email}
              </div>
              <div className="flex items-center text-xs text-gray-400 mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                Joined {student.joinedAt.toLocaleDateString()}
              </div>
            </div>
          </div>
          {showRemoveButton && onRemove && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(student.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Performance Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className={`text-2xl font-bold ${getPerformanceColor(student.stats.averageScore)}`}>
              {student.stats.averageScore}%
            </div>
            <p className="text-xs text-gray-500">Average Score</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{student.stats.assignmentsCompleted}</div>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </div>

        {/* Assignment Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Assignment Progress</span>
            <span className="text-sm text-gray-600">{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {student.stats.assignmentsPending} Pending
          </Badge>

          {student.stats.assignmentsOverdue > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              {student.stats.assignmentsOverdue} Overdue
            </Badge>
          )}

          {student.stats.streak > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {student.stats.streak} day streak
            </Badge>
          )}
        </div>

        {/* Activity Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Last Active:</span>
          <span className={activityStatus.color}>{activityStatus.status}</span>
        </div>

        {/* Recent Grades */}
        {student.recentGrades.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Grades</h4>
            <div className="space-y-1">
              {student.recentGrades.slice(0, 3).map((grade, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1 mr-2">{grade.assignmentTitle}</span>
                  <div className="flex items-center space-x-1">
                    <span className={`font-medium ${getPerformanceColor((grade.score / grade.maxScore) * 100)}`}>
                      {grade.score}/{grade.maxScore}
                    </span>
                    {grade.score === grade.maxScore && <Award className="h-3 w-3 text-yellow-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
            <TrendingUp className="h-3 w-3 mr-1" />
            View Progress
          </Button>
          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
            <Mail className="h-3 w-3 mr-1" />
            Message
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
