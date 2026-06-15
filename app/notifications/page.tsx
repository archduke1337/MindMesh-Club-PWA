"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, Chip, Button } from "@heroui/react";
import { Loader2 } from "lucide-react";
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/notifications";
import type { Notification } from "@/lib/types";
import { Bell, Check, Trash2 } from "lucide-react";

const typeColors: Record<string, "default" | "success" | "warning" | "danger" | "accent"> = {
  membership: "success", event: "accent", ticket: "warning", blog: "default", system: "default",
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      try {
        const result = await getUserNotifications(user.$id);
        setNotifications(result as unknown as Notification[]);
      } catch (error) { console.error("Failed to load notifications:", error); }
      finally { setLoading(false); }
    };
    if (!authLoading && user) loadNotifications();
  }, [user, authLoading]);

  const markAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.$id === id ? { ...n, read: true } : n));
    } catch (error) { console.error("Failed to mark as read:", error); }
  };

  const markAllAsRead = async () => {
    try {
      if (user) await markAllNotificationsRead(user.$id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) { console.error("Failed to mark all as read:", error); }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><h1 className="text-3xl font-bold">Notifications</h1><p className="text-[var(--muted)]">{unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}</p></div>
        {unreadCount > 0 && <Button variant="secondary" onPress={markAllAsRead}><Check className="w-4 h-4 mr-2" /> Mark all as read</Button>}
      </div>

      {notifications.length === 0 ? (
        <Card><div className="p-12 text-center"><Bell className="w-12 h-12 mx-auto text-[var(--muted)] mb-4" /><h3 className="text-lg font-semibold">No Notifications</h3><p className="text-[var(--muted)] mt-1">You're all caught up!</p></div></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card key={notif.$id} className={notif.read ? "opacity-60" : ""}>
              <div className="p-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{notif.title}</h3>
                    <Chip size="sm" color={typeColors[notif.type] || "default"}>{notif.type}</Chip>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
                  </div>
                  <p className="text-sm text-[var(--muted)]">{notif.body}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{notif.$createdAt ? new Date(notif.$createdAt).toLocaleString() : ""}</p>
                </div>
                {!notif.read && <Button size="sm" variant="secondary" onPress={() => notif.$id && markAsRead(notif.$id)}>Mark read</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
