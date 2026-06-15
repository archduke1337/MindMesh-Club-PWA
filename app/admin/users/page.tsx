"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { databases } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button, Card, CardContent, Chip, Input, Label, TextField, Avatar, AvatarImage, AvatarFallback, Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalBody, ModalFooter, ModalHeader } from "@heroui/react";
import { Search, User, Shield, Edit, TrashIcon, Eye } from "lucide-react";

interface UserProfile {
  $id: string;
  name: string;
  email: string;
  phone?: string;
  urn?: string;
  department?: string;
  status: string;
  $createdAt: string;
  avatar?: string;
}

export default function AdminUsersPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (!authUser) return;
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/admin-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authUser.email }),
        });
        const data = await res.json();
        if (!data.isAdmin) {
          router.push("/unauthorized");
          return;
        }
        loadUsers();
      } catch {
        router.push("/unauthorized");
      }
    };
    checkAdmin();
  }, [authUser, router]);

  const loadUsers = async () => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ]);
      setUsers(response.documents as unknown as UserProfile[]);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
  });

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, { status: newStatus });
      toast.success(`User status updated to ${newStatus}`);
      await loadUsers();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-default-600 mt-2">View and manage all registered users</p>
      </div>

      <div className="mb-6">
        <TextField variant="secondary" className="max-w-md"><Label>Search Users</Label><Input placeholder="Search by name, email, or department..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></TextField>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card><CardContent className="text-center py-12"><User className="w-12 h-12 mx-auto text-default-400 mb-4" /><p className="text-lg text-default-600">No users found</p></CardContent></Card>
        ) : (
          filtered.map((user) => (
            <Card key={user.$id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{user.name}</h3>
                    <Chip size="sm" color={user.status === "member" ? "success" : user.status === "admin" ? "danger" : "warning"} variant="primary">{user.status}</Chip>
                  </div>
                  <p className="text-sm text-default-500">{user.email}</p>
                  {user.department && <p className="text-xs text-default-400">{user.department}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onPress={() => { setSelectedUser(user); setIsDetailOpen(true); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {user.status !== "admin" && (
                    <>
                      <Button size="sm" variant="secondary" onPress={() => handleStatusChange(user.$id, "banned")} className="text-danger">
                        <Shield className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ModalBackdrop isOpen={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <ModalContainer>
          <ModalDialog className="sm:max-w-lg">
            <ModalHeader>User Details</ModalHeader>
            <ModalBody>
              {selectedUser && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar size="lg"><AvatarImage src={selectedUser.avatar} /><AvatarFallback>{selectedUser.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}</AvatarFallback></Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                      <p className="text-default-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-default-500">Status:</span> <Chip size="sm" color={selectedUser.status === "member" ? "success" : "warning"}>{selectedUser.status}</Chip></div>
                    <div><span className="text-default-500">Department:</span> {selectedUser.department || "Not assigned"}</div>
                    <div><span className="text-default-500">Phone:</span> {selectedUser.phone || "Not provided"}</div>
                    <div><span className="text-default-500">URN:</span> {selectedUser.urn || "Not provided"}</div>
                    <div className="col-span-2"><span className="text-default-500">Joined:</span> {new Date(selectedUser.$createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onPress={() => setIsDetailOpen(false)}>Close</Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </div>
  );
}
