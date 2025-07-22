"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SidebarLayout } from "@/components/layout/sidebar-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileUpload } from "@/components/forms/file-upload"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, FileText, Lightbulb, Download, Upload, Wand2 } from "lucide-react"

export default function LectureSummarizerPage() {
  const { toast } = useToast()
  const [inputText, setInputText] = useState("")
  const [uploadedFile, setUploadedFile] = useState<{ url: string; filename: string } | null>(null)
  const [summary, setSummary] = useState("")
  const [keyPoints, setKeyPoints] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleSummarize = async () => {
    if (!inputText.trim() && !uploadedFile) {
      toast({
        title: "Input Required",
        description: "Please provide text or upload a file to summarize.",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    setProgress(0)

    // Simulate AI processing with progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 20
      })
    }, 500)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock AI-generated summary and key points
      const mockSummary = `This lecture covers the fundamental concepts of ${inputText.includes("math") ? "mathematics" : "the subject matter"}, including theoretical foundations and practical applications. The content emphasizes critical thinking and problem-solving approaches that students can apply in real-world scenarios.

Key learning objectives include understanding core principles, developing analytical skills, and building a foundation for advanced topics. The material is structured to promote progressive learning and conceptual mastery.`

      const mockKeyPoints = [
        "Introduction to fundamental concepts and terminology",
        "Theoretical framework and underlying principles",
        "Practical applications and real-world examples",
        "Problem-solving methodologies and approaches",
        "Critical thinking and analytical skill development",
        "Foundation building for advanced topics",
        "Assessment criteria and learning outcomes",
      ]

      setSummary(mockSummary)
      setKeyPoints(mockKeyPoints)
      setProgress(100)

      toast({
        title: "Summary Generated",
        description: "Your lecture has been successfully summarized!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
      clearInterval(progressInterval)
    }
  }

  const handleFileUpload = (url: string, filename: string) => {
    setUploadedFile({ url, filename })
    toast({
      title: "File Uploaded",
      description: `${filename} has been uploaded successfully.`,
    })
  }

  const handleDownloadSummary = () => {
    const content = `LECTURE SUMMARY\n\n${summary}\n\nKEY POINTS:\n${keyPoints.map((point, index) => `${index + 1}. ${point}`).join("\n")}`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "lecture-summary.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearAll = () => {
    setInputText("")
    setUploadedFile(null)
    setSummary("")
    setKeyPoints([])
    setProgress(0)
  }

  return (
    <ProtectedRoute requiredRole="teacher">
      <SidebarLayout role="teacher">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Lecture Summarizer</h1>
                <p className="text-gray-600">Transform your curriculum into digestible lesson summaries</p>
              </div>
              <Badge variant="secondary">Beta</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Input Content
                  </CardTitle>
                  <CardDescription>Provide lecture content through text input or file upload</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lecture Text</label>
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste your lecture content, curriculum text, or notes here..."
                      rows={8}
                      className="resize-none"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload File</label>
                    <FileUpload
                      onUploadComplete={handleFileUpload}
                      acceptedTypes={["application/pdf", ".doc", ".docx", ".txt"]}
                      maxSizeMB={10}
                      storageType="content"
                    />
                    {uploadedFile && (
                      <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">{uploadedFile.filename}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Processing Options</CardTitle>
                  <CardDescription>Customize your summary preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Summary Length</label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="brief">Brief (2-3 paragraphs)</option>
                        <option value="detailed">Detailed (4-6 paragraphs)</option>
                        <option value="comprehensive">Comprehensive (Full analysis)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Focus Area</label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="general">General Overview</option>
                        <option value="key-concepts">Key Concepts</option>
                        <option value="practical">Practical Applications</option>
                        <option value="assessment">Assessment Points</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSummarize}
                      disabled={processing || (!inputText.trim() && !uploadedFile)}
                      className="flex-1"
                    >
                      {processing ? (
                        <>
                          <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate Summary
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={clearAll}>
                      Clear All
                    </Button>
                  </div>

                  {processing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing lecture content...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Generated Summary
                  </CardTitle>
                  <CardDescription>AI-generated summary of your lecture content</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm leading-relaxed whitespace-pre-line">{summary}</p>
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={handleDownloadSummary}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Summary
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Your generated summary will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2" />
                    Key Points
                  </CardTitle>
                  <CardDescription>Important takeaways and learning objectives</CardDescription>
                </CardHeader>
                <CardContent>
                  {keyPoints.length > 0 ? (
                    <div className="space-y-2">
                      {keyPoints.map((point, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <p className="text-sm text-blue-800">{point}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Key points will be extracted here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Features Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>AI-powered lecture summarization features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">Multiple Input Methods</h3>
                  <p className="text-sm text-gray-600">Support for text input, PDF, Word documents, and more</p>
                </div>
                <div className="text-center p-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Wand2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium mb-2">AI Processing</h3>
                  <p className="text-sm text-gray-600">Advanced natural language processing for accurate summaries</p>
                </div>
                <div className="text-center p-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Download className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-2">Export Options</h3>
                  <p className="text-sm text-gray-600">Download summaries in various formats for easy sharing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  )
}
