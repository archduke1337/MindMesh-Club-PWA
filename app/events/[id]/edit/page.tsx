"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { Button, Card, Chip, Input, Label, TextField, TextArea } from "@heroui/react";
import { eventService } from "@/lib/events";
import { eventTypeService } from "@/lib/eventTypes";
import { eventTypeDataService } from "@/lib/eventTypeData";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import type { Event, EventType, EventField } from "@/lib/types";

const AUDIENCES = ["public", "member_only", "exclusive"];

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: EventField;
  value: any;
  onChange: (val: any) => void;
}) {
  switch (field.type) {
    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <Label>{field.label}{field.required && " *"}</Label>
        </div>
      );
    case "select":
      return (
        <div className="space-y-1">
          <Label>{field.label}{field.required && " *"}</Label>
          <select
            className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    case "multi-select":
      return (
        <div className="space-y-1">
          <Label>{field.label}{field.required && " *"}</Label>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => (
              <Chip
                key={opt}
                variant={Array.isArray(value) && value.includes(opt) ? "primary" : "secondary"}
                className="cursor-pointer"
                onClick={() => {
                  const arr = Array.isArray(value) ? value : [];
                  onChange(arr.includes(opt) ? arr.filter((v: string) => v !== opt) : [...arr, opt]);
                }}
              >
                {opt}
              </Chip>
            ))}
          </div>
          {(!field.options || field.options.length === 0) && (
            <Input
              placeholder="Enter values separated by commas"
              value={Array.isArray(value) ? value.join(", ") : ""}
              onChange={(e) => onChange(e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
            />
          )}
        </div>
      );
    case "number":
      return (
        <TextField variant="secondary" type="number">
          <Label>{field.label}{field.required && " *"}</Label>
          <Input
            value={value?.toString() || ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            required={field.required}
          />
        </TextField>
      );
    case "json":
      return (
        <div className="space-y-1">
          <Label>{field.label}{field.required && " *"}</Label>
          <TextArea
            placeholder="Enter JSON data..."
            value={typeof value === "string" ? value : JSON.stringify(value || {}, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            className="min-h-[80px] font-mono text-sm"
          />
        </div>
      );
    case "date":
      return (
        <TextField variant="secondary" type="date">
          <Label>{field.label}{field.required && " *"}</Label>
          <Input value={value || ""} onChange={(e) => onChange(e.target.value)} required={field.required} />
        </TextField>
      );
    case "url":
      return (
        <TextField variant="secondary">
          <Label>{field.label}{field.required && " *"}</Label>
          <Input
            placeholder="https://..."
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </TextField>
      );
    default:
      return (
        <TextField variant="secondary">
          <Label>{field.label}{field.required && " *"}</Label>
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </TextField>
      );
  }
}

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
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [customFieldData, setCustomFieldData] = useState<Record<string, any>>({});
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
    const loadTypes = async () => {
      try {
        const types = await eventTypeService.getActive();
        setEventTypes(types);
      } catch (error) {
        console.error("Error loading event types:", error);
      }
    };
    loadTypes();
  }, []);

  const loadEventType = useCallback(async (typeId: string) => {
    try {
      const type = await eventTypeService.getById(typeId);
      setSelectedEventType(type);
    } catch (error) {
      console.error("Error loading event type:", error);
    }
  }, []);

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

      if (e.eventTypeId) {
        await loadEventType(e.eventTypeId);
      }

      const existingData = await eventTypeDataService.getByEventId(eventId);
      if (existingData) {
        setCustomFieldData(existingData.fieldData || {});
      }

      setLoading(false);
    };
    if (!authLoading && eventId) loadEvent();
  }, [authLoading, eventId, router, loadEventType]);

  const updateForm = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateCustomField = (fieldName: string, value: unknown) => {
    setCustomFieldData((prev) => ({ ...prev, [fieldName]: value }));
  };

  useEffect(() => {
    if (form.eventTypeId && form.eventTypeId !== selectedEventType?.name) {
      loadEventType(form.eventTypeId);
      setCustomFieldData({});
    }
  }, [form.eventTypeId, selectedEventType, loadEventType]);

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

      if (selectedEventType?.$id && Object.keys(customFieldData).length > 0) {
        await eventTypeDataService.save(event.$id, selectedEventType.$id, customFieldData);
      }

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
            {eventTypes.map((t) => <option key={t.$id} value={t.$id}>{t.displayName}</option>)}
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

        {selectedEventType && selectedEventType.fields && selectedEventType.fields.length > 0 && (
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">{selectedEventType.displayName} Details</h3>
            {selectedEventType.fields.map((field) => (
              <DynamicField
                key={field.name}
                field={field}
                value={customFieldData[field.name]}
                onChange={(val) => updateCustomField(field.name, val)}
              />
            ))}
          </div>
        )}
      </div></Card>

      <div className="flex justify-between">
        <Button variant="secondary" onPress={() => router.back()}>Cancel</Button>
        <Button variant="primary" onPress={handleSubmit} isDisabled={saving}><Check className="w-4 h-4 mr-2" /> Save Changes</Button>
      </div>
    </div>
  );
}
