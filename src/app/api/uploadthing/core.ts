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

  // Draft Proof Uploader - 8MB image / 16MB PDF max sizes
  draftProofUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(async ({ file }) => {
    console.log("[UPLOADTHING] Draft proof upload complete:", file.ufsUrl)
    return { fileUrl: file.ufsUrl }
  }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
