"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { Button, Card, Chip, Input, Label, TextField, TextArea } from "@heroui/react";
import { eventService } from "@/lib/events";
import { Loader2, ArrowLeft, Check } from "lucide-react";

const EVENT_TYPES = ["workshop", "hackathon", "seminar", "competition", "bootcamp", "meetup", "guest_lecture", "certification_exam"];
const AUDIENCES = ["public", "member_only", "exclusive"];

export default function CreateEventPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole, isRoleOrAbove } = usePermissions();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const updateForm = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.title || !form.date || !form.time || !form.venue || !form.location) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true); setError(null);
    try {
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const event = await eventService.create({
        title: form.title, slug, description: form.description, image: form.image,
        eventTypeId: form.eventTypeId, status: "draft", audience: form.audience as "public" | "member_only" | "exclusive",
        date: form.date, time: form.time, endDate: form.endDate || undefined,
        venue: form.venue, location: form.location, capacity: form.capacity,
        registered: 0, price: form.price, organizerName: form.organizerName || user.name || "Unknown",
        ownerId: user.$id, tags: form.tags, isFeatured: form.isFeatured, isPremium: form.isPremium,
      });
      router.push(`/events/${event.$id}`);
    } catch (err) { setError("Failed to create event. Please try again."); console.error(err); }
    finally { setLoading(false); }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
  if (!user || !isRoleOrAbove("lead")) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onPress={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div><h1 className="text-3xl font-bold">Create Event</h1><p className="text-[var(--muted)]">Create a new event for the club</p></div>
      </div>

      <Card><div className="p-6 space-y-6">
        {error && <div className="p-3 rounded-lg bg-[var(--danger)] text-white text-sm">{error}</div>}

        <TextField variant="secondary"><Label>Event Title *</Label><Input placeholder="e.g., React Workshop" value={form.title} onChange={(e) => updateForm("title", e.target.value)} /></TextField>

        <div className="space-y-1"><Label>Description</Label><TextArea placeholder="Describe your event..." value={form.description} onChange={(e) => updateForm("description", e.target.value)} className="min-h-[120px]" /></div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1"><Label>Event Type *</Label><select className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" value={form.eventTypeId} onChange={(e) => updateForm("eventTypeId", e.target.value)}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
          </select></div>
          <div className="space-y-1"><Label>Audience *</Label><select className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" value={form.audience} onChange={(e) => updateForm("audience", e.target.value)}>
            {AUDIENCES.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
          </select></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField variant="secondary" type="date"><Label>Date *</Label><Input value={form.date} onChange={(e) => updateForm("date", e.target.value)} /></TextField>
          <TextField variant="secondary"><Label>Time *</Label><Input placeholder="e.g., 10:00 AM" value={form.time} onChange={(e) => updateForm("time", e.target.value)} /></TextField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField variant="secondary"><Label>Venue *</Label><Input placeholder="e.g., Main Auditorium" value={form.venue} onChange={(e) => updateForm("venue", e.target.value)} /></TextField>
          <TextField variant="secondary"><Label>Location *</Label><Input placeholder="e.g., Building A, Room 101" value={form.location} onChange={(e) => updateForm("location", e.target.value)} /></TextField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField variant="secondary" type="number"><Label>Capacity</Label><Input value={form.capacity.toString()} onChange={(e) => updateForm("capacity", parseInt(e.target.value) || 50)} /></TextField>
          <TextField variant="secondary" type="number"><Label>Price (₹)</Label><Input value={form.price.toString()} onChange={(e) => updateForm("price", parseInt(e.target.value) || 0)} /></TextField>
        </div>

        <TextField variant="secondary"><Label>Image URL</Label><Input placeholder="https://..." value={form.image} onChange={(e) => updateForm("image", e.target.value)} /></TextField>

        <div className="flex gap-4">
          <Chip variant={form.isFeatured ? "primary" : "secondary"} color={form.isFeatured ? "accent" : "default"} className="cursor-pointer" onClick={() => updateForm("isFeatured", !form.isFeatured)}>Featured</Chip>
          <Chip variant={form.isPremium ? "primary" : "secondary"} color={form.isPremium ? "warning" : "default"} className="cursor-pointer" onClick={() => updateForm("isPremium", !form.isPremium)}>Premium</Chip>
        </div>
      </div></Card>

      <div className="flex justify-between">
        <Button variant="secondary" onPress={() => router.back()}>Cancel</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onPress={handleSubmit} isDisabled={loading}>Save as Draft</Button>
          <Button variant="primary" onPress={async () => { updateForm("status", "review"); await handleSubmit(); }} isDisabled={loading}><Check className="w-4 h-4 mr-2" /> Submit for Review</Button>
        </div>
      </div>
    </div>
  );
}
