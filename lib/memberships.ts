import { ID, Query } from "appwrite";
import { databases } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";
import type { Membership } from "./types";

function generateMembershipNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `MM-${year}-${random}`;
}

export const membershipService = {
  async getByUserId(userId: string): Promise<Membership | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MEMBERSHIPS,
        [Query.equal("userId", [userId]), Query.limit(1)]
      );
      return (response.documents[0] as unknown as Membership) || null;
    } catch (error) {
      console.error("Error fetching membership:", error);
      return null;
    }
  },

  async getAll(queries: string[] = []): Promise<Membership[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MEMBERSHIPS,
        queries
      );
      return response.documents as unknown as Membership[];
    } catch (error) {
      console.error("Error fetching memberships:", error);
      throw error;
    }
  },

  async getActive(): Promise<Membership[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MEMBERSHIPS,
        [
          Query.equal("status", ["active"]),
          Query.orderDesc("joinedAt"),
        ]
      );
      return response.documents as unknown as Membership[];
    } catch (error) {
      console.error("Error fetching active memberships:", error);
      throw error;
    }
  },

  async create(
    membership: Omit<Membership, "$id" | "$createdAt" | "$updatedAt" | "membershipNumber">
  ): Promise<Membership> {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MEMBERSHIPS,
        ID.unique(),
        {
          ...membership,
          membershipNumber: generateMembershipNumber(),
        }
      );
      return response as unknown as Membership;
    } catch (error) {
      console.error("Error creating membership:", error);
      throw error;
    }
  },

  async update(
    membershipId: string,
    data: Partial<Membership>
  ): Promise<Membership> {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.MEMBERSHIPS,
        membershipId,
        data
      );
      return response as unknown as Membership;
    } catch (error) {
      console.error("Error updating membership:", error);
      throw error;
    }
  },

  async suspend(membershipId: string): Promise<Membership> {
    return this.update(membershipId, { status: "suspended" });
  },

  async ban(membershipId: string): Promise<Membership> {
    return this.update(membershipId, { status: "banned" });
  },

  async deactivate(membershipId: string): Promise<Membership> {
    return this.update(membershipId, { status: "inactive" });
  },

  async count(): Promise<number> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MEMBERSHIPS,
        [Query.limit(1)]
      );
      return response.total;
    } catch (error) {
      console.error("Error counting memberships:", error);
      return 0;
    }
  },
};
