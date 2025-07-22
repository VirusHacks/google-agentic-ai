import type { CloudinaryUploadResponse as UploadResponse } from "./cloudinary"

export interface CloudinaryUploadResponse {
  secure_url: string
  public_id: string
  format: string
  resource_type: string
  bytes: number
  width?: number
  height?: number
  created_at: string
}

/**
 * CloudinaryService: Handles file upload and deletion with Cloudinary.
 * - Uses env vars for config (see .env.local)
 * - Client-side uploads are unsigned (safe for browser)
 * - Deletion is routed through a secure API endpoint
 */
export class CloudinaryService {
  // These must be set in .env.local
  private static readonly CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
  private static readonly UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!

  /**
   * Upload a file to Cloudinary (unsigned, client-side safe)
   * @param file File to upload
   * @param onProgress Optional progress callback (0-100)
   */
  static async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<CloudinaryUploadResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", this.UPLOAD_PRESET)

      const xhr = new XMLHttpRequest()
      if (onProgress) {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100
            onProgress(progress)
          }
        })
      }
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText) as CloudinaryUploadResponse
            resolve(response)
          } catch (error) {
            reject(new Error("Failed to parse upload response"))
          }
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`))
        }
      })
      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed due to network error"))
      })
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/auto/upload`)
      xhr.send(formData)
    })
  }

  /**
   * Delete a file from Cloudinary (secure, via API route)
   * @param publicId Cloudinary public_id of the file
   * @throws Error if deletion fails
   */
  static async deleteFile(publicId: string): Promise<void> {
    // Calls a secure API route (must be implemented in /pages/api/cloudinary-delete.ts or /app/api/cloudinary-delete/route.ts)
    const res = await fetch("/api/cloudinary-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    })
    if (!res.ok) {
      let msg = "Failed to delete file"
      try {
        const data = await res.json()
        msg = data.error || msg
      } catch {}
      throw new Error(msg)
    }
  }

  /**
   * Get an optimized Cloudinary URL with transformations
   */
  static getOptimizedUrl(
    url: string,
    options: {
      width?: number
      height?: number
      quality?: "auto" | number
      format?: "auto" | "jpg" | "png" | "webp"
    } = {}
  ): string {
    if (!url.includes("cloudinary.com")) return url
    const { width, height, quality = "auto", format = "auto" } = options
    const transformations = []
    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
    if (quality) transformations.push(`q_${quality}`)
    if (format) transformations.push(`f_${format}`)
    if (transformations.length === 0) return url
    const parts = url.split("/upload/")
    if (parts.length === 2) {
      return `${parts[0]}/upload/${transformations.join(",")}/${parts[1]}`
    }
    return url
  }

  static isImageFile(filename: string): boolean {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"]
    const extension = filename.split(".").pop()?.toLowerCase()
    return imageExtensions.includes(extension || "")
  }

  static isPdfFile(filename: string): boolean {
    return filename.toLowerCase().endsWith(".pdf")
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}

// Usage:
// - For upload: await CloudinaryService.uploadFile(file, onProgress)
// - For delete: await CloudinaryService.deleteFile(publicId)
// - For optimized URL: CloudinaryService.getOptimizedUrl(url, { width: 300 })
