"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { Button, Card, Chip } from "@heroui/react";
import { StatsCard } from "@/components/StatsCard";
import { EventCard } from "@/components/EventCard";
import { PermissionGate } from "@/components/PermissionGate";
import ActivityFeed from "@/components/ActivityFeed";
import { databases } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { eventService } from "@/lib/events";
import { Query } from "appwrite";
import type { Event, Registration, Notification, MembershipStatus, Department, UserDepartment } from "@/lib/types";
import { Calendar, Users, FileText, Settings, BookOpen, FolderOpen, Shield, BarChart3, ClipboardCheck, Bell, TrendingUp, UserCheck, UserX, Activity } from "lucide-react";

interface DashboardStats {
  eventsAttended: number;
  activeTickets: number;
  departments: number;
  badges: number;
  upcomingEvents?: number;
}

interface MyEventItem {
  registration: Registration;
  event: Event;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole, isRoleOrAbove, loading: permsLoading } = usePermissions();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ eventsAttended: 0, activeTickets: 0, departments: 0, badges: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [myUpcomingEvents, setMyUpcomingEvents] = useState<MyEventItem[]>([]);
  const [myPastEvents, setMyPastEvents] = useState<MyEventItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [myEventsTab, setMyEventsTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);

  const [leadDepartments, setLeadDepartments] = useState<(UserDepartment & { departmentName: string; memberCount: number; eventCount: number })[]>([]);
  const [draftReviewEvents, setDraftReviewEvents] = useState<Event[]>([]);
  const [headStats, setHeadStats] = useState({ totalDepartments: 0, totalMembers: 0, pendingApprovals: 0, totalEvents: 0 });
  const [pendingApprovalEvents, setPendingApprovalEvents] = useState<Event[]>([]);
  const [departmentHealth, setDepartmentHealth] = useState<{ name: string; memberCount: number; eventCount: number }[]>([]);
  const [pendingApplications, setPendingApplications] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadDashboardData = async () => {
        if (!user) return;
      try {
        const userId = user.$id;

        const [
          upcomingEventsResult,
          ticketsResult,
          registrationsResult,
          departmentsResult,
          designationsResult,
          notificationsResult,
        ] = await Promise.all([
          eventService.getUpcoming(5),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.TICKETS, [
            `equal("userId", ["${userId}"])`,
            `equal("status", ["issued", "active"])`,
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.REGISTRATIONS, [
            `equal("userId", ["${userId}"])`,
            `orderDesc("registeredAt")`,
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_DEPARTMENTS, [
            `equal("userId", ["${userId}"])`,
            `equal("isActive", [true])`,
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_DESIGNATIONS, [
            `equal("userId", ["${userId}"])`,
            `equal("isActive", [true])`,
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
            `equal("userId", ["${userId}"])`,
            `orderDesc("createdAt")`,
            "limit(5)",
          ]),
        ]);

        setUpcomingEvents(upcomingEventsResult);

        const myRegs = registrationsResult.documents as unknown as Registration[];

        const upcoming: MyEventItem[] = [];
        const past: MyEventItem[] = [];

        const eventFetches = myRegs.map(async (reg) => {
          try {
            const eventDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, reg.eventId);
            const event = eventDoc as unknown as Event;
            if (new Date(event.date) > new Date()) {
              upcoming.push({ registration: reg, event });
            } else {
              past.push({ registration: reg, event });
            }
          } catch {
            // event may have been deleted
          }
        });
        await Promise.all(eventFetches);

        setMyUpcomingEvents(upcoming);
        setMyPastEvents(past);

        setStats({
          eventsAttended: registrationsResult.total,
          activeTickets: ticketsResult.total,
          departments: departmentsResult.total,
          badges: designationsResult.total,
          upcomingEvents: upcomingEventsResult.length,
        });

        setNotifications(notificationsResult.documents as unknown as Notification[]);

        if (isRoleOrAbove("lead")) {
          const userDepts = departmentsResult.documents as unknown as UserDepartment[];
          const deptDetails = await Promise.all(
            userDepts.map(async (ud) => {
              const [deptDoc, membersResult, eventsResult] = await Promise.all([
                databases.getDocument(DATABASE_ID, COLLECTIONS.DEPARTMENTS, ud.departmentId).catch(() => null),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_DEPARTMENTS, [
                  Query.equal("departmentId", [ud.departmentId]),
                  Query.equal("isActive", [true]),
                ]),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [
                  Query.equal("ownerId", [userId]),
                ]),
              ]);
              return {
                ...ud,
                departmentName: (deptDoc as unknown as Department)?.name || "Unknown",
                memberCount: membersResult.total,
                eventCount: eventsResult.total,
              };
            })
          );
          setLeadDepartments(deptDetails);

          const allEvents = await eventService.getAll();
          const drEvents = allEvents.filter((e) => e.status === "draft" || e.status === "review");
          setDraftReviewEvents(drEvents);
        }

        if (isRoleOrAbove("head")) {
          const [allDepts, allUserDepts, allEvents, pendingApps] = await Promise.all([
            databases.listDocuments(DATABASE_ID, COLLECTIONS.DEPARTMENTS, [Query.equal("isActive", [true])]),
            databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_DEPARTMENTS, [Query.equal("isActive", [true])]),
            eventService.getAll(),
            databases.listDocuments(DATABASE_ID, COLLECTIONS.APPLICATIONS, [Query.equal("status", ["pending"])]),
          ]);

          const depts = allDepts.documents as unknown as Department[];
          const userDepts = allUserDepts.documents as unknown as UserDepartment[];

          const deptHealth = await Promise.all(
            depts.map(async (dept) => {
              const members = userDepts.filter((ud) => ud.departmentId === dept.$id);
              const deptEvents = allEvents.filter((e) => e.ownerId === userId);
              return { name: dept.name, memberCount: members.length, eventCount: deptEvents.length };
            })
          );

          setHeadStats({
            totalDepartments: allDepts.total,
            totalMembers: allUserDepts.total,
            pendingApprovals: allEvents.filter((e) => e.status === "review").length,
            totalEvents: allEvents.length,
          });
          setPendingApprovalEvents(allEvents.filter((e) => e.status === "review"));
          setDepartmentHealth(deptHealth);
          setPendingApplications(pendingApps.total);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!permsLoading && user) loadDashboardData();
  }, [user, permsLoading]);

  if (authLoading || permsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="inline-block w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--muted)]">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) return null;
  const userStatus = (user.prefs as Record<string, unknown>)?.status as MembershipStatus || "account";

  const unreadNotifications = notifications.filter((n) => !n.read);

  const quickLinks = [
    { label: "My Profile", href: "/profile", icon: <Users className="w-5 h-5" /> },
    { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
    { label: "Events", href: "/events", icon: <Calendar className="w-5 h-5" /> },
    { label: "Projects", href: "/projects", icon: <FolderOpen className="w-5 h-5" /> },
    { label: "Blog", href: "/blog", icon: <FileText className="w-5 h-5" /> },
    { label: "Resources", href: "/resources", icon: <BookOpen className="w-5 h-5" /> },
  ];

  const renderMyEventsList = (items: MyEventItem[]) => {
    if (items.length === 0) {
      return <p className="text-sm text-[var(--muted)] text-center py-4">No events to show.</p>;
    }
    return (
      <div className="space-y-3">
        {items.map(({ registration, event }) => (
          <Card key={registration.$id}>
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{event.title}</h4>
                <p className="text-sm text-[var(--muted)]">{new Date(event.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} &middot; {event.time}</p>
              </div>
              <Chip size="sm" variant="soft" color={registration.status === "approved" ? "success" : registration.status === "pending" ? "warning" : "default"}>
                {registration.status || "registered"}
              </Chip>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--success)] bg-clip-text text-transparent">{user.name}</span>
        </h1>
        <p className="text-[var(--muted)]">
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            <a href="/events" className="text-[var(--accent)] text-sm hover:underline">View All →</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => <EventCard key={event.$id} event={event} />)}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Events</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={myEventsTab === "upcoming" ? "primary" : "ghost"}
            onPress={() => setMyEventsTab("upcoming")}
          >
            Upcoming ({myUpcomingEvents.length})
          </Button>
          <Button
            size="sm"
            variant={myEventsTab === "past" ? "primary" : "ghost"}
            onPress={() => setMyEventsTab("past")}
          >
            Past ({myPastEvents.length})
          </Button>
        </div>
        {myEventsTab === "upcoming" && renderMyEventsList(myUpcomingEvents)}
        {myEventsTab === "past" && renderMyEventsList(myPastEvents)}
      </div>

      {unreadNotifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" /> Announcements
          </h2>
          <div className="space-y-3">
            {unreadNotifications.map((notif) => (
              <Card key={notif.$id}>
                <div className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-full bg-[var(--accent)]/10">
                    <Bell className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{notif.title}</h4>
                    <p className="text-sm text-[var(--muted)] line-clamp-2">{notif.body}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">{new Date(notif.$createdAt || "").toLocaleString()}</p>
                  </div>
                  <Chip size="sm" variant="soft" color="accent">New</Chip>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <PermissionGate roleOrAbove="lead">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Leadership</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/events/create">
              <Card className="cursor-pointer hover:border-[var(--accent)] transition-colors">
                <div className="p-4 flex items-center gap-3"><Calendar className="w-8 h-8 text-[var(--accent)]" /><div><h3 className="font-semibold">Create Event</h3><p className="text-sm text-[var(--muted)]">Draft a new event for approval</p></div></div>
              </Card>
            </a>
            <a href="/resources">
              <Card className="cursor-pointer hover:border-[var(--accent)] transition-colors">
                <div className="p-4 flex items-center gap-3"><BookOpen className="w-8 h-8 text-[var(--success)]" /><div><h3 className="font-semibold">Manage Resources</h3><p className="text-sm text-[var(--muted)]">Upload and organize resources</p></div></div>
              </Card>
            </a>
          </div>
        </div>
      </PermissionGate>

      <PermissionGate role="admin">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/admin">
              <Card className="cursor-pointer hover:border-[var(--accent)] transition-colors">
                <div className="p-4 flex items-center gap-3"><Shield className="w-8 h-8 text-[var(--danger)]" /><div><h3 className="font-semibold">Admin Dashboard</h3><p className="text-sm text-[var(--muted)]">System overview and management</p></div></div>
              </Card>
            </a>
            <a href="/admin/membership">
              <Card className="cursor-pointer hover:border-[var(--accent)] transition-colors">
                <div className="p-4 flex items-center gap-3"><Users className="w-8 h-8 text-[var(--warning)]" /><div><h3 className="font-semibold">Membership Queue</h3><p className="text-sm text-[var(--muted)]">Review pending applications</p></div></div>
              </Card>
            </a>
            <a href="/admin/audit">
              <Card className="cursor-pointer hover:border-[var(--accent)] transition-colors">
                <div className="p-4 flex items-center gap-3"><BarChart3 className="w-8 h-8 text-[var(--success)]" /><div><h3 className="font-semibold">Audit Log</h3><p className="text-sm text-[var(--muted)]">View system activity</p></div></div>
              </Card>
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <ActivityFeed limit={8} />
        </div>
      </PermissionGate>
    </div>
  );
}
