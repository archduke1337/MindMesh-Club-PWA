import { ID, Query } from "appwrite";
import { databases } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";
import type { EventTypeData } from "./types";

export const eventTypeDataService = {
  async getByEventId(eventId: string): Promise<EventTypeData | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.EVENT_TYPE_DATA,
        [Query.equal("eventId", [eventId]), Query.limit(1)]
      );
      return (response.documents[0] as unknown as EventTypeData) || null;
    } catch (error) {
      console.error("Error fetching event type data:", error);
      return null;
    }
  },

  async save(
    eventId: string,
    eventTypeId: string,
    fieldData: Record<string, any>
  ): Promise<EventTypeData> {
    try {
      const existing = await this.getByEventId(eventId);
      if (existing && existing.$id) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.EVENT_TYPE_DATA,
          existing.$id,
          { eventTypeId, fieldData }
        );
        return { ...existing, eventTypeId, fieldData };
      }
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.EVENT_TYPE_DATA,
        ID.unique(),
        { eventId, eventTypeId, fieldData }
      );
      return response as unknown as EventTypeData;
    } catch (error) {
      console.error("Error saving event type data:", error);
      throw error;
    }
  },

  async delete(eventId: string): Promise<void> {
    try {
      const existing = await this.getByEventId(eventId);
      if (existing && existing.$id) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.EVENT_TYPE_DATA,
          existing.$id
        );
      }
    } catch (error) {
      console.error("Error deleting event type data:", error);
      throw error;
    }
  },
};
