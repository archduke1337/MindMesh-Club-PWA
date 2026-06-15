"use client";

import { Card, CardContent, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { UserPlus, Calendar, FileText, Users, Settings, Shield } from "lucide-react";

export default function QuickActions() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const actions = [
    { label: "Create Event", icon: Calendar, href: "/events/create", show: hasPermission("event_manager") || hasPermission("all") },
    { label: "Write Blog", icon: FileText, href: "/blog/write", show: true },
    { label: "Manage Users", icon: Users, href: "/admin/users", show: hasPermission("all") },
    { label: "Review Applications", icon: UserPlus, href: "/admin/membership", show: hasPermission("membership_approver") || hasPermission("all") },
    { label: "Admin Panel", icon: Shield, href: "/admin", show: hasPermission("all") },
    { label: "Settings", icon: Settings, href: "/settings", show: true },
  ].filter((a) => a.show);

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {actions.map((action) => (
            <Button key={action.href} variant="secondary" size="sm" onPress={() => router.push(action.href)} className="justify-start">
              <action.icon className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
