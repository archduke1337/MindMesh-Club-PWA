"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { galleryService, galleryCategories, type GalleryImage } from "@/lib/gallery";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { toast } from "sonner";
import { Button, Card, CardContent, Chip, Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalBody, ModalFooter, ModalHeader } from "@heroui/react";
import { CheckIcon, XIcon, TrashIcon, ImageIcon } from "lucide-react";

export default function AdminGalleryPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { hasPermission, loading: permLoading } = usePermissions();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("pending");
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingImage, setRejectingImage] = useState<GalleryImage | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (permLoading) return;
    if (!authUser) {
      router.push("/login");
      return;
    }
    if (!hasPermission("approve_gallery") && (authUser.prefs as Record<string, unknown>)?.status !== "admin" && (authUser.prefs as Record<string, unknown>)?.status !== "dev") {
      toast.error("You don't have permission to manage the gallery");
      router.push("/unauthorized");
      return;
    }
    loadImages();
  }, [authUser, permLoading, hasPermission, router]);

  const loadImages = async () => {
    try {
      const all = await galleryService.getAll();
      setImages(all);
    } catch (error) {
      console.error("Error loading gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter((img) => {
    if (selectedTab === "pending") return img.status === "pending";
    if (selectedTab === "approved") return img.status === "approved";
    if (selectedTab === "rejected") return img.status === "rejected";
    return true;
  });

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await galleryService.approve(id, "admin");
      toast.success("Image approved!");
      await loadImages();
    } catch (error) {
      toast.error("Failed to approve image");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingImage || !rejectionReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setProcessing(rejectingImage.$id!);
    try {
      await galleryService.reject(rejectingImage.$id!, rejectionReason);
      toast.success("Image rejected");
      await loadImages();
      setRejectModalOpen(false);
    } catch (error) {
      toast.error("Failed to reject image");
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this image?")) return;
    try {
      await galleryService.delete(id);
      toast.success("Image deleted");
      await loadImages();
    } catch (error) {
      toast.error("Failed to delete image");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gallery Management</h1>
        <p className="text-default-600 mt-2">Review and manage uploaded images</p>
      </div>

      <div className="flex gap-2 mb-8 border-b border-default-200 pb-2">
        {["pending", "approved", "rejected", "all"].map((tab) => (
          <button key={tab} onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTab === tab ? "bg-primary text-white" : "text-default-600 hover:bg-default-100"}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === "all" ? images.length : images.filter((i) => i.status === tab).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredImages.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <ImageIcon className="w-12 h-12 mx-auto text-default-400 mb-4" />
              <p className="text-lg text-default-600">No images in this category</p>
            </CardContent>
          </Card>
        ) : (
          filteredImages.map((img) => (
            <Card key={img.$id} className="overflow-hidden">
              <div className="aspect-video overflow-hidden">
                <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">{img.title}</h3>
                    {img.description && <p className="text-sm text-default-500 line-clamp-2 mt-1">{img.description}</p>}
                  </div>
                  <Chip color={img.status === "approved" ? "success" : img.status === "rejected" ? "danger" : "warning"} variant="primary" size="sm">
                    {img.status}
                  </Chip>
                </div>

                <div className="flex flex-wrap gap-1">
                  <Chip size="sm" variant="secondary">{img.category}</Chip>
                  {img.tags?.slice(0, 3).map((tag) => <Chip key={tag} size="sm" variant="secondary">#{tag}</Chip>)}
                </div>

                {img.status === "rejected" && img.rejectionReason && (
                  <div className="bg-danger/10 border border-danger/20 rounded-lg p-2">
                    <p className="text-xs font-semibold text-danger">Reason: {img.rejectionReason}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-default-200">
                  {img.status === "pending" && (
                    <>
                      <Button size="sm" variant="primary" className="flex-1" isPending={processing === img.$id} onPress={() => handleApprove(img.$id!)}>
                        <CheckIcon className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="secondary" className="flex-1" onPress={() => { setRejectingImage(img); setRejectionReason(""); setRejectModalOpen(true); }}>
                        <XIcon className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="danger" onPress={() => handleDelete(img.$id!)}>
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ModalBackdrop isOpen={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <ModalContainer>
          <ModalDialog>
            <ModalHeader>Reject Image</ModalHeader>
            <ModalBody>
              <p className="mb-4">Please provide a reason for rejecting this image:</p>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-default-300 bg-white dark:bg-gray-900 text-sm" placeholder="Reason for rejection..." />
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onPress={() => setRejectModalOpen(false)}>Cancel</Button>
              <Button onPress={handleReject} isPending={!!processing}>Reject</Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </div>
  );
}
