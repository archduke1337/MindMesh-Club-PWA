"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, Button, Chip } from "@heroui/react";
import { queryAuditLogs } from "@/lib/audit";
import type { AuditLog } from "@/lib/types";
import { ArrowLeft, Clock } from "lucide-react";

export default function ProfileHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    const loadLogs = async () => {
      if (!user) return;
      setLoadingLogs(true);
      try {
        const result = await queryAuditLogs({
          entityType: "user",
          entityId: user.$id,
          limit: pageSize,
          offset: page * pageSize,
        });
        setLogs(result.logs);
        setTotal(result.total);
      } catch (error) {
        console.error("Failed to load audit logs:", error);
      } finally {
        setLoadingLogs(false);
      }
    };
    if (user) loadLogs();
  }, [user, page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-default-500">Loading history...</p>
      </div>
    );
  }

  if (!user) return null;

  const formatFieldName = (field: string) => {
    return field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="ghost" size="sm" onPress={() => router.push("/profile")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Profile Change History</h1>
          <p className="text-sm text-default-500">Audit trail of changes to your profile</p>
        </div>
      </div>

      {loadingLogs ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse h-20 bg-default-200 rounded-lg" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 text-default-300 mx-auto mb-3" />
            <p className="text-default-500">No profile changes recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {logs.map((log) => (
              <Card key={log.$id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Chip size="sm" variant="soft" color="accent">{log.action}</Chip>
                        {log.details?.field && (
                          <span className="text-sm font-medium">{formatFieldName(log.details.field)}</span>
                        )}
                      </div>
                      {log.details?.field && (
                        <div className="text-sm space-y-1 mt-2">
                          {log.details.oldValue !== undefined && (
                            <p className="text-default-500">
                              <span className="font-medium">Old:</span>{" "}
                              <span className="line-through">{String(log.details.oldValue || "(empty)")}</span>
                            </p>
                          )}
                          {log.details.newValue !== undefined && (
                            <p className="text-[var(--success)]">
                              <span className="font-medium">New:</span> {String(log.details.newValue || "(empty)")}
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-default-400 mt-2">
                        Changed by {log.actorName} &middot; {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                size="sm"
                variant="ghost"
                isDisabled={page === 0}
                onPress={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-default-500">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="ghost"
                isDisabled={page >= totalPages - 1}
                onPress={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
