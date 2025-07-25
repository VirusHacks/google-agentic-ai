"use client"

import { useEffect, useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TestTimerProps {
  duration: number // in seconds
  timeLeft: number
  onTimeUp: () => void
  onTimeUpdate: (timeLeft: number) => void
}

export function TestTimer({ duration, timeLeft, onTimeUp, onTimeUpdate }: TestTimerProps) {
  const [currentTime, setCurrentTime] = useState(timeLeft)

  useEffect(() => {
    setCurrentTime(timeLeft)
  }, [timeLeft])

  useEffect(() => {
    if (currentTime <= 0) {
      onTimeUp()
      return
    }

    const timer = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev - 1
        onTimeUpdate(newTime)

        if (newTime <= 0) {
          onTimeUp()
          return 0
        }

        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentTime, onTimeUp, onTimeUpdate])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const getTimeColor = () => {
    const percentage = (currentTime / duration) * 100
    if (percentage <= 10) return "text-red-600"
    if (percentage <= 25) return "text-orange-600"
    return "text-green-600"
  }

  const getVariant = () => {
    const percentage = (currentTime / duration) * 100
    if (percentage <= 10) return "destructive"
    if (percentage <= 25) return "secondary"
    return "default"
  }

  const showWarning = currentTime <= duration * 0.1 && currentTime > 0 // Last 10%

  return (
    <div className="space-y-2">
      <Badge variant={getVariant()} className="text-sm font-mono">
        <Clock className="h-3 w-3 mr-1" />
        {formatTime(currentTime)}
      </Badge>

      {showWarning && (
        <Alert variant="destructive" className="w-64">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Less than {Math.ceil(currentTime / 60)} minute{Math.ceil(currentTime / 60) !== 1 ? "s" : ""} remaining!
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
