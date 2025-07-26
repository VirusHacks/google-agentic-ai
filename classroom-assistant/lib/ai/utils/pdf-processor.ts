import { PDFExtract } from "pdf.js-extract"
import fetch from "node-fetch"

export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    console.log(`📄 Starting PDF text extraction from: ${pdfUrl}`)

    // Download PDF buffer
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }

    const pdfBuffer = await response.buffer()

    // Extract text using pdf.js-extract
    const pdfExtract = new PDFExtract()

    return new Promise((resolve, reject) => {
      pdfExtract.extractBuffer(pdfBuffer, {}, (err, data) => {
        if (err) {
          console.error("PDF extraction error:", err)
          reject(new Error(`PDF extraction failed: ${err.message}`))
          return
        }

        try {
          // Combine all text from all pages
          let fullText = ""

          data.pages.forEach((page, pageIndex) => {
            // Add page separator
            if (pageIndex > 0) fullText += "\n\n--- Page " + (pageIndex + 1) + " ---\n\n"

            // Sort content by vertical position (top to bottom)
            const sortedContent = page.content.sort((a, b) => b.y - a.y)

            // Group content by lines (similar y positions)
            const lines: any[][] = []
            let currentLine: any[] = []
            let lastY = -1

            sortedContent.forEach((item) => {
              if (Math.abs(item.y - lastY) > 5) {
                // New line threshold
                if (currentLine.length > 0) {
                  lines.push([...currentLine])
                  currentLine = []
                }
              }
              currentLine.push(item)
              lastY = item.y
            })

            if (currentLine.length > 0) {
              lines.push(currentLine)
            }

            // Process each line
            lines.forEach((line) => {
              // Sort items in line by x position (left to right)
              line.sort((a, b) => a.x - b.x)

              // Combine text from line
              const lineText = line
                .map((item) => item.str)
                .join(" ")
                .trim()
              if (lineText) {
                fullText += lineText + "\n"
              }
            })
          })

          // Clean up the text
          const cleanedText = fullText
            .replace(/\s+/g, " ") // Multiple spaces to single space
            .replace(/\n\s*\n/g, "\n\n") // Multiple newlines to double newline
            .trim()

          console.log(`✅ PDF text extraction completed. Length: ${cleanedText.length} characters`)

          if (cleanedText.length < 100) {
            reject(new Error("Extracted text is too short. PDF might be image-based or corrupted."))
            return
          }

          resolve(cleanedText)
        } catch (processingError) {
          console.error("Text processing error:", processingError)
          reject(new Error(`Text processing failed: ${processingError.message}`))
        }
      })
    })
  } catch (error) {
    console.error("PDF processing error:", error)
    throw new Error(`PDF processing failed: ${error.message}`)
  }
}

// Alternative method using different PDF library if needed
export async function extractTextFromPDFAlternative(pdfUrl: string): Promise<string> {
  try {
    // This could use pdf-parse or other libraries as fallback
    const pdf = require("pdf-parse")
    const response = await fetch(pdfUrl)
    const buffer = await response.buffer()

    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    console.error("Alternative PDF extraction failed:", error)
    throw error
  }
}
