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
import { designationService } from "@/lib/designations";
import type { Designation } from "@/lib/types";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Award,
  Search,
} from "lucide-react";

const CATEGORIES = ["department", "operations", "executive", "special"];

export default function AdminDesignationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole } = usePermissions();
  const router = useRouter();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editing, setEditing] = useState<Designation | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    level: 1,
    category: "department" as string,
    badgeIcon: "",
    badgeColor: "",
    maxHolders: 0,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onCloseDelete } = useDisclosure();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && !isRole("admin")) router.push("/unauthorized");
  }, [user, authLoading, isRole, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await designationService.getAll();
        setDesignations(data);
      } catch (error) {
        console.error("Failed to load designations:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading && user && isRole("admin")) load();
  }, [user, authLoading, isRole]);

  const handleOpenModal = (item?: Designation) => {
    if (item) {
      setEditing(item);
      setFormData({
        name: item.name,
        slug: item.slug,
        description: item.description || "",
        level: item.level,
        category: item.category,
        badgeIcon: item.badgeIcon || "",
        badgeColor: item.badgeColor || "",
        maxHolders: item.maxHolders || 0,
      });
    } else {
      setEditing(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        level: 1,
        category: "department",
        badgeIcon: "",
        badgeColor: "",
        maxHolders: 0,
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    setActionLoading(true);
    try {
      if (editing?.$id) {
        await designationService.update(editing.$id, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          level: formData.level,
          category: formData.category as "department" | "operations" | "executive" | "special",
          badgeIcon: formData.badgeIcon || undefined,
          badgeColor: formData.badgeColor || undefined,
          maxHolders: formData.maxHolders || undefined,
        });
      } else {
        await designationService.create({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          level: formData.level,
          category: formData.category as "department" | "operations" | "executive" | "special",
          badgeIcon: formData.badgeIcon || undefined,
          badgeColor: formData.badgeColor || undefined,
          maxHolders: formData.maxHolders || undefined,
          isActive: true,
        });
      }
      const data = await designationService.getAll();
      setDesignations(data);
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editing?.$id) return;
    setActionLoading(true);
    try {
      await designationService.delete(editing.$id);
      setDesignations((prev) => prev.filter((d) => d.$id !== editing.$id));
      onCloseDelete();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = designations.filter((d) => {
    if (!searchQuery) return true;
    return d.name.toLowerCase().includes(searchQuery.toLowerCase());
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
          <h1 className="text-3xl font-bold">Designation Management</h1>
          <p className="text-default-500">Create and manage member designations</p>
        </div>
        <Button
          color="primary"
          onClick={() => handleOpenModal()}
          startContent={<Plus className="w-4 h-4" />}
        >
          Add Designation
        </Button>
      </div>

      <Input
        placeholder="Search designations..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        startContent={<Search className="w-4 h-4 text-default-400" />}
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <Card className="border border-default-200">
          <CardContent className="p-12 text-center">
            <Award className="w-12 h-12 mx-auto text-default-300 mb-4" />
            <h3 className="text-lg font-semibold">No Designations</h3>
            <p className="text-default-500 mt-1">Create your first designation to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <Card key={item.$id} className="border border-default-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {item.badgeIcon && <span className="text-xl">{item.badgeIcon}</span>}
                    <h3 className="font-semibold">{item.name}</h3>
                  </div>
                  <Chip size="sm" variant="soft">
                    Level {item.level}
                  </Chip>
                </div>

                {item.description && (
                  <p className="text-sm text-default-500 line-clamp-2">{item.description}</p>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="flat" onClick={() => handleOpenModal(item)} startContent={<Edit className="w-4 h-4" />}>
                    Edit
                  </Button>
                  <Button size="sm" color="danger" variant="flat" onClick={() => { setEditing(item); onDeleteOpen(); }} startContent={<Trash2 className="w-4 h-4" />}>
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
          <ModalHeader>{editing ? "Edit Designation" : "Add Designation"}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input label="Name" placeholder="e.g., CyberSec Lead" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} isRequired />
              <Input label="Slug" placeholder="e.g., cybersec-lead" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} isRequired />
              <Textarea label="Description" placeholder="What this designation means..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <Input label="Level" type="number" min={1} max={10} value={formData.level.toString()} onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })} isRequired />
              <Select label="Category" selectedKeys={[formData.category]} onSelectionChange={(keys) => setFormData({ ...formData, category: Array.from(keys)[0] as string })}>
                {CATEGORIES.map((cat) => (<SelectItem key={cat}>{cat}</SelectItem>))}
              </Select>
              <Input label="Badge Icon" placeholder="Emoji or icon" value={formData.badgeIcon} onChange={(e) => setFormData({ ...formData, badgeIcon: e.target.value })} />
              <Input label="Badge Color" placeholder="Hex color" value={formData.badgeColor} onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })} />
              <Input label="Max Holders" type="number" min={0} placeholder="0 = unlimited" value={formData.maxHolders.toString()} onChange={(e) => setFormData({ ...formData, maxHolders: parseInt(e.target.value) || 0 })} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onClose}>Cancel</Button>
            <Button color="primary" onClick={handleSave} isLoading={actionLoading} isDisabled={!formData.name || !formData.slug}>
              {editing ? "Save Changes" : "Create Designation"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={onCloseDelete}>
        <ModalContent>
          <ModalHeader>Delete Designation</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete <strong>{editing?.name}</strong>?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onCloseDelete}>Cancel</Button>
            <Button color="danger" onClick={handleDelete} isLoading={actionLoading}>Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
