"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Calendar } from "lucide-react"

interface PDFDocument {
  id: string
  url: string
  filename: string
  publicId: string
  uploadedAt: any
  classroomId?: string
  uploadedBy?: string
}

interface PDFListProps {
  classroomId?: string
  showUploadDate?: boolean
  className?: string
}

export function PDFList({ classroomId, showUploadDate = true, className = "" }: PDFListProps) {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        setLoading(true)
        setError(null)

        const q = query(collection(db, "pdfs"), orderBy("uploadedAt", "desc"))

        // If classroomId is provided, you could filter by it
        // This would require adding classroomId field when saving PDFs

        const querySnapshot = await getDocs(q)
        const pdfDocuments = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PDFDocument[]

        setPdfs(pdfDocuments)
      } catch (err: any) {
        console.error("Error fetching PDFs:", err)
        setError(err.message || "Failed to fetch PDFs")
      } finally {
        setLoading(false)
      }
    }

    fetchPDFs()
  }, [classroomId])

  const handleDownload = (pdf: PDFDocument) => {
    const link = document.createElement("a")
    link.href = pdf.url
    link.download = pdf.filename
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = (pdf: PDFDocument) => {
    window.open(pdf.url, "_blank", "noopener,noreferrer")
  }

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "Unknown"

    try {
      // Handle Firestore Timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString() + " " + date.toLocaleTimeString()
    } catch {
      return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Error loading PDFs</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (pdfs.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No PDFs uploaded yet</h3>
          <p className="text-gray-500">Upload your first PDF document to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <CardHeader className="px-0 pb-4">
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          PDF Documents ({pdfs.length})
        </CardTitle>
      </CardHeader>

      {pdfs.map((pdf) => (
        <Card key={pdf.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{pdf.filename}</h4>
                  {showUploadDate && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(pdf.uploadedAt)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  PDF
                </Badge>
                <Button size="sm" variant="outline" onClick={() => handleView(pdf)}>
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownload(pdf)}>
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
