"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UploadThingService } from "@/lib/uploadthing-service"
import {
  Plus,
  Calendar,
  Users,
  FileText,
  ExternalLink,
  Download,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import type { Assignment } from "@/lib/types"

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

// Helper to format dates from Firestore Timestamp or native Date
const formatDate = (d: any): string => {
  const dateObj = d?.toDate ? d.toDate() : d
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface PDFViewerModalProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string
  title: string
}

function PDFViewerModal({ isOpen, onClose, pdfUrl, title }: PDFViewerModalProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error)
    setLoading(false)
  }

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages || 1, prev + 1))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.2))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold truncate">{title}</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={pdfUrl} download>
                <Download className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex justify-center">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading PDF...</div>
              </div>
            ) : (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                className="shadow-lg"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  className="border border-gray-300 bg-white"
                />
              </Document>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        {numPages && (
          <div className="flex items-center justify-between p-4 border-t bg-white">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <span className="text-sm font-medium">
              Page {pageNumber} of {numPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface AssignmentsTabProps {
  assignments: Assignment[]
  onShowAddAssignment: () => void
  onDeleteAssignment: (assignmentId: string) => void
  onEditAssignment?: (assignment: Assignment) => void
}

export function AssignmentsTab({
  assignments,
  onShowAddAssignment,
  onDeleteAssignment,
  onEditAssignment,
}: AssignmentsTabProps) {
  const [pdfViewer, setPdfViewer] = useState<{
    isOpen: boolean
    url: string
    title: string
  }>({
    isOpen: false,
    url: '',
    title: ''
  })

  const openPdfViewer = (url: string, title: string) => {
    setPdfViewer({
      isOpen: true,
      url,
      title
    })
  }

  const closePdfViewer = () => {
    setPdfViewer({
      isOpen: false,
      url: '',
      title: ''
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-xl font-semibold">Assignments</h3>
        <Button onClick={onShowAddAssignment}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      <div className="space-y-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h4 className="font-medium text-xl">{assignment.title}</h4>
                    <Badge variant="outline">{assignment.totalPoints} points</Badge>
                  </div>
                  <p className="text-gray-600 mb-4">{assignment.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due: {formatDate(assignment.dueDate)}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {Object.keys(assignment.submissions || {}).length} submissions
                    </span>
                  </div>
                  
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">Attachments:</h5>
                      <div className="space-y-2">
                        {assignment.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm flex-1">Attachment {index + 1}</span>
                            <div className="flex gap-1">
                              {UploadThingService.isPdfFile(attachment) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openPdfViewer(attachment, `${assignment.title} - Attachment ${index + 1}`)}
                                >
                                  Preview
                                </Button>
                              )}
                              <Button size="sm" variant="outline" asChild>
                                <a href={attachment} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <a href={attachment} download>
                                  <Download className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {onEditAssignment && (
                    <Button size="sm" variant="outline" onClick={() => onEditAssignment(assignment)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onDeleteAssignment(assignment.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {assignments.length === 0 && (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-gray-500 mb-6">Create assignments to track student progress</p>
            <Button onClick={onShowAddAssignment}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Assignment
            </Button>
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={pdfViewer.isOpen}
        onClose={closePdfViewer}
        pdfUrl={pdfViewer.url}
        title={pdfViewer.title}
      />
    </div>
  )
}