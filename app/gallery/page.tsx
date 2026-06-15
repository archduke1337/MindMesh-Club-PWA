"use client";

import { useEffect, useState } from "react";
import { Card, Chip, Input, Label, TextField, Modal, Button } from "@heroui/react";
import { Loader2, Upload, X } from "lucide-react";
import { galleryService, galleryCategories, type GalleryImage } from "@/lib/gallery";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function GalleryPage() {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "", description: "", category: "events", tags: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const approved = await galleryService.getApproved();
      setImages(approved);
    } catch (error) {
      console.error("Failed to load gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter((img) => {
    const matchesCategory = selectedCategory === "all" || img.category === selectedCategory;
    const matchesSearch = !searchQuery || img.title.toLowerCase().includes(searchQuery.toLowerCase()) || img.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    if (!uploadForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setUploading(true);
    try {
      const tags = uploadForm.tags.split(",").map((t) => t.trim()).filter(Boolean);
      await galleryService.upload(selectedFile, user.$id, {
        title: uploadForm.title,
        description: uploadForm.description,
        category: uploadForm.category,
        tags,
      });
      toast.success("Image uploaded! It will be reviewed before appearing in the gallery.");
      setIsUploadOpen(false);
      setUploadForm({ title: "", description: "", category: "events", tags: "" });
      setSelectedFile(null);
      setPreview("");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Our <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--success)] bg-clip-text text-transparent">Gallery</span></h1>
        <p className="text-[var(--muted)]">Moments captured from our events, workshops, and team activities</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <TextField variant="secondary" className="max-w-sm"><Label>Search</Label><Input placeholder="Search images..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></TextField>
        <div className="flex flex-wrap gap-2">
          <Chip variant={selectedCategory === "all" ? "primary" : "secondary"} color={selectedCategory === "all" ? "accent" : "default"} className="cursor-pointer" onClick={() => setSelectedCategory("all")}>All</Chip>
          {galleryCategories.map((cat) => (
            <Chip key={cat.value} variant={selectedCategory === cat.value ? "primary" : "secondary"} color={selectedCategory === cat.value ? "accent" : "default"} className="cursor-pointer" onClick={() => setSelectedCategory(cat.value)}>{cat.label}</Chip>
          ))}
        </div>
        {user && (
          <Button variant="primary" onPress={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Upload Image
          </Button>
        )}
      </div>

      {filteredImages.length === 0 ? (
        <Card><div className="p-12 text-center"><Upload className="w-12 h-12 mx-auto text-[var(--muted)] mb-4" /><h3 className="text-lg font-semibold">No Images Found</h3><p className="text-[var(--muted)] mt-1">{images.length === 0 ? "No images uploaded yet." : "No images match your search."}</p></div></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((img) => (
            <Card key={img.$id} className="cursor-pointer hover:border-[var(--accent)] transition-colors" onClick={() => { setSelectedImage(img); setIsModalOpen(true); }}>
              <div className="aspect-square overflow-hidden"><img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover hover:scale-105 transition-transform" /></div>
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-1">{img.title}</h3>
                <p className="text-xs text-[var(--muted)] line-clamp-1">{img.description}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal.Backdrop isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
        <Modal.Container><Modal.Dialog className="sm:max-w-4xl">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>{selectedImage?.title}</Modal.Heading></Modal.Header>
          <Modal.Body>
            {selectedImage && (
              <div className="space-y-4">
                <img src={selectedImage.imageUrl} alt={selectedImage.title} className="w-full rounded-lg" />
                {selectedImage.description && <p className="text-[var(--muted)]">{selectedImage.description}</p>}
                <div className="flex gap-2">
                  <Chip>{selectedImage.category}</Chip>
                  {selectedImage.tags?.map((tag) => <Chip key={tag} color="default">{tag}</Chip>)}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" slot="close">Close</Button></Modal.Footer>
        </Modal.Dialog></Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <Modal.Container><Modal.Dialog className="sm:max-w-lg">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>Upload Image</Modal.Heading></Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <TextField variant="secondary"><Label>Title *</Label><Input placeholder="Image title" value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} /></TextField>
              <TextField variant="secondary"><Label>Description</Label><Input placeholder="Brief description" value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} /></TextField>
              <div>
                <Label>Category</Label>
                <select value={uploadForm.category} onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm">
                  {galleryCategories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>
              <TextField variant="secondary"><Label>Tags</Label><Input placeholder="comma separated tags" value={uploadForm.tags} onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })} /></TextField>
              <div>
                <Label>Image *</Label>
                <input type="file" accept="image/*" onChange={handleFileSelect} className="mt-1 block w-full text-sm text-[var(--muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent)] file:text-white hover:file:bg-[var(--accent)]/80" />
                {preview && <img src={preview} alt="Preview" className="mt-2 w-full h-40 object-cover rounded-lg" />}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" slot="close">Cancel</Button>
            <Button variant="primary" onPress={handleUpload} isPending={uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
          </Modal.Footer>
        </Modal.Dialog></Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
