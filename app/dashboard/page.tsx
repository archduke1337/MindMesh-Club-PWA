"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { Button, Card, Chip } from "@heroui/react";
import { StatsCard } from "@/components/StatsCard";
import { EventCard } from "@/components/EventCard";
import { PermissionGate } from "@/components/PermissionGate";
import { databases } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import type { Event, MembershipStatus } from "@/lib/types";
import { Calendar, Users, FileText, Settings, BookOpen, FolderOpen, Shield, BarChart3, ClipboardCheck } from "lucide-react";

interface DashboardStats {
  eventsAttended: number;
  activeTickets: number;
  departments: number;
  badges: number;
  upcomingEvents?: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole, isRoleOrAbove, loading: permsLoading } = usePermissions();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ eventsAttended: 0, activeTickets: 0, departments: 0, badges: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      try {
        const now = new Date().toISOString();
        const [eventsResult, ticketsResult] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [`equal("status", ["published"])`, `greater("date", ["${now}"])`, "limit(5)", "orderAsc('date')"]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.TICKETS, [`equal("userId", ["${user.$id}"])`, `equal("status", ["issued", "active"])`]),
        ]);
        setUpcomingEvents(eventsResult.documents as unknown as Event[]);
        setStats({ eventsAttended: 0, activeTickets: ticketsResult.total, departments: 0, badges: 0, upcomingEvents: eventsResult.total });
      } catch (error) { console.error("Failed to load dashboard data:", error); }
      finally { setLoading(false); }
    };
    if (!permsLoading && user) loadDashboardData();
  }, [user, permsLoading]);

  if (authLoading || permsLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><div className="inline-block w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /><p className="text-[var(--muted)]">Loading dashboard...</p></div>;
  }

  if (!user) return null;
  const userStatus = (user.prefs as Record<string, unknown>)?.status as MembershipStatus || "account";

  const quickLinks = [
    { label: "My Profile", href: "/profile", icon: <Users className="w-5 h-5" /> },
    { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
    { label: "Events", href: "/events", icon: <Calendar className="w-5 h-5" /> },
    { label: "Projects", href: "/projects", icon: <FolderOpen className="w-5 h-5" /> },
    { label: "Blog", href: "/blog", icon: <FileText className="w-5 h-5" /> },
    { label: "Resources", href: "/resources", icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome back, <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--success)] bg-clip-text text-transparent">{user.name}</span></h1>
        <p className="text-[var(--muted)]">
          {isRole("applicant") ? "Your application is being reviewed. Check back soon!" : isRole("member") ? "Here's what's happening with the club." : isRoleOrAbove("lead") ? "Here's your leadership overview." : "Here's what's happening with your account."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Active Tickets" value={stats.activeTickets} icon={<ClipboardCheck className="w-5 h-5" />} color="accent" />
        <StatsCard title="Departments" value={stats.departments} icon={<FolderOpen className="w-5 h-5" />} color="success" />
        <StatsCard title="Events Attended" value={stats.eventsAttended} icon={<Calendar className="w-5 h-5" />} color="warning" />
        <StatsCard title="Badges" value={stats.badges} icon={<BarChart3 className="w-5 h-5" />} color="danger" />
      </div>

      <PermissionGate role="applicant">
        <Card className="border border-[var(--warning)]">
          <div className="p-6 flex items-start gap-4">
            <div className="p-3 rounded-full bg-[var(--warning)]"><Shield className="w-6 h-6 text-white" /></div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Application Under Review</h3>
              <p className="text-[var(--muted)] mt-1">Your membership application is being reviewed by our team. We'll notify you once a decision is made.</p>
              <a href="/profile" className="text-[var(--accent)] hover:underline mt-2 inline-block">View Application Status →</a>
            </div>
          </div>
        </Card>
      </PermissionGate>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {quickLinks.map((link) => (
            <a key={link.href} href={link.href}>
              <Card className="cursor-pointer hover:border-[var(--accent)] transition-colors h-full">
                <div className="flex flex-col items-center justify-center py-6 gap-2">{link.icon}<span className="text-sm font-medium">{link.label}</span></div>
              </Card>
            </a>
          ))}
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Upcoming Events</h2><a href="/events" className="text-[var(--accent)] text-sm hover:underline">View All →</a></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{upcomingEvents.map((event) => <EventCard key={event.$id} event={event} />)}</div>
        </div>
      )}

      <PermissionGate roleOrAbove="lead">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Leadership</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/events/create"><Card className="cursor-pointer hover:border-[var(--accent)] transition-colors"><div className="p-4 flex items-center gap-3"><Calendar className="w-8 h-8 text-[var(--accent)]" /><div><h3 className="font-semibold">Create Event</h3><p className="text-sm text-[var(--muted)]">Draft a new event for approval</p></div></div></Card></a>
            <a href="/resources"><Card className="cursor-pointer hover:border-[var(--accent)] transition-colors"><div className="p-4 flex items-center gap-3"><BookOpen className="w-8 h-8 text-[var(--success)]" /><div><h3 className="font-semibold">Manage Resources</h3><p className="text-sm text-[var(--muted)]">Upload and organize resources</p></div></div></Card></a>
          </div>
        </div>
      </PermissionGate>

      <PermissionGate role="admin">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/admin"><Card className="cursor-pointer hover:border-[var(--accent)] transition-colors"><div className="p-4 flex items-center gap-3"><Shield className="w-8 h-8 text-[var(--danger)]" /><div><h3 className="font-semibold">Admin Dashboard</h3><p className="text-sm text-[var(--muted)]">System overview and management</p></div></div></Card></a>
            <a href="/admin/membership"><Card className="cursor-pointer hover:border-[var(--accent)] transition-colors"><div className="p-4 flex items-center gap-3"><Users className="w-8 h-8 text-[var(--warning)]" /><div><h3 className="font-semibold">Membership Queue</h3><p className="text-sm text-[var(--muted)]">Review pending applications</p></div></div></Card></a>
            <a href="/admin/audit"><Card className="cursor-pointer hover:border-[var(--accent)] transition-colors"><div className="p-4 flex items-center gap-3"><BarChart3 className="w-8 h-8 text-[var(--success)]" /><div><h3 className="font-semibold">Audit Log</h3><p className="text-sm text-[var(--muted)]">View system activity</p></div></div></Card></a>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}
