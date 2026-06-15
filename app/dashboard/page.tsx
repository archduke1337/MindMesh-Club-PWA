"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { Button, Card, CardContent, Chip, Link } from "@heroui/react";
import { StatsCard } from "@/components/StatsCard";
import { EventCard } from "@/components/EventCard";
import { PermissionGate } from "@/components/PermissionGate";
import { databases } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import type { Event, MembershipStatus } from "@/lib/types";
import {
  Calendar,
  Users,
  FileText,
  Settings,
  BookOpen,
  FolderOpen,
  Shield,
  BarChart3,
  ClipboardCheck,
} from "lucide-react";

interface DashboardStats {
  eventsAttended: number;
  activeTickets: number;
  departments: number;
  badges: number;
  pendingApplications?: number;
  upcomingEvents?: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole, isRoleOrAbove, loading: permsLoading } = usePermissions();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    eventsAttended: 0,
    activeTickets: 0,
    departments: 0,
    badges: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        const now = new Date().toISOString();

        const [eventsResult, ticketsResult] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [
            `equal("status", ["published"])`,
            `greater("date", ["${now}"])`,
            "limit(5)",
            "orderAsc('date')",
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.TICKETS, [
            `equal("userId", ["${user.$id}"])`,
            `equal("status", ["issued", "active"])`,
          ]),
        ]);

        setUpcomingEvents(eventsResult.documents as unknown as Event[]);

        setStats({
          eventsAttended: 0,
          activeTickets: ticketsResult.total,
          departments: 0,
          badges: 0,
          upcomingEvents: eventsResult.total,
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!permsLoading && user) {
      loadDashboardData();
    }
  }, [user, permsLoading]);

  if (authLoading || permsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="inline-block w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-default-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userStatus = (user.prefs as Record<string, unknown>)?.status as MembershipStatus || "account";

  const quickLinks = [
    { label: "My Profile", href: "/profile", icon: <Users className="w-5 h-5" />, color: "primary" as const },
    { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" />, color: "secondary" as const },
    { label: "Events", href: "/events", icon: <Calendar className="w-5 h-5" />, color: "success" as const },
    { label: "Projects", href: "/projects", icon: <FolderOpen className="w-5 h-5" />, color: "warning" as const },
    { label: "Blog", href: "/blog", icon: <FileText className="w-5 h-5" />, color: "danger" as const },
    { label: "Resources", href: "/resources", icon: <BookOpen className="w-5 h-5" />, color: "default" as const },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            {user.name}
          </span>
        </h1>
        <p className="text-default-500">
          {isRole("applicant")
            ? "Your application is being reviewed. Check back soon!"
            : isRole("member")
            ? "Here's what's happening with the club."
            : isRoleOrAbove("lead")
            ? "Here's your leadership overview."
            : "Here's what's happening with your account."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Active Tickets"
          value={stats.activeTickets}
          icon={<ClipboardCheck className="w-5 h-5" />}
          color="primary"
        />
        <StatsCard
          title="Departments"
          value={stats.departments}
          icon={<FolderOpen className="w-5 h-5" />}
          color="secondary"
        />
        <StatsCard
          title="Events Attended"
          value={stats.eventsAttended}
          icon={<Calendar className="w-5 h-5" />}
          color="success"
        />
        <StatsCard
          title="Badges"
          value={stats.badges}
          icon={<BarChart3 className="w-5 h-5" />}
          color="warning"
        />
      </div>

      <PermissionGate role="applicant">
        <Card className="border border-warning-200 bg-warning-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-warning-100">
                <Shield className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Application Under Review</h3>
                <p className="text-default-500 mt-1">
                  Your membership application is being reviewed by our team. We'll notify you once a
                  decision is made.
                </p>
                <Link href="/profile" className="text-primary hover:underline mt-2 inline-block">
                  View Application Status →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </PermissionGate>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Quick Links</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="cursor-pointer border border-default-200 hover:border-primary transition-colors h-full">
                <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
                  <div className={`text-${link.color}`}>{link.icon}</div>
                  <span className="text-sm font-medium">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            <Link href="/events" className="text-primary text-sm hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <EventCard key={event.$id} event={event} />
            ))}
          </div>
        </div>
      )}

      <PermissionGate roleOrAbove="lead">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Leadership</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/events/create">
              <Card className="border border-default-200 hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Create Event</h3>
                    <p className="text-sm text-default-500">Draft a new event for approval</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/resources">
              <Card className="border border-default-200 hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-secondary" />
                  <div>
                    <h3 className="font-semibold">Manage Resources</h3>
                    <p className="text-sm text-default-500">Upload and organize resources</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </PermissionGate>

      <PermissionGate role="admin">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin">
              <Card className="border border-default-200 hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-danger" />
                  <div>
                    <h3 className="font-semibold">Admin Dashboard</h3>
                    <p className="text-sm text-default-500">System overview and management</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/membership">
              <Card className="border border-default-200 hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="w-8 h-8 text-warning" />
                  <div>
                    <h3 className="font-semibold">Membership Queue</h3>
                    <p className="text-sm text-default-500">Review pending applications</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/audit">
              <Card className="border border-default-200 hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-success" />
                  <div>
                    <h3 className="font-semibold">Audit Log</h3>
                    <p className="text-sm text-default-500">View system activity</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}
