"use client"

export interface UploadThingResponse {
  url: string
  key: string
  name: string
  size: number
}

export class UploadThingService {
  static isPdfFile(filename: string): boolean {
    return /\.pdf$/i.test(filename) || 
           filename.toLowerCase().includes('pdf') ||
           filename.toLowerCase().includes('document')
  }

  static isImageFile(filename: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(filename) || 
           filename.toLowerCase().includes('image') ||
           filename.toLowerCase().includes('photo') ||
           filename.toLowerCase().includes('picture')
  }

  static isVideoFile(filename: string): boolean {
    return /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp)$/i.test(filename) || 
           filename.toLowerCase().includes('video') ||
           filename.toLowerCase().includes('movie')
  }

  static isDocumentFile(filename: string): boolean {
    return /\.(doc|docx|txt|rtf|odt|pages)$/i.test(filename) || 
           filename.toLowerCase().includes('document') ||
           filename.toLowerCase().includes('text')
  }

  static getFileIcon(filename: string): string {
    if (this.isPdfFile(filename)) return "📄"
    if (this.isImageFile(filename)) return "🖼️"
    if (this.isVideoFile(filename)) return "🎥"
    if (this.isDocumentFile(filename)) return "📝"
    return "📁"
  }

  static getFileTypeLabel(filename: string): string {
    if (this.isPdfFile(filename)) return "PDF Document"
    if (this.isImageFile(filename)) return "Image File"
    if (this.isVideoFile(filename)) return "Video File"
    if (this.isDocumentFile(filename)) return "Document"
    return "File"
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  static validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return file.size <= maxSizeBytes
  }

  static validateFileType(file: File, acceptedTypes: string[]): boolean {
    return acceptedTypes.some((type) => {
      if (type.endsWith("/*")) {
        const baseType = type.replace("/*", "")
        return file.type.startsWith(baseType)
      }
      return file.type === type || file.name.endsWith(type.replace(".", ""))
    })
  }
}
