import { ID, Query } from "appwrite";
import { databases, storage } from "./appwrite";
import { DATABASE_ID, COLLECTIONS, EVENT_IMAGES_BUCKET_ID } from "./database";
import type { Event, Registration } from "./types";
import { ticketService } from "./tickets";

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

  async deletePastEvents(): Promise<number> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [
        Query.lessThan("date", today),
      ]);
      const deletePromises = response.documents.map((doc) =>
        databases.deleteDocument(DATABASE_ID, COLLECTIONS.EVENTS, doc.$id)
      );
      await Promise.all(deletePromises);
      return response.documents.length;
    } catch (error) { console.error("Error deleting past events:", error); throw error; }
  },

  async publish(eventId: string): Promise<Event> {
    return this.update(eventId, { status: "published", publishedAt: new Date().toISOString() });
  },

  async approve(eventId: string, approvedBy: string): Promise<Event> {
    return this.update(eventId, { status: "approved", approvedBy, approvedAt: new Date().toISOString() });
  },

  async submitForReview(eventId: string): Promise<Event> {
    return this.update(eventId, { status: "review" });
  },

  async approveEvent(eventId: string, approverId: string): Promise<Event> {
    return this.update(eventId, { status: "approved", approvedBy: approverId, approvedAt: new Date().toISOString() });
  },

  async rejectEvent(eventId: string, _reason?: string): Promise<Event> {
    return this.update(eventId, { status: "cancelled" });
  },

  async cancelEvent(eventId: string): Promise<Event> {
    return this.update(eventId, { status: "cancelled" });
  },

  async completeEvent(eventId: string): Promise<Event> {
    return this.update(eventId, { status: "completed" });
  },

  async getByStatus(status: Event["status"]): Promise<Event[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [
        Query.equal("status", [status]),
        Query.orderDesc("$createdAt"),
      ]);
      return response.documents as unknown as Event[];
    } catch (error) { console.error("Error fetching events by status:", error); throw error; }
  },

  async getByOwner(ownerId: string): Promise<Event[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [
        Query.equal("ownerId", [ownerId]),
        Query.orderDesc("$createdAt"),
      ]);
      return response.documents as unknown as Event[];
    } catch (error) { console.error("Error fetching events by owner:", error); throw error; }
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

      let registrationStatus: Registration["status"] = "approved";

      if (event.audience === "exclusive") {
        registrationStatus = "pending";
      } else if (event.capacity && event.registered >= event.capacity) {
        registrationStatus = "waitlisted";
      }

      const registration = await databases.createDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, ID.unique(), {
        eventId, userId, registeredAt: new Date().toISOString(), status: registrationStatus,
      }) as unknown as Registration;

      if (registrationStatus === "approved") {
        await ticketService.create(userId, eventId, registration.$id!);
      }

      await this.update(eventId, { registered: event.registered + 1 });
      return registration;
    } catch (error) { console.error("Error registering:", error); throw error; }
  },

  async getWaitlistPosition(eventId: string, userId: string): Promise<number | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
        Query.equal("eventId", [eventId]),
        Query.equal("status", ["waitlisted"]),
        Query.orderAsc("registeredAt"),
      ]);
      const index = response.documents.findIndex((doc) => doc.userId === userId);
      return index >= 0 ? index + 1 : null;
    } catch (error) {
      console.error("Error getting waitlist position:", error);
      return null;
    }
  },

  async promoteFromWaitlist(eventId: string): Promise<Registration | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
        Query.equal("eventId", [eventId]),
        Query.equal("status", ["waitlisted"]),
        Query.orderAsc("registeredAt"),
        Query.limit(1),
      ]);

      if (response.documents.length === 0) return null;

      const nextReg = response.documents[0] as unknown as Registration;
      if (!nextReg.$id) return null;

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, nextReg.$id, {
        status: "approved",
        approvedAt: new Date().toISOString(),
      });

      await ticketService.create(nextReg.userId, eventId, nextReg.$id);

      return { ...nextReg, status: "approved" };
    } catch (error) {
      console.error("Error promoting from waitlist:", error);
      return null;
    }
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

  async getUserRegistrations(userId: string): Promise<Registration[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
        Query.equal("userId", [userId]),
        Query.orderDesc("registeredAt"),
      ]);
      return response.documents as unknown as Registration[];
    } catch (error) { console.error("Error fetching user registrations:", error); throw error; }
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
        const regDoc = existing.documents[0];
        const regStatus = regDoc.status as string;
        const regId = regDoc.$id;
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, regId);

        const ticket = await ticketService.getByUserAndEvent(userId, eventId);
        if (ticket && ticket.$id) {
          await ticketService.invalidate(ticket.$id, "Registration cancelled");
        }

        const event = await this.getById(eventId);
        if (event) {
          await this.update(eventId, { registered: Math.max(0, event.registered - 1) });

          if (regStatus !== "waitlisted") {
            await this.promoteFromWaitlist(eventId);
          }
        }
      }
    } catch (error) { console.error("Error canceling registration:", error); throw error; }
  },

  async uploadImage(file: File): Promise<string> {
    try {
      const response = await storage.createFile(EVENT_IMAGES_BUCKET_ID, ID.unique(), file);
      const fileUrl = storage.getFileView(EVENT_IMAGES_BUCKET_ID, response.$id);
      return fileUrl.toString();
    } catch (error) { console.error("Error uploading image:", error); throw error; }
  },
};
