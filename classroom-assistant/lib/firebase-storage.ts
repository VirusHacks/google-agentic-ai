export const FirebaseStorageService = {
  // Deprecated - use CloudinaryService instead
  getStoragePath: (storageType: string, classroomId?: string, filename?: string) => {
    console.warn("FirebaseStorageService is deprecated. Use CloudinaryService instead.")
    return ""
  },

  uploadFile: async (file: File, path: string, onProgress?: (progress: number) => void) => {
    console.warn("FirebaseStorageService is deprecated. Use CloudinaryService instead.")
    throw new Error("Use CloudinaryService.uploadFile instead")
  },

  // Deprecated - use CloudinaryService instead
  deleteFile: async (path: string): Promise<void> => {
    console.warn("FirebaseStorageService is deprecated. Use CloudinaryService instead.")
    throw new Error("Use CloudinaryService.deleteFile instead")
  },

  // Deprecated - use CloudinaryService instead
  getFileExtension: (filename: string): string => {
    console.warn("FirebaseStorageService is deprecated. Use CloudinaryService instead.")
    return ""
  },

  // Deprecated - use CloudinaryService instead
  isImageFile: (filename: string): boolean => {
    console.warn("FirebaseStorageService is deprecated. Use CloudinaryService instead.")
    return false
  },

  // Deprecated - use CloudinaryService instead
  isVideoFile: (filename: string): boolean => {
    console.warn("FirebaseStorageService is deprecated. Use CloudinaryService instead.")
    return false
  },

  // Deprecated - use CloudinaryService instead
  isPdfFile: (filename: string): boolean => {
    console.warn("FirebaseStorageService is deprecated. Use CloudinaryService instead.")
    return false
  },

  // Deprecated - use CloudinaryService instead
  formatFileSize: (bytes: number): string => {
    console.warn("FirebaseStorageService is deprecated. Use CloudinaryService instead.")
    return ""
  },
}
