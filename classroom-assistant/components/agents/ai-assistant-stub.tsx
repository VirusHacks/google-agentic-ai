"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bot, Lightbulb, BookOpen, Calendar, BarChart3, FileText, Send } from "lucide-react"

interface AIAssistantProps {
  role: "teacher" | "student"
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AIAssistantStub({ role, open, onOpenChange }: AIAssistantProps) {
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])

  const teacherSuggestions = [
    {
      icon: <FileText className="h-4 w-4" />,
      title: "Generate Worksheet",
      description: "Create custom practice problems",
      action: "worksheet",
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      title: "Lesson Planner",
      description: "Plan your next lesson",
      action: "lesson",
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      title: "Student Insights",
      description: "Analyze student performance",
      action: "insights",
    },
    {
      icon: <Lightbulb className="h-4 w-4" />,
      title: "Teaching Tips",
      description: "Get pedagogical suggestions",
      action: "tips",
    },
  ]

  const studentSuggestions = [
    {
      icon: <BookOpen className="h-4 w-4" />,
      title: "Explain Concept",
      description: "Get help understanding topics",
      action: "explain",
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      title: "Study Planner",
      description: "Create a study schedule",
      action: "schedule",
    },
    {
      icon: <FileText className="h-4 w-4" />,
      title: "Practice Problems",
      description: "Get extra practice questions",
      action: "practice",
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      title: "Progress Review",
      description: "Review your performance",
      action: "progress",
    },
  ]

  const suggestions = role === "teacher" ? teacherSuggestions : studentSuggestions

  const handleSuggestionClick = (action: string) => {
    const responses = {
      worksheet: "I can help you generate custom worksheets! What subject and difficulty level would you like?",
      lesson: "Let's plan your lesson! What topic are you teaching and how long is the class?",
      insights: "I'll analyze your students' performance. Which classroom would you like me to focus on?",
      tips: "I'd be happy to share teaching strategies! What specific challenge are you facing?",
      explain: "I'm here to help explain any concept! What topic would you like me to break down?",
      schedule: "Let's create a study plan! What subjects do you need to study and when are your exams?",
      practice: "I can generate practice problems! Which subject and topics do you want to focus on?",
      progress: "Let me review your progress! Which subject would you like me to analyze?",
    }

    const response = responses[action as keyof typeof responses] || "How can I help you today?"

    setChatHistory([{ role: "assistant", content: response }])
  }

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newHistory = [
      ...chatHistory,
      { role: "user" as const, content: message },
      {
        role: "assistant" as const,
        content:
          "I'm an AI assistant stub. In the full version, I would provide personalized help based on your request!",
      },
    ]

    setChatHistory(newHistory)
    setMessage("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bot className="h-5 w-5 mr-2 text-blue-600" />
            AI Assistant
            <Badge variant="secondary" className="ml-2">
              Beta
            </Badge>
          </DialogTitle>
          <DialogDescription>Your intelligent {role} assistant powered by AI</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="flex-1 max-h-60 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === "user" ? "bg-blue-600 text-white" : "bg-white border"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {chatHistory.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((suggestion, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSuggestionClick(suggestion.action)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        {suggestion.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{suggestion.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{suggestion.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Message Input */}
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-gray-500 text-center p-2 bg-yellow-50 rounded">
            🚧 This is a demo version. The full AI assistant will provide personalized, context-aware responses.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
