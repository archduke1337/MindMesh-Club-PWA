"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, Button, Chip } from "@heroui/react";
import { databases } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { Query } from "appwrite";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface Application {
  $id: string;
  name: string;
  email: string;
  department?: string;
  status: string;
  $createdAt: string;
}

export default function ApprovalQueue({ limit = 5 }: { limit?: number }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.APPLICATIONS, [
        Query.equal("status", ["pending"]),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ]);
      setApplications(response.documents as unknown as Application[]);
    } catch (error) {
      console.error("Failed to load pending applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await fetch("/api/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: id, action: "approve" }),
      });
      toast.success("Application approved!");
      await loadPending();
    } catch (error) {
      toast.error("Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this application?")) return;
    setProcessing(id);
    try {
      await fetch("/api/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: id, action: "reject", reason: "Rejected by admin" }),
      });
      toast.success("Application rejected");
      await loadPending();
    } catch (error) {
      toast.error("Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-default-200 rounded-lg" />)}</div>;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Pending Approvals</h3>
          <Chip size="sm" color="warning">{applications.length}</Chip>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-default-500 text-center py-4">No pending applications</p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.$id} className="flex items-center gap-3 p-3 rounded-lg bg-default-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{app.name}</p>
                  <p className="text-xs text-default-500">{app.email}</p>
                  {app.department && <p className="text-xs text-default-400">{app.department}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="primary" isPending={processing === app.$id} onPress={() => handleApprove(app.$id)}>
                    <CheckCircle className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="secondary" onPress={() => handleReject(app.$id)}>
                    <XCircle className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
