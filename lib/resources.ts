import { ID, Query } from "appwrite";
import { databases, storage } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";

export interface Resource {
  $id?: string;
  title: string;
  description: string;
  category: "common" | "department" | "role";
  type: "document" | "link" | "video" | "file";
  url?: string;
  fileId?: string;
  departmentId?: string;
  requiredRole?: string;
  uploadedBy: string;
  uploadedByName: string;
  tags?: string[];
  downloads: number;
  isActive: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

const RESOURCES_BUCKET_ID = "resources";

export const resourceService = {
  async getAll(): Promise<Resource[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, [
        Query.equal("isActive", [true]),
        Query.orderDesc("$createdAt"),
      ]);
      return response.documents as unknown as Resource[];
    } catch (error) { console.error("Error fetching resources:", error); throw error; }
  },

  async getCommon(): Promise<Resource[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, [
        Query.equal("category", ["common"]),
        Query.equal("isActive", [true]),
        Query.orderDesc("$createdAt"),
      ]);
      return response.documents as unknown as Resource[];
    } catch (error) { console.error("Error fetching common resources:", error); throw error; }
  },

  async getByDepartment(departmentId: string): Promise<Resource[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, [
        Query.equal("departmentId", [departmentId]),
        Query.equal("isActive", [true]),
        Query.orderDesc("$createdAt"),
      ]);
      return response.documents as unknown as Resource[];
    } catch (error) { console.error("Error fetching department resources:", error); throw error; }
  },

  async getByRole(requiredRole: string): Promise<Resource[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, [
        Query.equal("requiredRole", [requiredRole]),
        Query.equal("isActive", [true]),
        Query.orderDesc("$createdAt"),
      ]);
      return response.documents as unknown as Resource[];
    } catch (error) { console.error("Error fetching role resources:", error); throw error; }
  },

  async create(resource: Omit<Resource, "$id" | "$createdAt" | "$updatedAt" | "downloads">): Promise<Resource> {
    try {
      const response = await databases.createDocument(DATABASE_ID, COLLECTIONS.RESOURCES, ID.unique(), {
        ...resource,
        downloads: 0,
      });
      return response as unknown as Resource;
    } catch (error) { console.error("Error creating resource:", error); throw error; }
  },

  async update(id: string, data: Partial<Resource>): Promise<void> {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.RESOURCES, id, data);
    } catch (error) { console.error("Error updating resource:", error); throw error; }
  },

  async delete(id: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.RESOURCES, id);
    } catch (error) { console.error("Error deleting resource:", error); throw error; }
  },

  async uploadFile(file: File): Promise<string> {
    try {
      const response = await storage.createFile(RESOURCES_BUCKET_ID, ID.unique(), file);
      return storage.getFileView(RESOURCES_BUCKET_ID, response.$id).toString();
    } catch (error) { console.error("Error uploading resource file:", error); throw error; }
  },

  async incrementDownloads(id: string, current: number): Promise<void> {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.RESOURCES, id, { downloads: current + 1 });
    } catch (error) { console.error("Error incrementing downloads:", error); }
  },
};

export const resourceCategories = [
  { value: "common", label: "Common Library" },
  { value: "department", label: "Department Resources" },
  { value: "role", label: "Role-Specific" },
];

export const resourceTypes = [
  { value: "document", label: "Document" },
  { value: "link", label: "External Link" },
  { value: "video", label: "Video" },
  { value: "file", label: "File" },
];
