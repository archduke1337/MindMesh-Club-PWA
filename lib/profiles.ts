import { ID, Query } from "appwrite";
import { databases, storage } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";
import { APPWRITE_CONFIG } from "./appwrite";
import type { Profile } from "./types";

export const profileService = {
  async getByUserId(userId: string): Promise<Profile | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.equal("userId", [userId]), Query.limit(1)]
      );
      return (response.documents[0] as unknown as Profile) || null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  },

  async create(
    profile: Omit<Profile, "$id" | "$createdAt" | "$updatedAt">
  ): Promise<Profile> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        ID.unique(),
        profile
      );
      return response as unknown as Profile;
    } catch (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
  },

  async update(
    profileId: string,
    data: Partial<Profile>
  ): Promise<Profile> {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        profileId,
        data
      );
      return response as unknown as Profile;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  async upsert(
    userId: string,
    data: Partial<Profile>
  ): Promise<Profile> {
    const existing = await this.getByUserId(userId);
    if (existing && existing.$id) {
      return this.update(existing.$id, data);
    }
    return this.create({ userId, ...data } as Omit<Profile, "$id" | "$createdAt" | "$updatedAt">);
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const response = await storage.createFile(
        APPWRITE_CONFIG.profilePicturesBucketId,
        ID.unique(),
        file
      );
      const fileUrl = storage.getFileView(
        APPWRITE_CONFIG.profilePicturesBucketId,
        response.$id
      );
      return fileUrl.toString();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  },

  async search(query: string): Promise<Profile[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [
          Query.search("bio", query),
          Query.limit(20),
        ]
      );
      return response.documents as unknown as Profile[];
    } catch (error) {
      console.error("Error searching profiles:", error);
      return [];
    }
  },
};
