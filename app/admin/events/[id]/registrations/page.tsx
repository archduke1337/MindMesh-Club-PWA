"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { eventService } from "@/lib/events";
import { ticketService } from "@/lib/tickets";
import { databases } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import type { Event, Registration, Ticket } from "@/lib/types";
import { generateAndDownloadRegistrationPDF } from "@/lib/pdf";
import { Button, Card, CardContent, Chip, Input, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { Loader2, ArrowLeft, Download, CheckCircle, XCircle, Users, Filter } from "lucide-react";
import { toast } from "sonner";

type RegistrationWithTicket = Registration & { ticket?: Ticket };

async function updateRegistration(regId: string, data: Partial<Registration>): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.REGISTRATIONS, regId, data);
}

export default function EventRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationWithTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [bulkAction, setBulkAction] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [eventData, registrationsData] = await Promise.all([
        eventService.getById(eventId),
        eventService.getRegistrations(eventId),
      ]);

      if (!eventData) {
        router.push("/admin/events");
        return;
      }

      setEvent(eventData);

      const regsWithTickets = await Promise.all(
        registrationsData.map(async (reg) => {
          const ticket = await ticketService.getByUserAndEvent(reg.userId, eventId);
          return { ...reg, ticket: ticket || undefined };
        })
      );

      setRegistrations(regsWithTickets);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    loadData();
  }, [user, authLoading, router, loadData]);

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === "all") return true;
    return reg.status === filter;
  });

  const statusCounts = {
    all: registrations.length,
    pending: registrations.filter((r) => r.status === "pending").length,
    approved: registrations.filter((r) => r.status === "approved").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
    waitlisted: registrations.filter((r) => r.status === "waitlisted").length,
  };

  const handleApprove = async (reg: Registration) => {
    if (!reg.$id) return;
    try {
      await updateRegistration(reg.$id, { status: "approved", approvedBy: user?.$id, approvedAt: new Date().toISOString() });
      if (reg.eventId && reg.userId) {
        await ticketService.create(reg.userId, reg.eventId, reg.$id);
      }
      await loadData();
      toast.success("Registration approved!");
    } catch (error) {
      toast.error("Failed to approve registration");
    }
  };

  const handleReject = async (reg: Registration) => {
    if (!reg.$id) return;
    try {
      await updateRegistration(reg.$id, { status: "rejected" });
      await loadData();
      toast.success("Registration rejected.");
    } catch (error) {
      toast.error("Failed to reject registration");
    }
  };

  const handleBulkApprove = async () => {
    setBulkAction(true);
    const pending = registrations.filter((r) => r.status === "pending");
    try {
      for (const reg of pending) {
        if (reg.$id) {
      await updateRegistration(reg.$id, { status: "approved", approvedBy: user?.$id, approvedAt: new Date().toISOString() });
          if (reg.eventId && reg.userId) {
            await ticketService.create(reg.userId, reg.eventId, reg.$id);
          }
        }
      }
      await loadData();
      toast.success(`${pending.length} registrations approved!`);
    } catch (error) {
      toast.error("Failed to bulk approve");
    } finally {
      setBulkAction(false);
    }
  };

  const handleBulkReject = async () => {
    setBulkAction(true);
    const pending = registrations.filter((r) => r.status === "pending");
    try {
      for (const reg of pending) {
        if (reg.$id) {
      await updateRegistration(reg.$id, { status: "rejected" });
        }
      }
      await loadData();
      toast.success(`${pending.length} registrations rejected.`);
    } catch (error) {
      toast.error("Failed to bulk reject");
    } finally {
      setBulkAction(false);
    }
  };

  const handleExportPDF = () => {
    if (!event) return;
    generateAndDownloadRegistrationPDF({
      event,
      registrations: filteredRegistrations,
      generatedBy: user?.name || "Admin",
    });
    toast.success("PDF export initiated!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "success";
      case "pending": return "warning";
      case "rejected": return "danger";
      case "waitlisted": return "accent";
      case "cancelled": return "default";
      default: return "default";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onPress={() => router.push("/admin/events")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Registrations</h1>
          <p className="text-[var(--muted)]">{event?.title}</p>
        </div>
        <Button variant="secondary" onPress={handleExportPDF}>
          <Download className="w-4 h-4 mr-2" /> Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["all", "pending", "approved", "rejected", "waitlisted"] as const).map((s) => (
          <Button
            key={s}
            variant={filter === s ? "primary" : "secondary"}
            onPress={() => setFilter(s)}
            className="justify-between"
          >
            <span className="capitalize">{s}</span>
            <Chip size="sm" variant="secondary">{statusCounts[s]}</Chip>
          </Button>
        ))}
      </div>

      {filter === "pending" && registrations.filter((r) => r.status === "pending").length > 0 && (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onPress={handleBulkApprove} isDisabled={bulkAction}>
            <CheckCircle className="w-4 h-4 mr-1" /> Approve All Pending
          </Button>
          <Button variant="secondary" size="sm" onPress={handleBulkReject} isDisabled={bulkAction}>
            <XCircle className="w-4 h-4 mr-1" /> Reject All Pending
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table aria-label="Registrations table">
              <TableHeader>
                <TableColumn>#</TableColumn>
                <TableColumn>USER ID</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>TICKET</TableColumn>
                <TableColumn>REGISTERED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((reg, index) => (
                  <TableRow key={reg.$id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-[var(--surface)] px-1 py-0.5 rounded">{reg.userId}</code>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" color={getStatusColor(reg.status)} variant="primary">
                        {reg.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {reg.ticket ? (
                        <Chip size="sm" variant="secondary" color={reg.ticket.status === "checked_in" ? "success" : "default"}>
                          {reg.ticket.ticketCode} ({reg.ticket.status})
                        </Chip>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">No ticket</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--muted)]">
                      {new Date(reg.registeredAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {reg.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="secondary" isIconOnly onPress={() => handleApprove(reg)}>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button size="sm" variant="secondary" isIconOnly onPress={() => handleReject(reg)}>
                            <XCircle className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRegistrations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-12 text-[var(--muted)]">
                        <Users className="w-12 h-12 mb-4 opacity-50" />
                        <p>No registrations found{filter !== "all" ? ` with status "${filter}"` : ""}.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
