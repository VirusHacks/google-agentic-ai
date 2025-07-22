"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Send, BookOpen, Lightbulb, Calculator, Globe, Beaker, Palette } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  subject?: string
}

export default function AITutorPage() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your AI tutor. I can help you understand concepts, solve problems, and answer questions across various subjects. What would you like to learn about today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  const subjects = [
    { name: "Mathematics", icon: Calculator, color: "bg-blue-100 text-blue-600" },
    { name: "Science", icon: Beaker, color: "bg-green-100 text-green-600" },
    { name: "English", icon: BookOpen, color: "bg-purple-100 text-purple-600" },
    { name: "History", icon: Globe, color: "bg-orange-100 text-orange-600" },
    { name: "Art", icon: Palette, color: "bg-pink-100 text-pink-600" },
  ]

  const quickQuestions = [
    "Explain photosynthesis in simple terms",
    "Help me solve quadratic equations",
    "What is the difference between metaphor and simile?",
    "Explain the causes of World War I",
    "How do I improve my essay writing?",
    "What is the Pythagorean theorem?",
  ]

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
      subject: selectedSubject || undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputMessage, selectedSubject),
        sender: "ai",
        timestamp: new Date(),
        subject: selectedSubject || undefined,
      }

      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const generateAIResponse = (question: string, subject: string | null): string => {
    const responses = {
      mathematics: [
        "Let me break this down step by step. In mathematics, it's important to understand the underlying concepts before applying formulas.",
        "Great question! This is a fundamental concept in mathematics. Let me explain it with an example.",
        "I can help you solve this problem. Let's start by identifying what we know and what we need to find.",
      ],
      science: [
        "This is a fascinating topic in science! Let me explain the scientific principles behind this.",
        "Science is all about observation and understanding. Here's how this process works:",
        "That's an excellent scientific question. Let me walk you through the explanation with examples.",
      ],
      english: [
        "Language and literature are rich subjects. Let me help you understand this concept better.",
        "This is an important aspect of English language arts. Here's how to approach it:",
        "Great question about English! Let me provide you with a clear explanation and examples.",
      ],
      history: [
        "History helps us understand how we got to where we are today. Let me explain this historical event:",
        "This is a significant moment in history. Here's the context and what led to these events:",
        "Understanding history requires looking at causes and effects. Let me break this down for you:",
      ],
      default: [
        "That's an interesting question! Let me help you understand this concept better.",
        "I'd be happy to explain this to you. Let me break it down into simpler parts.",
        "Great question! Here's what you need to know about this topic:",
      ],
    }

    const subjectKey = subject?.toLowerCase() as keyof typeof responses
    const responseArray = responses[subjectKey] || responses.default
    const randomResponse = responseArray[Math.floor(Math.random() * responseArray.length)]

    return `${randomResponse}\n\nBased on your question about "${question}", here's a detailed explanation that should help you understand the concept better. Would you like me to provide more examples or clarify any specific part?`
  }

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question)
  }

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject === selectedSubject ? null : subject)
    toast({
      title: selectedSubject === subject ? "Subject Cleared" : "Subject Selected",
      description: selectedSubject === subject ? "Ready for general questions" : `Now focusing on ${subject}`,
    })
  }

  return (
    <ProtectedRoute requiredRole="student">
      <SidebarLayout role="student">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Tutor</h1>
                <p className="text-gray-600">Your personal learning assistant for all subjects</p>
              </div>
              <Badge variant="secondary">Beta</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Subject Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subjects</CardTitle>
                  <CardDescription>Select a subject to focus our conversation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {subjects.map((subject) => {
                    const Icon = subject.icon
                    const isSelected = selectedSubject === subject.name
                    return (
                      <Button
                        key={subject.name}
                        variant={isSelected ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => handleSubjectSelect(subject.name)}
                      >
                        <div
                          className={`h-6 w-6 rounded flex items-center justify-center mr-2 ${
                            isSelected ? "bg-white/20" : subject.color
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {subject.name}
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Quick Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Questions</CardTitle>
                  <CardDescription>Try these example questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full text-left h-auto p-2 text-sm"
                      onClick={() => handleQuickQuestion(question)}
                    >
                      <Lightbulb className="h-3 w-3 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{question}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        AI Tutor Chat
                      </CardTitle>
                      <CardDescription>
                        {selectedSubject ? `Focused on ${selectedSubject}` : "General tutoring mode"}
                      </CardDescription>
                    </div>
                    {selectedSubject && <Badge variant="outline">{selectedSubject}</Badge>}
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-line">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender === "user" ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}

                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask me anything about your studies..."
                      onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      disabled={isTyping}
                    />
                    <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isTyping}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Features Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>AI Tutor Features</CardTitle>
              <CardDescription>How your AI tutor can help you learn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium mb-2">Concept Explanation</h3>
                  <p className="text-sm text-gray-600">Get clear explanations of complex topics with examples</p>
                </div>
                <div className="text-center p-4">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Calculator className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">Problem Solving</h3>
                  <p className="text-sm text-gray-600">Step-by-step guidance through homework and practice problems</p>
                </div>
                <div className="text-center p-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Lightbulb className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-2">Study Tips</h3>
                  <p className="text-sm text-gray-600">Personalized learning strategies and study techniques</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  )
}
