"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { Button, Card, CardContent, Chip, Input, Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalBody, ModalFooter, ModalHeader, Switch, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, TextArea, useOverlayState } from "@heroui/react";
import { eventTypeService } from "@/lib/eventTypes";
import type { EventType, EventField } from "@/lib/types";
import { Loader2, ArrowLeft, Plus, Trash2, GripVertical, Settings } from "lucide-react";
import { toast } from "sonner";

const FIELD_TYPES: EventField["type"][] = ["text", "textarea", "number", "select", "multi-select", "boolean", "date", "url", "file", "json", "array"];

export default function AdminEventTypesPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRoleOrAbove } = usePermissions();
  const router = useRouter();
  const { isOpen, open, close } = useOverlayState();

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<EventType | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [form, setForm] = useState({
    name: "",
    displayName: "",
    description: "",
    icon: "",
    isActive: true,
    displayOrder: 0,
  });
  const [fields, setFields] = useState<EventField[]>([]);

  const loadEventTypes = useCallback(async () => {
    try {
      const types = await eventTypeService.getAll();
      setEventTypes(types);
    } catch (error) {
      console.error("Error loading event types:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && !isRoleOrAbove("admin")) router.push("/unauthorized");
    loadEventTypes();
  }, [user, authLoading, isRoleOrAbove, router, loadEventTypes]);

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      await eventTypeService.seedDefaults();
      await loadEventTypes();
      toast.success("Default event types seeded successfully!");
    } catch (error) {
      console.error("Error seeding defaults:", error);
      toast.error("Failed to seed default event types");
    } finally {
      setSeeding(false);
    }
  };

  const handleEdit = (type: EventType) => {
    setEditingType(type);
    setForm({
      name: type.name,
      displayName: type.displayName,
      description: type.description || "",
      icon: type.icon || "",
      isActive: type.isActive,
      displayOrder: type.displayOrder || 0,
    });
    setFields(type.fields || []);
    open();
  };

  const handleClose = () => {
    setEditingType(null);
    setForm({ name: "", displayName: "", description: "", icon: "", isActive: true, displayOrder: 0 });
    setFields([]);
    close();
  };

  const handleAddField = () => {
    setFields((prev) => [
      ...prev,
      { name: "", type: "text", label: "", required: false },
    ]);
  };

  const handleUpdateField = (index: number, updates: Partial<EventField>) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.displayName) {
      toast.error("Name and display name are required");
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...form,
        fields,
        registrationConfig: editingType?.registrationConfig || {
          defaultAudience: "member_only" as const,
          allowGuestRegistration: false,
          requiresApproval: false,
          maxTeamSize: 1 as number | "dynamic",
          waitlistEnabled: true,
          cancellationAllowed: true,
        },
        ticketConfig: editingType?.ticketConfig || {
          ticketType: "standard" as const,
          maxEntries: 1,
          qrEnabled: true,
          transferAllowed: false,
          verificationMethods: ["qr_scan" as const, "manual_search" as const],
        },
        workflowConfig: editingType?.workflowConfig || {
          draftPermission: ["lead", "event_manager"],
          approvalRequired: true,
          approverRoles: ["head", "operations_head", "admin"],
          publishAfterApproval: true,
          autoActivateAtEventTime: true,
        },
      };

      if (editingType?.$id) {
        await eventTypeService.update(editingType.$id, data);
        toast.success("Event type updated!");
      } else {
        await eventTypeService.create(data as Omit<EventType, "$id" | "$createdAt" | "$updatedAt">);
        toast.success("Event type created!");
      }

      await loadEventTypes();
      handleClose();
    } catch (error) {
      console.error("Error saving event type:", error);
      toast.error("Failed to save event type");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (type: EventType) => {
    if (!type.$id) return;
    try {
      await eventTypeService.update(type.$id, { isActive: !type.isActive });
      await loadEventTypes();
      toast.success(`Event type ${type.isActive ? "disabled" : "enabled"}!`);
    } catch (error) {
      toast.error("Failed to update event type");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event type?")) return;
    try {
      await eventTypeService.delete(id);
      await loadEventTypes();
      toast.success("Event type deleted!");
    } catch (error) {
      toast.error("Failed to delete event type");
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
        <Button variant="secondary" onPress={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Event Type Schemas</h1>
          <p className="text-[var(--muted)]">Manage event type definitions and their custom fields</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onPress={handleSeedDefaults} isDisabled={seeding}>
            {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Seed Defaults
          </Button>
          <Button variant="primary" onPress={open}>
            <Plus className="w-4 h-4 mr-2" /> Create Event Type
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table aria-label="Event types table">
              <TableHeader>
                <TableColumn>ORDER</TableColumn>
                <TableColumn>NAME</TableColumn>
                <TableColumn>DISPLAY NAME</TableColumn>
                <TableColumn>FIELDS</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {eventTypes.map((type) => (
                  <TableRow key={type.$id}>
                    <TableCell>
                      <div className="flex items-center gap-1 text-[var(--muted)]">
                        <GripVertical className="w-4 h-4" />
                        {type.displayOrder || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-[var(--surface)] px-2 py-1 rounded">{type.name}</code>
                    </TableCell>
                    <TableCell className="font-semibold">{type.displayName}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="secondary">{type.fields?.length || 0} fields</Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant={type.isActive ? "primary" : "secondary"}
                        color={type.isActive ? "success" : "default"}
                      >
                        {type.isActive ? "Active" : "Inactive"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" isIconOnly onPress={() => handleEdit(type)}>
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          isIconOnly
                          onPress={() => handleToggleActive(type)}
                        >
                          <Switch isSelected={type.isActive} size="sm" />
                        </Button>
                        <Button size="sm" variant="secondary" isIconOnly onPress={() => type.$id && handleDelete(type.$id)}>
                          <Trash2 className="w-4 h-4 text-[var(--danger)]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {eventTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="text-center py-12 text-[var(--muted)]">
                        No event types found. Click &quot;Seed Defaults&quot; to create the 8 standard event types.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal>
        <ModalBackdrop isOpen={isOpen} onOpenChange={(open: boolean) => { if (!open) handleClose(); }}>
          <ModalContainer>
            <ModalDialog>
              {({ close: dialogClose }: { close: () => void }) => (
                <form onSubmit={handleSubmit}>
                  <ModalHeader className="flex flex-col gap-1 border-b pb-4">
                    <h2 className="text-xl font-bold">
                      {editingType ? "Edit Event Type" : "Create Event Type"}
                    </h2>
                    <p className="text-sm text-[var(--muted)] font-normal">
                      Define the schema for this event type
                    </p>
                  </ModalHeader>

                  <ModalBody className="py-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Name *</label>
                        <Input
                          placeholder="e.g., workshop"
                          value={form.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, name: e.target.value }))}
                          isDisabled={!!editingType}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Display Name *</label>
                        <Input
                          placeholder="e.g., Workshop"
                          value={form.displayName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Description</label>
                      <TextArea
                        placeholder="Describe this event type..."
                        value={form.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, description: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Icon</label>
                        <Input
                          placeholder="e.g., Wrench"
                          value={form.icon}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, icon: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Display Order</label>
                        <Input
                          type="number"
                          value={form.displayOrder.toString()}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        isSelected={form.isActive}
                        onChange={(checked: boolean) => setForm((p) => ({ ...p, isActive: checked }))}
                      >
                        <span className="text-sm font-medium">Active</span>
                      </Switch>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">Custom Fields ({fields.length})</h3>
                        <Button type="button" size="sm" variant="secondary" onPress={handleAddField}>
                          <Plus className="w-3 h-3 mr-1" /> Add Field
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {fields.map((field, index) => (
                          <div key={index} className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 grid grid-cols-3 gap-2">
                                <Input
                                  size="sm"
                                  placeholder="Field name"
                                  value={field.name}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField(index, { name: e.target.value })}
                                />
                                <Input
                                  size="sm"
                                  placeholder="Label"
                                  value={field.label}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateField(index, { label: e.target.value })}
                                />
                                <select
                                  className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--background)] text-sm"
                                  value={field.type}
                                  onChange={(e) => handleUpdateField(index, { type: e.target.value as EventField["type"] })}
                                >
                                  {FIELD_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                              <Switch
                                isSelected={field.required}
                                onChange={(checked: boolean) => handleUpdateField(index, { required: checked })}
                                size="sm"
                              />
                              <Button type="button" size="sm" variant="secondary" isIconOnly onPress={() => handleRemoveField(index)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {fields.length === 0 && (
                          <p className="text-sm text-[var(--muted)] text-center py-4">
                            No custom fields defined. Click &quot;Add Field&quot; to add one.
                          </p>
                        )}
                      </div>
                    </div>
                  </ModalBody>

                  <ModalFooter className="border-t pt-4">
                    <Button variant="secondary" onPress={handleClose}>Cancel</Button>
                    <Button type="submit" variant="primary" isDisabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {editingType ? "Update" : "Create"}
                    </Button>
                  </ModalFooter>
                </form>
              )}
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    </div>
  );
}
