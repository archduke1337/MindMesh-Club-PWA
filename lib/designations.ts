import { ID, Query } from "appwrite";
import { databases } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";
import type { Designation, UserDesignation } from "./types";

export const designationService = {
  async getAll(): Promise<Designation[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DESIGNATIONS,
        [Query.equal("isActive", [true]), Query.orderAsc("level")]
      );
      return response.documents as unknown as Designation[];
    } catch (error) {
      console.error("Error fetching designations:", error);
      throw error;
    }
  },

  async getById(designationId: string): Promise<Designation | null> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.DESIGNATIONS,
        designationId
      );
      return response as unknown as Designation;
    } catch (error) {
      console.error("Error fetching designation:", error);
      return null;
    }
  },

  async create(
    designation: Omit<Designation, "$id" | "$createdAt" | "$updatedAt">
  ): Promise<Designation> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.DESIGNATIONS,
        ID.unique(),
        designation
      );
      return response as unknown as Designation;
    } catch (error) {
      console.error("Error creating designation:", error);
      throw error;
    }
  },

  async update(
    designationId: string,
    data: Partial<Designation>
  ): Promise<Designation> {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DESIGNATIONS,
        designationId,
        data
      );
      return response as unknown as Designation;
    } catch (error) {
      console.error("Error updating designation:", error);
      throw error;
    }
  },

  async delete(designationId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DESIGNATIONS,
        designationId,
        { isActive: false }
      );
    } catch (error) {
      console.error("Error deleting designation:", error);
      throw error;
    }
  },

  async assign(
    userId: string,
    designationId: string,
    assignedBy: string
  ): Promise<UserDesignation> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER_DESIGNATIONS,
        ID.unique(),
        {
          userId,
          designationId,
          assignedBy,
          assignedAt: new Date().toISOString(),
          isActive: true,
        }
      );
      return response as unknown as UserDesignation;
    } catch (error) {
      console.error("Error assigning designation:", error);
      throw error;
    }
  },

  async revoke(
    userDesignationId: string,
    revokedBy: string
  ): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USER_DESIGNATIONS,
        userDesignationId,
        {
          isActive: false,
          revokedBy,
          revokedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Error revoking designation:", error);
      throw error;
    }
  },

  async getUserDesignations(userId: string): Promise<UserDesignation[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_DESIGNATIONS,
        [
          Query.equal("userId", [userId]),
          Query.equal("isActive", [true]),
        ]
      );
      return response.documents as unknown as UserDesignation[];
    } catch (error) {
      console.error("Error fetching user designations:", error);
      throw error;
    }
  },
};
