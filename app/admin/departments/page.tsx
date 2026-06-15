"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { Button, Card, Chip, Input, Label, TextField, TextArea, Select, Modal } from "@heroui/react";
import { departmentService } from "@/lib/departments";
import type { Department } from "@/lib/types";
import { Plus, Edit, Trash2, Loader2, Building2, Search } from "lucide-react";

const CATEGORIES = ["technical", "content", "operations"];

export default function AdminDepartmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole } = usePermissions();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", icon: "", color: "", category: "technical" });
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && !isRole("admin")) router.push("/unauthorized");
  }, [user, authLoading, isRole, router]);

  useEffect(() => {
    const loadDepartments = async () => {
      try { const depts = await departmentService.getAll(); setDepartments(depts); }
      catch (error) { console.error("Failed to load departments:", error); }
      finally { setLoading(false); }
    };
    if (!authLoading && user && isRole("admin")) loadDepartments();
  }, [user, authLoading, isRole]);

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({ name: dept.name, slug: dept.slug, description: dept.description || "", icon: dept.icon || "", color: dept.color || "", category: dept.category });
    } else {
      setEditingDept(null);
      setFormData({ name: "", slug: "", description: "", icon: "", color: "", category: "technical" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setActionLoading(true);
    try {
      if (editingDept?.$id) {
        await departmentService.update(editingDept.$id, { name: formData.name, slug: formData.slug, description: formData.description || undefined, icon: formData.icon || undefined, color: formData.color || undefined, category: formData.category as "technical" | "content" | "operations" });
      } else {
        await departmentService.create({ name: formData.name, slug: formData.slug, description: formData.description || undefined, icon: formData.icon || undefined, color: formData.color || undefined, category: formData.category as "technical" | "content" | "operations", isActive: true });
      }
      const depts = await departmentService.getAll();
      setDepartments(depts);
      setIsModalOpen(false);
    } catch (error) { console.error("Failed to save department:", error); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!editingDept?.$id) return;
    setActionLoading(true);
    try {
      await departmentService.delete(editingDept.$id);
      setDepartments((prev) => prev.filter((d) => d.$id !== editingDept.$id));
      setIsDeleteOpen(false);
    } catch (error) { console.error("Failed to delete department:", error); }
    finally { setActionLoading(false); }
  };

  const filteredDepts = departments.filter((dept) => {
    if (!searchQuery) return true;
    return dept.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
  }
  if (!user || !isRole("admin")) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><h1 className="text-3xl font-bold">Department Management</h1><p className="text-[var(--muted)]">Create and manage club departments</p></div>
        <Button variant="primary" onPress={() => handleOpenModal()}><Plus className="w-4 h-4 mr-2" /> Add Department</Button>
      </div>

      <TextField variant="secondary" className="max-w-md"><Label>Search</Label><Input placeholder="Search departments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></TextField>

      {filteredDepts.length === 0 ? (
        <Card><div className="p-12 text-center"><Building2 className="w-12 h-12 mx-auto text-[var(--muted)] mb-4" /><h3 className="text-lg font-semibold">No Departments</h3></div></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepts.map((dept) => (
            <Card key={dept.$id}>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">{dept.icon && <span className="text-2xl">{dept.icon}</span>}<h3 className="font-semibold">{dept.name}</h3></div>
                  <Chip>{dept.category}</Chip>
                </div>
                {dept.description && <p className="text-sm text-[var(--muted)] line-clamp-2">{dept.description}</p>}
                <div className="flex gap-2">
                  <Button variant="secondary" onPress={() => handleOpenModal(dept)}><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                  <Button variant="danger" onPress={() => { setEditingDept(dept); setIsDeleteOpen(true); }}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal.Backdrop isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
        <Modal.Container><Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>{editingDept ? "Edit Department" : "Add Department"}</Modal.Heading></Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <TextField variant="secondary"><Label>Name</Label><Input placeholder="e.g., AI/ML" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></TextField>
              <TextField variant="secondary"><Label>Slug</Label><Input placeholder="e.g., ai-ml" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} /></TextField>
              <div className="space-y-1"><Label>Description</Label><TextArea placeholder="Department description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-[80px]" /></div>
              <TextField variant="secondary"><Label>Icon</Label><Input placeholder="Emoji or icon name" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} /></TextField>
              <div className="space-y-1"><Label>Category</Label><Select selectedKeys={[formData.category]} onSelectionChange={(keys) => setFormData({ ...formData, category: Array.from(keys)[0] as string })}>
                {CATEGORIES.map((cat) => <Select.Item key={cat}>{cat}</Select.Item>)}
              </Select></div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" slot="close">Cancel</Button>
            <Button variant="primary" onPress={handleSave} isDisabled={actionLoading || !formData.name || !formData.slug}>{editingDept ? "Save Changes" : "Create Department"}</Button>
          </Modal.Footer>
        </Modal.Dialog></Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Modal.Container><Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>Delete Department</Modal.Heading></Modal.Header>
          <Modal.Body><p>Are you sure you want to delete <strong>{editingDept?.name}</strong>?</p></Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" slot="close">Cancel</Button>
            <Button variant="danger" onPress={handleDelete} isDisabled={actionLoading}>Delete</Button>
          </Modal.Footer>
        </Modal.Dialog></Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
