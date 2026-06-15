"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { Card, Chip } from "@heroui/react";
import { Loader2 } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { applicationService } from "@/lib/applications";
import { membershipService } from "@/lib/memberships";
import { departmentService } from "@/lib/departments";
import { eventService } from "@/lib/events";
import { Users, Calendar, FolderOpen, Award, Shield, BarChart3 } from "lucide-react";

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole } = usePermissions();
  const router = useRouter();
  const [stats, setStats] = useState({ pending: 0, members: 0, departments: 0, events: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && !isRole("admin")) router.push("/unauthorized");
  }, [user, authLoading, isRole, router]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [pending, members, depts, events] = await Promise.all([
          applicationService.getPending(),
          membershipService.count(),
          departmentService.count(),
          eventService.getAll(),
        ]);
        setStats({ pending: pending.length, members, departments: depts, events: events.length });
      } catch (error) { console.error("Failed to load stats:", error); }
      finally { setLoading(false); }
    };
    if (!authLoading && user && isRole("admin")) loadStats();
  }, [user, authLoading, isRole]);

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
  if (!user || !isRole("admin")) return null;

  const quickLinks = [
    { label: "Membership Queue", href: "/admin/membership", icon: <Users className="w-6 h-6" />, count: stats.pending, color: "warning" as const },
    { label: "Departments", href: "/admin/departments", icon: <FolderOpen className="w-6 h-6" />, count: stats.departments, color: "accent" as const },
    { label: "Designations", href: "/admin/designations", icon: <Award className="w-6 h-6" />, count: 0, color: "success" as const },
    { label: "Events", href: "/admin/events", icon: <Calendar className="w-6 h-6" />, count: stats.events, color: "danger" as const },
    { label: "Powers", href: "/admin/powers", icon: <Shield className="w-6 h-6" />, count: 0, color: "default" as const },
    { label: "Audit Log", href: "/admin/audit", icon: <BarChart3 className="w-6 h-6" />, count: 0, color: "default" as const },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-[var(--muted)]">System overview and management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Pending Applications" value={stats.pending} icon={<Users className="w-5 h-5" />} color="warning" />
        <StatsCard title="Total Members" value={stats.members} icon={<Users className="w-5 h-5" />} color="accent" />
        <StatsCard title="Departments" value={stats.departments} icon={<FolderOpen className="w-5 h-5" />} color="success" />
        <StatsCard title="Total Events" value={stats.events} icon={<Calendar className="w-5 h-5" />} color="danger" />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <a key={link.href} href={link.href}>
              <Card className="cursor-pointer hover:border-[var(--accent)] transition-colors h-full">
                <div className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[var(--surface)]">{link.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{link.label}</h3>
                    {link.count > 0 && <Chip size="sm" color={link.color}>{link.count} items</Chip>}
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
