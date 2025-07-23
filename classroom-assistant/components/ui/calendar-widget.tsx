"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, Clock, Users } from "lucide-react"

interface CalendarEvent {
  id: string
  title: string
  date: Date
  time?: string
  type: "assignment" | "class" | "meeting" | "deadline"
  description?: string
  participants?: number
}

interface CalendarWidgetProps {
  events?: CalendarEvent[]
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  className?: string
}

export function CalendarWidget({ events = [], onDateSelect, onEventClick, className }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  // Generate calendar days
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentYear, currentMonth, day))
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateSelect?.(date)
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => event.date.toDateString() === date.toDateString())
  }

  const getEventTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "assignment":
        return "bg-blue-100 text-blue-800"
      case "class":
        return "bg-green-100 text-green-800"
      case "meeting":
        return "bg-purple-100 text-purple-800"
      case "deadline":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Get upcoming events (next 7 days)
  const upcomingEvents = events
    .filter((event) => {
      const eventDate = new Date(event.date)
      const weekFromNow = new Date()
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      return eventDate >= today && eventDate <= weekFromNow
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Calendar
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <Button size="sm" variant="outline" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={index} className="p-2" />
            }

            const dayEvents = getEventsForDate(date)
            const hasEvents = dayEvents.length > 0

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  p-2 text-sm rounded-md transition-colors relative
                  ${
                    isToday(date)
                      ? "bg-blue-600 text-white font-semibold"
                      : isSelected(date)
                        ? "bg-blue-100 text-blue-900"
                        : "hover:bg-gray-100"
                  }
                  ${date.getMonth() !== currentMonth ? "text-gray-400" : ""}
                `}
              >
                {date.getDate()}
                {hasEvents && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1">
                    <div className="w-1 h-1 bg-current rounded-full" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Upcoming Events</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className="flex items-start space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${getEventTypeColor(event.type)}`}>{event.type}</Badge>
                      <span className="text-xs text-gray-500">{event.date.toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-medium truncate mt-1">{event.title}</p>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                      {event.time && (
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {event.time}
                        </span>
                      )}
                      {event.participants && (
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {event.participants}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Date Events */}
        {selectedDate && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Events for {selectedDate.toLocaleDateString()}</h4>
            {getEventsForDate(selectedDate).length > 0 ? (
              <div className="space-y-2">
                {getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="p-2 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{event.title}</span>
                      <Badge className={`text-xs ${getEventTypeColor(event.type)}`}>{event.type}</Badge>
                    </div>
                    {event.time && (
                      <p className="text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {event.time}
                      </p>
                    )}
                    {event.description && <p className="text-xs text-gray-600 mt-1">{event.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No events scheduled</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
