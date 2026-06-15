import { ID, Query } from "appwrite";
import { databases } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";
import type { Event, Registration } from "./types";

export const eventService = {
  async getAll(queries: string[] = []): Promise<Event[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, queries);
      return response.documents as unknown as Event[];
    } catch (error) { console.error("Error fetching events:", error); throw error; }
  },

  async getById(eventId: string): Promise<Event | null> {
    try {
      const response = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
      return response as unknown as Event;
    } catch (error) { console.error("Error fetching event:", error); return null; }
  },

  async getPublished(): Promise<Event[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [
        Query.equal("status", ["published"]),
        Query.orderAsc("date"),
      ]);
      return response.documents as unknown as Event[];
    } catch (error) { console.error("Error fetching published events:", error); throw error; }
  },

  async getUpcoming(limit = 5): Promise<Event[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [
        Query.equal("status", ["published"]),
        Query.orderAsc("date"),
        Query.limit(limit),
      ]);
      return response.documents as unknown as Event[];
    } catch (error) { console.error("Error fetching upcoming events:", error); throw error; }
  },

  async getDrafts(): Promise<Event[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [
        Query.equal("status", ["draft", "review"]),
        Query.orderDesc("$createdAt"),
      ]);
      return response.documents as unknown as Event[];
    } catch (error) { console.error("Error fetching drafts:", error); throw error; }
  },

  async create(event: Omit<Event, "$id" | "$createdAt" | "$updatedAt">): Promise<Event> {
    try {
      const response = await databases.createDocument(DATABASE_ID, COLLECTIONS.EVENTS, ID.unique(), event);
      return response as unknown as Event;
    } catch (error) { console.error("Error creating event:", error); throw error; }
  },

  async update(eventId: string, data: Partial<Event>): Promise<Event> {
    try {
      const response = await databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId, data);
      return response as unknown as Event;
    } catch (error) { console.error("Error updating event:", error); throw error; }
  },

  async delete(eventId: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
    } catch (error) { console.error("Error deleting event:", error); throw error; }
  },

  async publish(eventId: string): Promise<Event> {
    return this.update(eventId, { status: "published", publishedAt: new Date().toISOString() });
  },

  async approve(eventId: string, approvedBy: string): Promise<Event> {
    return this.update(eventId, { status: "approved", approvedBy, approvedAt: new Date().toISOString() });
  },

  async register(eventId: string, userId: string, userName: string, userEmail: string): Promise<Registration> {
    try {
      const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
        Query.equal("eventId", [eventId]),
        Query.equal("userId", [userId]),
        Query.limit(1),
      ]);
      if (existing.documents.length > 0) throw new Error("Already registered");

      const event = await this.getById(eventId);
      if (!event) throw new Error("Event not found");
      if (event.capacity && event.registered >= event.capacity) throw new Error("Event is full");

      const registration = await databases.createDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, ID.unique(), {
        eventId, userId, userName, userEmail, registeredAt: new Date().toISOString(), status: "confirmed",
      });

      await this.update(eventId, { registered: event.registered + 1 });
      return registration as unknown as Registration;
    } catch (error) { console.error("Error registering:", error); throw error; }
  },

  async getRegistrations(eventId: string): Promise<Registration[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
        Query.equal("eventId", [eventId]),
        Query.orderDesc("registeredAt"),
      ]);
      return response.documents as unknown as Registration[];
    } catch (error) { console.error("Error fetching registrations:", error); throw error; }
  },

  async isRegistered(eventId: string, userId: string): Promise<boolean> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
        Query.equal("eventId", [eventId]),
        Query.equal("userId", [userId]),
        Query.limit(1),
      ]);
      return response.documents.length > 0;
    } catch (error) { return false; }
  },

  async cancelRegistration(eventId: string, userId: string): Promise<void> {
    try {
      const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
        Query.equal("eventId", [eventId]),
        Query.equal("userId", [userId]),
        Query.limit(1),
      ]);
      if (existing.documents.length > 0) {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, existing.documents[0].$id);
        const event = await this.getById(eventId);
        if (event) await this.update(eventId, { registered: Math.max(0, event.registered - 1) });
      }
    } catch (error) { console.error("Error canceling registration:", error); throw error; }
  },
};
