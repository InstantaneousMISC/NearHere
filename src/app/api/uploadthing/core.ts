import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

export const ourFileRouter = {
  // Logo Uploader - 4MB max size, 1 image
  logoUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(async ({ file }) => {
    console.log("[UPLOADTHING] Logo upload complete:", file.ufsUrl)
    return { fileUrl: file.ufsUrl }
  }),

  // Additional Images - 8MB max size, up to 5 images
  additionalImages: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 5,
    },
  }).onUploadComplete(async ({ file }) => {
    console.log("[UPLOADTHING] Additional image upload complete:", file.ufsUrl)
    return { fileUrl: file.ufsUrl }
  }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
