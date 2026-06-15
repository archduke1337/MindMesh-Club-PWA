import { ID, Query } from "appwrite";
import { databases, storage, APPWRITE_CONFIG } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";

export interface GalleryImage {
  $id?: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: string;
  uploadedBy: string;
  eventId?: string;
  departmentId?: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  tags?: string[];
  isActive: boolean;
  displayOrder?: number;
  $createdAt?: string;
  $updatedAt?: string;
}

const GALLERY_BUCKET_ID = "gallery-images";

export const galleryService = {
  async getAll(queries: string[] = []): Promise<GalleryImage[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.GALLERY, queries);
      return response.documents as unknown as GalleryImage[];
    } catch (error) { console.error("Error fetching gallery:", error); throw error; }
  },

  async getApproved(): Promise<GalleryImage[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.GALLERY, [
        Query.equal("status", ["approved"]),
        Query.equal("isActive", [true]),
        Query.orderAsc("displayOrder"),
      ]);
      return response.documents as unknown as GalleryImage[];
    } catch (error) { console.error("Error fetching approved gallery:", error); throw error; }
  },

  async getByCategory(category: string): Promise<GalleryImage[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.GALLERY, [
        Query.equal("status", ["approved"]),
        Query.equal("category", [category]),
        Query.equal("isActive", [true]),
      ]);
      return response.documents as unknown as GalleryImage[];
    } catch (error) { console.error("Error fetching gallery by category:", error); throw error; }
  },

  async getPending(): Promise<GalleryImage[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.GALLERY, [
        Query.equal("status", ["pending"]),
        Query.orderDesc("$createdAt"),
      ]);
      return response.documents as unknown as GalleryImage[];
    } catch (error) { console.error("Error fetching pending gallery:", error); throw error; }
  },

  async upload(file: File, uploadedBy: string, metadata: Partial<GalleryImage>): Promise<GalleryImage> {
    try {
      const response = await storage.createFile(GALLERY_BUCKET_ID, ID.unique(), file);
      const imageUrl = storage.getFileView(GALLERY_BUCKET_ID, response.$id).toString();
      const image = await databases.createDocument(DATABASE_ID, COLLECTIONS.GALLERY, ID.unique(), {
        title: metadata.title || file.name,
        description: metadata.description,
        imageUrl,
        category: metadata.category || "other",
        uploadedBy,
        eventId: metadata.eventId,
        departmentId: metadata.departmentId,
        status: "pending",
        tags: metadata.tags,
        isActive: true,
      });
      return image as unknown as GalleryImage;
    } catch (error) { console.error("Error uploading to gallery:", error); throw error; }
  },

  async approve(imageId: string, approvedBy: string): Promise<void> {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.GALLERY, imageId, {
        status: "approved", approvedBy, approvedAt: new Date().toISOString(),
      });
    } catch (error) { console.error("Error approving image:", error); throw error; }
  },

  async reject(imageId: string, reason: string): Promise<void> {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.GALLERY, imageId, {
        status: "rejected", rejectionReason: reason,
      });
    } catch (error) { console.error("Error rejecting image:", error); throw error; }
  },

  async delete(imageId: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.GALLERY, imageId);
    } catch (error) { console.error("Error deleting image:", error); throw error; }
  },
};

export const galleryCategories = [
  { value: "events", label: "Events" },
  { value: "workshops", label: "Workshops" },
  { value: "hackathons", label: "Hackathons" },
  { value: "team", label: "Team" },
  { value: "projects", label: "Projects" },
  { value: "other", label: "Other" },
];
