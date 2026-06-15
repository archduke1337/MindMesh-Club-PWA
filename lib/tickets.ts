import { ID, Query } from "appwrite";
import { databases } from "./appwrite";
import { DATABASE_ID, COLLECTIONS } from "./database";
import type { Ticket } from "./types";

function generateTicketCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "MM-";
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function generateQRData(ticketId: string, eventId: string): string {
  return JSON.stringify({ ticketId, eventId, timestamp: Date.now() });
}

export const ticketService = {
  async getByUserAndEvent(userId: string, eventId: string): Promise<Ticket | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TICKETS, [
        Query.equal("userId", [userId]),
        Query.equal("eventId", [eventId]),
        Query.limit(1),
      ]);
      return (response.documents[0] as unknown as Ticket) || null;
    } catch (error) { return null; }
  },

  async getUserTickets(userId: string): Promise<Ticket[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TICKETS, [
        Query.equal("userId", [userId]),
        Query.orderDesc("issuedAt"),
      ]);
      return response.documents as unknown as Ticket[];
    } catch (error) { console.error("Error fetching user tickets:", error); throw error; }
  },

  async getEventTickets(eventId: string): Promise<Ticket[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TICKETS, [
        Query.equal("eventId", [eventId]),
        Query.orderDesc("issuedAt"),
      ]);
      return response.documents as unknown as Ticket[];
    } catch (error) { console.error("Error fetching event tickets:", error); throw error; }
    },

  async create(userId: string, eventId: string, registrationId: string): Promise<Ticket> {
    try {
      const ticketCode = generateTicketCode();
      const qrData = generateQRData(ticketCode, eventId);
      const response = await databases.createDocument(DATABASE_ID, COLLECTIONS.TICKETS, ID.unique(), {
        userId, eventId, registrationId, ticketCode, qrData,
        status: "issued", issuedAt: new Date().toISOString(),
        entryCount: 0, maxEntries: 1,
      });
      return response as unknown as Ticket;
    } catch (error) { console.error("Error creating ticket:", error); throw error; }
  },

  async checkIn(ticketId: string, checkedInBy: string): Promise<Ticket> {
    try {
      const response = await databases.getDocument(DATABASE_ID, COLLECTIONS.TICKETS, ticketId);
      const ticket = response as unknown as Ticket;
      if (ticket.entryCount >= ticket.maxEntries) throw new Error("Max entries reached");
      const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.TICKETS, ticketId, {
        status: "checked_in", checkedInAt: new Date().toISOString(), checkedInBy,
        entryCount: ticket.entryCount + 1,
      });
      return updated as unknown as Ticket;
    } catch (error) { console.error("Error checking in:", error); throw error; }
  },

  async invalidate(ticketId: string, reason: string): Promise<Ticket> {
    try {
      const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.TICKETS, ticketId, {
        status: "invalidated", invalidatedAt: new Date().toISOString(), invalidatedReason: reason,
      });
      return updated as unknown as Ticket;
    } catch (error) { console.error("Error invalidating ticket:", error); throw error; }
  },
};
