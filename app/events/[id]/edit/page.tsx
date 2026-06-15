"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { Button, Card, Chip, Input, Label, TextField, TextArea } from "@heroui/react";
import { eventService } from "@/lib/events";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import type { Event } from "@/lib/types";

const EVENT_TYPES = ["workshop", "hackathon", "seminar", "competition", "bootcamp", "meetup", "guest_lecture", "certification_exam"];
const AUDIENCES = ["public", "member_only", "exclusive"];

export default function EditEventPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole, isRoleOrAbove } = usePermissions();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", image: "", eventTypeId: "workshop", status: "draft",
    audience: "member_only", date: "", time: "", endDate: "", venue: "", location: "",
    capacity: 50, price: 0, organizerName: "", tags: [] as string[], isFeatured: false, isPremium: false,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && !isRoleOrAbove("lead")) router.push("/unauthorized");
  }, [user, authLoading, isRoleOrAbove, router]);

  useEffect(() => {
    const loadEvent = async () => {
      const e = await eventService.getById(eventId);
      if (!e) { router.push("/events"); return; }
      setEvent(e);
      setForm({
        title: e.title, description: e.description, image: e.image || "",
        eventTypeId: e.eventTypeId || "workshop", status: e.status || "draft",
        audience: e.audience || "member_only", date: e.date, time: e.time,
        endDate: e.endDate || "", venue: e.venue, location: e.location,
        capacity: e.capacity, price: e.price, organizerName: e.organizerName || "",
        tags: e.tags || [], isFeatured: e.isFeatured, isPremium: e.isPremium,
      });
      setLoading(false);
    };
    if (!authLoading && eventId) loadEvent();
  }, [authLoading, eventId, router]);

  const updateForm = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!user || !event?.$id) return;
    if (!form.title || !form.date || !form.time || !form.venue || !form.location) {
      setError("Please fill in all required fields");
      return;
    }
    setSaving(true); setError(null);
    try {
      await eventService.update(event.$id, {
        title: form.title, description: form.description, image: form.image,
        eventTypeId: form.eventTypeId, audience: form.audience as "public" | "member_only" | "exclusive",
        date: form.date, time: form.time, endDate: form.endDate || undefined,
        venue: form.venue, location: form.location, capacity: form.capacity,
        price: form.price, organizerName: form.organizerName,
        tags: form.tags, isFeatured: form.isFeatured, isPremium: form.isPremium,
      });
      router.push(`/events/${event.$id}`);
    } catch (err) { setError("Failed to update event."); console.error(err); }
    finally { setSaving(false); }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
  if (!user || !isRoleOrAbove("lead") || !event) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onPress={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div><h1 className="text-3xl font-bold">Edit Event</h1><p className="text-[var(--muted)]">Update event details</p></div>
      </div>

      <Card><div className="p-6 space-y-6">
        {error && <div className="p-3 rounded-lg bg-[var(--danger)] text-white text-sm">{error}</div>}

        <TextField variant="secondary"><Label>Event Title *</Label><Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} /></TextField>
        <div className="space-y-1"><Label>Description</Label><TextArea value={form.description} onChange={(e) => updateForm("description", e.target.value)} className="min-h-[120px]" /></div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1"><Label>Event Type</Label><select className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" value={form.eventTypeId} onChange={(e) => updateForm("eventTypeId", e.target.value)}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
          </select></div>
          <div className="space-y-1"><Label>Audience</Label><select className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" value={form.audience} onChange={(e) => updateForm("audience", e.target.value)}>
            {AUDIENCES.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
          </select></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField variant="secondary" type="date"><Label>Date *</Label><Input value={form.date} onChange={(e) => updateForm("date", e.target.value)} /></TextField>
          <TextField variant="secondary"><Label>Time *</Label><Input value={form.time} onChange={(e) => updateForm("time", e.target.value)} /></TextField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField variant="secondary"><Label>Venue *</Label><Input value={form.venue} onChange={(e) => updateForm("venue", e.target.value)} /></TextField>
          <TextField variant="secondary"><Label>Location *</Label><Input value={form.location} onChange={(e) => updateForm("location", e.target.value)} /></TextField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField variant="secondary" type="number"><Label>Capacity</Label><Input value={form.capacity.toString()} onChange={(e) => updateForm("capacity", parseInt(e.target.value) || 50)} /></TextField>
          <TextField variant="secondary" type="number"><Label>Price (₹)</Label><Input value={form.price.toString()} onChange={(e) => updateForm("price", parseInt(e.target.value) || 0)} /></TextField>
        </div>

        <TextField variant="secondary"><Label>Image URL</Label><Input value={form.image} onChange={(e) => updateForm("image", e.target.value)} /></TextField>

        <div className="flex gap-4">
          <Chip variant={form.isFeatured ? "primary" : "secondary"} color={form.isFeatured ? "accent" : "default"} className="cursor-pointer" onClick={() => updateForm("isFeatured", !form.isFeatured)}>Featured</Chip>
          <Chip variant={form.isPremium ? "primary" : "secondary"} color={form.isPremium ? "warning" : "default"} className="cursor-pointer" onClick={() => updateForm("isPremium", !form.isPremium)}>Premium</Chip>
        </div>
      </div></Card>

      <div className="flex justify-between">
        <Button variant="secondary" onPress={() => router.back()}>Cancel</Button>
        <Button variant="primary" onPress={handleSubmit} isDisabled={saving}><Check className="w-4 h-4 mr-2" /> Save Changes</Button>
      </div>
    </div>
  );
}
