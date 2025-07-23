import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

export const ourFileRouter = {
  // PDF uploader for curriculum, assignments, etc.
  pdfUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // You can add authentication here if needed
      return { uploadedBy: "user" }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("PDF upload complete for:", metadata.uploadedBy)
      console.log("File URL:", file.url)
      return { uploadedBy: metadata.uploadedBy }
    }),

  // Image uploader for visual content
  imageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      return { uploadedBy: "user" }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for:", metadata.uploadedBy)
      console.log("File URL:", file.url)
      return { uploadedBy: metadata.uploadedBy }
    }),

  // General file uploader for assignments and submissions
  fileUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    text: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      return { uploadedBy: "user" }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("File upload complete for:", metadata.uploadedBy)
      console.log("File URL:", file.url)
      return { uploadedBy: metadata.uploadedBy }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
