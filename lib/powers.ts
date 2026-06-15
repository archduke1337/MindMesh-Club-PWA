import { ID, Query } from "appwrite";
import { databases } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";
import type { Power, UserPower } from "./types";

export const powerService = {
  async getAll(): Promise<Power[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.POWERS,
        [Query.orderAsc("name")]
      );
      return response.documents as unknown as Power[];
    } catch (error) {
      console.error("Error fetching powers:", error);
      throw error;
    }
  },

  async getById(powerId: string): Promise<Power | null> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.POWERS,
        powerId
      );
      return response as unknown as Power;
    } catch (error) {
      console.error("Error fetching power:", error);
      return null;
    }
  },

  async grant(
    userId: string,
    powerId: string,
    grantedBy: string,
    departmentId?: string,
    expiresAt?: string
  ): Promise<UserPower> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER_POWERS,
        ID.unique(),
        {
          userId,
          powerId,
          grantedBy,
          grantedAt: new Date().toISOString(),
          departmentId: departmentId || null,
          expiresAt: expiresAt || null,
          isActive: true,
        }
      );
      return response as unknown as UserPower;
    } catch (error) {
      console.error("Error granting power:", error);
      throw error;
    }
  },

  async revoke(userPowerId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.USER_POWERS,
        userPowerId,
        { isActive: false }
      );
    } catch (error) {
      console.error("Error revoking power:", error);
      throw error;
    }
  },

  async getUserPowers(userId: string): Promise<UserPower[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_POWERS,
        [
          Query.equal("userId", [userId]),
          Query.equal("isActive", [true]),
        ]
      );
      return response.documents as unknown as UserPower[];
    } catch (error) {
      console.error("Error fetching user powers:", error);
      throw error;
    }
  },

  async getAllGranted(): Promise<UserPower[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_POWERS,
        [Query.equal("isActive", [true])]
      );
      return response.documents as unknown as UserPower[];
    } catch (error) {
      console.error("Error fetching granted powers:", error);
      throw error;
    }
  },
};
