import { ID, Query } from "appwrite";
import { databases } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";
import type { Application, Profile } from "./types";

export const applicationService = {
  async getByUserId(userId: string): Promise<Application | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.APPLICATIONS,
        [Query.equal("userId", [userId]), Query.limit(1)]
      );
      return (response.documents[0] as unknown as Application) || null;
    } catch (error) {
      console.error("Error fetching application:", error);
      return null;
    }
  },

  async getAll(queries: string[] = []): Promise<Application[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.APPLICATIONS,
        queries
      );
      return response.documents as unknown as Application[];
    } catch (error) {
      console.error("Error fetching applications:", error);
      throw error;
    }
  },

  async getPending(): Promise<Application[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.APPLICATIONS,
        [
          Query.equal("status", ["pending"]),
          Query.orderDesc("submittedAt"),
        ]
      );
      return response.documents as unknown as Application[];
    } catch (error) {
      console.error("Error fetching pending applications:", error);
      throw error;
    }
  },

  async create(
    application: Omit<Application, "$id" | "$createdAt" | "$updatedAt">
  ): Promise<Application> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.APPLICATIONS,
        ID.unique(),
        application
      );
      return response as unknown as Application;
    } catch (error) {
      console.error("Error creating application:", error);
      throw error;
    }
  },

  async update(
    applicationId: string,
    data: Partial<Application>
  ): Promise<Application> {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.APPLICATIONS,
        applicationId,
        data
      );
      return response as unknown as Application;
    } catch (error) {
      console.error("Error updating application:", error);
      throw error;
    }
  },

  async approve(
    applicationId: string,
    reviewedBy: string
  ): Promise<Application> {
    return this.update(applicationId, {
      status: "approved",
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    });
  },

  async reject(
    applicationId: string,
    reviewedBy: string,
    reason: string
  ): Promise<Application> {
    return this.update(applicationId, {
      status: "rejected",
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
    });
  },
};
