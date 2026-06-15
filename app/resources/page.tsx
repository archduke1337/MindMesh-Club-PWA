"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resourceService, resourceCategories, resourceTypes, type Resource } from "@/lib/resources";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, Chip, Input, Label, TextField, Button, Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalBody, ModalFooter, ModalHeader } from "@heroui/react";
import { Search, FileText, Link2, Video, Download, Upload, FolderOpen } from "lucide-react";

const typeIcons: Record<string, any> = { document: FileText, link: Link2, video: Video, file: FolderOpen };

export default function ResourcesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "", description: "", category: "common", type: "document", url: "", tags: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => { loadResources(); }, []);

  const loadResources = async () => {
    try {
      const data = await resourceService.getAll();
      setResources(data);
    } catch (error) {
      console.error("Failed to load resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = resources.filter((r) => {
    const matchesCat = selectedCategory === "all" || r.category === selectedCategory;
    const matchesSearch = !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleUpload = async () => {
    if (!user || !uploadForm.title.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      const tags = uploadForm.tags.split(",").map((t) => t.trim()).filter(Boolean);
      let fileId: string | undefined;
      if (selectedFile) {
        const url = await resourceService.uploadFile(selectedFile);
        fileId = url;
      }
      await resourceService.create({
        title: uploadForm.title,
        description: uploadForm.description,
        category: uploadForm.category as any,
        type: uploadForm.type as any,
        url: uploadForm.url || undefined,
        fileId,
        uploadedBy: user.$id,
        uploadedByName: user.name || "Unknown",
        tags,
        isActive: true,
      });
      toast.success("Resource uploaded successfully!");
      setIsUploadOpen(false);
      setUploadForm({ title: "", description: "", category: "common", type: "document", url: "", tags: "" });
      setSelectedFile(null);
      await loadResources();
    } catch (error) {
      toast.error("Failed to upload resource");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Resources</h1>
        <p className="text-[var(--muted)]">Constitution, onboarding docs, learning paths, and more</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <TextField variant="secondary" className="max-w-sm"><Label>Search</Label><Input placeholder="Search resources..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></TextField>
        <div className="flex flex-wrap gap-2">
          <Chip variant={selectedCategory === "all" ? "primary" : "secondary"} color={selectedCategory === "all" ? "accent" : "default"} className="cursor-pointer" onClick={() => setSelectedCategory("all")}>All</Chip>
          {resourceCategories.map((cat) => (
            <Chip key={cat.value} variant={selectedCategory === cat.value ? "primary" : "secondary"} color={selectedCategory === cat.value ? "accent" : "default"} className="cursor-pointer" onClick={() => setSelectedCategory(cat.value)}>{cat.label}</Chip>
          ))}
        </div>
        {user && (
          <Button variant="primary" onPress={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Add Resource
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="text-center py-12"><FolderOpen className="w-12 h-12 mx-auto text-[var(--muted)] mb-4" /><h3 className="text-lg font-semibold">No Resources Found</h3><p className="text-[var(--muted)] mt-1">{resources.length === 0 ? "No resources uploaded yet." : "No resources match your search."}</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const Icon = typeIcons[r.type] || FileText;
            return (
              <Card key={r.$id} className="hover:border-[var(--accent)] transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[var(--accent)]/10"><Icon className="w-5 h-5 text-[var(--accent)]" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-1">{r.title}</h3>
                      <p className="text-sm text-[var(--muted)] line-clamp-2 mt-1">{r.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Chip size="sm" color="default">{r.category}</Chip>
                    <Chip size="sm" color="default">{r.type}</Chip>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>By {r.uploadedByName}</span>
                    <span>{r.downloads} downloads</span>
                  </div>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="secondary" size="sm" className="w-full"><Link2 className="w-4 h-4 mr-2" /> Open Link</Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ModalBackdrop isOpen={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <ModalContainer>
          <ModalDialog className="sm:max-w-lg">
            <ModalHeader>Add Resource</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <TextField variant="secondary"><Label>Title *</Label><Input placeholder="Resource title" value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} /></TextField>
                <TextField variant="secondary"><Label>Description</Label><Input placeholder="Brief description" value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} /></TextField>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Category</Label><select value={uploadForm.category} onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm">{resourceCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                  <div><Label>Type</Label><select value={uploadForm.type} onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm">{resourceTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                </div>
                <TextField variant="secondary"><Label>URL (for links)</Label><Input placeholder="https://..." value={uploadForm.url} onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })} /></TextField>
                <TextField variant="secondary"><Label>Tags</Label><Input placeholder="comma separated" value={uploadForm.tags} onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })} /></TextField>
                <div><Label>File (for documents)</Label><input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-[var(--muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent)] file:text-white" /></div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onPress={() => setIsUploadOpen(false)}>Cancel</Button>
              <Button variant="primary" onPress={handleUpload} isPending={uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </div>
  );
}
