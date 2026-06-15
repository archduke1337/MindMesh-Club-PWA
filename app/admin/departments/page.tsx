"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Input,
  Textarea,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { departmentService } from "@/lib/departments";
import type { Department } from "@/lib/types";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Building2,
  Search,
} from "lucide-react";

const CATEGORIES = ["technical", "content", "operations"];

export default function AdminDepartmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole } = usePermissions();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    color: "",
    category: "technical" as string,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onCloseDelete } = useDisclosure();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (!authLoading && user && !isRole("admin")) {
      router.push("/unauthorized");
    }
  }, [user, authLoading, isRole, router]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await departmentService.getAll();
        setDepartments(depts);
      } catch (error) {
        console.error("Failed to load departments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user && isRole("admin")) {
      loadDepartments();
    }
  }, [user, authLoading, isRole]);

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        name: dept.name,
        slug: dept.slug,
        description: dept.description || "",
        icon: dept.icon || "",
        color: dept.color || "",
        category: dept.category,
      });
    } else {
      setEditingDept(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        icon: "",
        color: "",
        category: "technical",
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    setActionLoading(true);
    try {
      if (editingDept && editingDept.$id) {
        await departmentService.update(editingDept.$id, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          icon: formData.icon || undefined,
          color: formData.color || undefined,
          category: formData.category as "technical" | "content" | "operations",
        });
      } else {
        await departmentService.create({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          icon: formData.icon || undefined,
          color: formData.color || undefined,
          category: formData.category as "technical" | "content" | "operations",
          isActive: true,
        });
      }

      const depts = await departmentService.getAll();
      setDepartments(depts);
      onClose();
    } catch (error) {
      console.error("Failed to save department:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingDept?.$id) return;
    setActionLoading(true);
    try {
      await departmentService.delete(editingDept.$id);
      setDepartments((prev) => prev.filter((d) => d.$id !== editingDept.$id));
      onCloseDelete();
    } catch (error) {
      console.error("Failed to delete department:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDepts = departments.filter((dept) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dept.name.toLowerCase().includes(query) ||
      dept.description?.toLowerCase().includes(query)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isRole("admin")) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Department Management</h1>
          <p className="text-default-500">Create and manage club departments</p>
        </div>
        <Button
          color="primary"
          onClick={() => handleOpenModal()}
          startContent={<Plus className="w-4 h-4" />}
        >
          Add Department
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search departments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="w-4 h-4 text-default-400" />}
          className="max-w-md"
        />
      </div>

      {filteredDepts.length === 0 ? (
        <Card className="border border-default-200">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-default-300 mb-4" />
            <h3 className="text-lg font-semibold">No Departments</h3>
            <p className="text-default-500 mt-1">
              Create your first department to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepts.map((dept) => (
            <Card key={dept.$id} className="border border-default-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {dept.icon && <span className="text-2xl">{dept.icon}</span>}
                    <h3 className="font-semibold">{dept.name}</h3>
                  </div>
                  <Chip size="sm" variant="soft">
                    {dept.category}
                  </Chip>
                </div>

                {dept.description && (
                  <p className="text-sm text-default-500 line-clamp-2">
                    {dept.description}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    onClick={() => handleOpenModal(dept)}
                    startContent={<Edit className="w-4 h-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    onClick={() => {
                      setEditingDept(dept);
                      onDeleteOpen();
                    }}
                    startContent={<Trash2 className="w-4 h-4" />}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingDept ? "Edit Department" : "Add Department"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="e.g., AI/ML"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />
              <Input
                label="Slug"
                placeholder="e.g., ai-ml"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                isRequired
              />
              <Textarea
                label="Description"
                placeholder="Department description..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <Input
                label="Icon"
                placeholder="Emoji or icon name"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
              <Input
                label="Color"
                placeholder="Hex color code"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
              <Select
                label="Category"
                selectedKeys={[formData.category]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFormData({ ...formData, category: selected });
                }}
              >
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat}>{cat}</SelectItem>
                ))}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleSave}
              isLoading={actionLoading}
              isDisabled={!formData.name || !formData.slug}
            >
              {editingDept ? "Save Changes" : "Create Department"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={onCloseDelete}>
        <ModalContent>
          <ModalHeader>Delete Department</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete <strong>{editingDept?.name}</strong>?
              This action can be undone by an admin.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onCloseDelete}>
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={handleDelete}
              isLoading={actionLoading}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
