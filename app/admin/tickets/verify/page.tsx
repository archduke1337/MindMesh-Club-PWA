"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { databases } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { Query } from "appwrite";
import { toast } from "sonner";
import { Button, Card, CardContent, Chip, Input, Label, TextField } from "@heroui/react";
import { Search, CheckCircle, XCircle, User, QrCode } from "lucide-react";

interface TicketData {
  $id: string;
  ticketCode: string;
  userId: string;
  eventId: string;
  status: string;
  issuedAt: string;
  checkedInAt?: string;
  checkedInBy?: string;
}

export default function TicketVerifyPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"code" | "email">("code");
  const [loading, setLoading] = useState(false);
  const [foundTicket, setFoundTicket] = useState<TicketData | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<TicketData[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    setFoundTicket(null);
    try {
      let queries: string[];
      if (searchType === "code") {
        queries = [Query.equal("ticketCode", [searchQuery.trim()])];
      } else {
        const userResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
          Query.equal("email", [searchQuery.trim()]),
          Query.limit(1),
        ]);
        if (userResponse.documents.length === 0) {
          toast.error("No user found with that email");
          setLoading(false);
          return;
        }
        queries = [Query.equal("userId", [userResponse.documents[0].$id])];
      }

      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TICKETS, queries);
      if (response.documents.length === 0) {
        toast.error("No ticket found");
        setLoading(false);
        return;
      }

      setFoundTicket(response.documents[0] as unknown as TicketData);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to search tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (ticketId: string) => {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.TICKETS, ticketId, {
        status: "checked_in",
        checkedInAt: new Date().toISOString(),
        checkedInBy: "verifier",
      });
      toast.success("Checked in successfully!");
      setFoundTicket(null);
      setSearchQuery("");
    } catch (error) {
      console.error("Check-in failed:", error);
      toast.error("Failed to check in");
    }
  };

  const handleInvalidate = async (ticketId: string) => {
    if (!confirm("Are you sure you want to invalidate this ticket?")) return;
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.TICKETS, ticketId, {
        status: "invalidated",
        invalidatedAt: new Date().toISOString(),
        invalidatedReason: "Invalidated by verifier",
      });
      toast.success("Ticket invalidated");
      setFoundTicket(null);
      setSearchQuery("");
    } catch (error) {
      toast.error("Failed to invalidate ticket");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Ticket <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--success)] bg-clip-text text-transparent">Verification</span></h1>
        <p className="text-[var(--muted)]">Scan or search tickets to verify attendance</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <Button size="sm" variant={searchType === "code" ? "primary" : "secondary"} onPress={() => setSearchType("code")}>By Code</Button>
            <Button size="sm" variant={searchType === "email" ? "primary" : "secondary"} onPress={() => setSearchType("email")}>By Email</Button>
          </div>
          <div className="flex gap-2">
            <TextField variant="secondary" className="flex-1"><Label>Search</Label><Input placeholder={searchType === "code" ? "Enter ticket code (MM-XXXXXXXX)" : "Enter attendee email"} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} /></TextField>
            <Button variant="primary" onPress={handleSearch} isPending={loading} className="mt-6"><Search className="w-4 h-4 mr-2" /> Search</Button>
          </div>
        </CardContent>
      </Card>

      {foundTicket && (
        <Card className="border-2 border-[var(--accent)]">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <QrCode className="w-8 h-8 text-[var(--accent)]" />
                <div>
                  <h3 className="text-xl font-bold">{foundTicket.ticketCode}</h3>
                  <p className="text-sm text-[var(--muted)]">Event: {foundTicket.eventId}</p>
                </div>
              </div>
              <Chip color={foundTicket.status === "checked_in" ? "success" : foundTicket.status === "issued" ? "warning" : "danger"} variant="primary">
                {foundTicket.status}
              </Chip>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[var(--muted)]">Issued:</span> {new Date(foundTicket.issuedAt).toLocaleString()}</div>
              {foundTicket.checkedInAt && <div><span className="text-[var(--muted)]">Checked In:</span> {new Date(foundTicket.checkedInAt).toLocaleString()}</div>}
            </div>

            {foundTicket.status === "issued" && (
              <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                <Button variant="primary" onPress={() => handleCheckIn(foundTicket.$id)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Check In
                </Button>
                <Button variant="secondary" onPress={() => handleInvalidate(foundTicket.$id)}>
                  <XCircle className="w-4 h-4 mr-2" /> Invalidate
                </Button>
              </div>
            )}

            {foundTicket.status === "checked_in" && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <p className="text-sm font-semibold text-success">Already checked in</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
