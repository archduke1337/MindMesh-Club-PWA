"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { Card, Chip, Input, Label, TextField } from "@heroui/react";
import { Loader2 } from "lucide-react";
import { queryAuditLogs } from "@/lib/audit";
import type { AuditLog } from "@/lib/types";
import { Search, Activity } from "lucide-react";

const actionColors: Record<string, "default" | "success" | "warning" | "danger" | "accent"> = {
  "membership.approve": "success", "membership.reject": "danger", "membership.ban": "danger",
  "event.create": "accent", "event.publish": "success", "event.cancel": "danger",
  "profile.update": "default", "power.grant": "accent", "power.revoke": "warning",
};

export default function AdminAuditPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole } = usePermissions();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && !isRole("admin")) router.push("/unauthorized");
  }, [user, authLoading, isRole, router]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const result = await queryAuditLogs({});
        setLogs(result.documents as unknown as AuditLog[]);
      } catch (error) { console.error("Failed to load audit logs:", error); }
      finally { setLoading(false); }
    };
    if (!authLoading && user && isRole("admin")) loadLogs();
  }, [user, authLoading, isRole]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return log.action.toLowerCase().includes(query) || log.entityType.toLowerCase().includes(query) || log.actorName?.toLowerCase().includes(query);
  });

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
  if (!user || !isRole("admin")) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2"><h1 className="text-3xl font-bold">Audit Log</h1><p className="text-[var(--muted)]">System activity and changes</p></div>

      <TextField variant="secondary" className="max-w-md"><Label>Search</Label><Input placeholder="Search logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></TextField>

      {filteredLogs.length === 0 ? (
        <Card><div className="p-12 text-center"><Activity className="w-12 h-12 mx-auto text-[var(--muted)] mb-4" /><h3 className="text-lg font-semibold">No Audit Logs</h3><p className="text-[var(--muted)] mt-1">{logs.length === 0 ? "No activity recorded yet." : "No logs match your search."}</p></div></Card>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <Card key={log.$id}>
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Chip size="sm" color={actionColors[log.action] || "default"}>{log.action}</Chip>
                  <div><p className="text-sm font-medium">{log.entityType}: {log.entityId?.slice(0, 8)}...</p><p className="text-xs text-[var(--muted)]">by {log.actorName || log.actorId?.slice(0, 8)}...</p></div>
                </div>
                <p className="text-xs text-[var(--muted)]">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
