"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { Button, Card, Chip, Input, Label, TextField, TextArea, Select, Modal } from "@heroui/react";
import { designationService } from "@/lib/designations";
import type { Designation } from "@/lib/types";
import { Plus, Edit, Trash2, Loader2, Award, Search } from "lucide-react";

const CATEGORIES = ["department", "operations", "executive", "special"];

export default function AdminDesignationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole } = usePermissions();
  const router = useRouter();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editing, setEditing] = useState<Designation | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", level: 1, category: "department", badgeIcon: "", badgeColor: "", maxHolders: 0 });
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && !isRole("admin")) router.push("/unauthorized");
  }, [user, authLoading, isRole, router]);

  useEffect(() => {
    const load = async () => {
      try { const data = await designationService.getAll(); setDesignations(data); }
      catch (error) { console.error("Failed to load designations:", error); }
      finally { setLoading(false); }
    };
    if (!authLoading && user && isRole("admin")) load();
  }, [user, authLoading, isRole]);

  const handleOpenModal = (item?: Designation) => {
    if (item) {
      setEditing(item);
      setFormData({ name: item.name, slug: item.slug, description: item.description || "", level: item.level, category: item.category, badgeIcon: item.badgeIcon || "", badgeColor: item.badgeColor || "", maxHolders: item.maxHolders || 0 });
    } else {
      setEditing(null);
      setFormData({ name: "", slug: "", description: "", level: 1, category: "department", badgeIcon: "", badgeColor: "", maxHolders: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setActionLoading(true);
    try {
      if (editing?.$id) {
        await designationService.update(editing.$id, { name: formData.name, slug: formData.slug, description: formData.description || undefined, level: formData.level, category: formData.category as "department" | "operations" | "executive" | "special", badgeIcon: formData.badgeIcon || undefined, badgeColor: formData.badgeColor || undefined, maxHolders: formData.maxHolders || undefined });
      } else {
        await designationService.create({ name: formData.name, slug: formData.slug, description: formData.description || undefined, level: formData.level, category: formData.category as "department" | "operations" | "executive" | "special", badgeIcon: formData.badgeIcon || undefined, badgeColor: formData.badgeColor || undefined, maxHolders: formData.maxHolders || undefined, isActive: true });
      }
      const data = await designationService.getAll();
      setDesignations(data);
      setIsModalOpen(false);
    } catch (error) { console.error("Failed to save:", error); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!editing?.$id) return;
    setActionLoading(true);
    try {
      await designationService.delete(editing.$id);
      setDesignations((prev) => prev.filter((d) => d.$id !== editing.$id));
      setIsDeleteOpen(false);
    } catch (error) { console.error("Failed to delete:", error); }
    finally { setActionLoading(false); }
  };

  const filtered = designations.filter((d) => {
    if (!searchQuery) return true;
    return d.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
  }
  if (!user || !isRole("admin")) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><h1 className="text-3xl font-bold">Designation Management</h1><p className="text-[var(--muted)]">Create and manage member designations</p></div>
        <Button variant="primary" onPress={() => handleOpenModal()}><Plus className="w-4 h-4 mr-2" /> Add Designation</Button>
      </div>

      <TextField variant="secondary" className="max-w-md"><Label>Search</Label><Input placeholder="Search designations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></TextField>

      {filtered.length === 0 ? (
        <Card><div className="p-12 text-center"><Award className="w-12 h-12 mx-auto text-[var(--muted)] mb-4" /><h3 className="text-lg font-semibold">No Designations</h3></div></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <Card key={item.$id}>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">{item.badgeIcon && <span className="text-xl">{item.badgeIcon}</span>}<h3 className="font-semibold">{item.name}</h3></div>
                  <Chip>Level {item.level}</Chip>
                </div>
                {item.description && <p className="text-sm text-[var(--muted)] line-clamp-2">{item.description}</p>}
                <div className="flex gap-2">
                  <Button variant="secondary" onPress={() => handleOpenModal(item)}><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                  <Button variant="danger" onPress={() => { setEditing(item); setIsDeleteOpen(true); }}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal.Backdrop isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
        <Modal.Container><Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>{editing ? "Edit Designation" : "Add Designation"}</Modal.Heading></Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <TextField variant="secondary"><Label>Name</Label><Input placeholder="e.g., CyberSec Lead" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></TextField>
              <TextField variant="secondary"><Label>Slug</Label><Input placeholder="e.g., cybersec-lead" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} /></TextField>
              <div className="space-y-1"><Label>Description</Label><TextArea placeholder="What this designation means..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-[80px]" /></div>
              <TextField variant="secondary" type="number"><Label>Level (1-10)</Label><Input value={formData.level.toString()} onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })} /></TextField>
              <div className="space-y-1"><Label>Category</Label><select className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select></div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" slot="close">Cancel</Button>
            <Button variant="primary" onPress={handleSave} isDisabled={actionLoading || !formData.name || !formData.slug}>{editing ? "Save Changes" : "Create Designation"}</Button>
          </Modal.Footer>
        </Modal.Dialog></Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Modal.Container><Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>Delete Designation</Modal.Heading></Modal.Header>
          <Modal.Body><p>Are you sure you want to delete <strong>{editing?.name}</strong>?</p></Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" slot="close">Cancel</Button>
            <Button variant="danger" onPress={handleDelete} isDisabled={actionLoading}>Delete</Button>
          </Modal.Footer>
        </Modal.Dialog></Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
