"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@heroui/react";
import { Clock, CheckCircle, AlertCircle, User } from "lucide-react";
import { databases } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { Query } from "appwrite";

interface Activity {
  $id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string;
  details: string;
  timestamp: string;
}

export default function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.AUDIT_LOGS, [
          Query.orderDesc("timestamp"),
          Query.limit(limit),
        ]);
        setActivities(response.documents as unknown as Activity[]);
      } catch (error) {
        console.error("Failed to load activity feed:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [limit]);

  if (loading) {
    return <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-default-200 rounded-lg" />)}</div>;
  }

  const getIcon = (action: string) => {
    if (action.includes("approve") || action.includes("create")) return <CheckCircle className="w-4 h-4 text-success" />;
    if (action.includes("reject") || action.includes("delete") || action.includes("ban")) return <AlertCircle className="w-4 h-4 text-danger" />;
    if (action.includes("promote") || action.includes("assign")) return <User className="w-4 h-4 text-primary" />;
    return <Clock className="w-4 h-4 text-default-400" />;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-bold mb-4">Recent Activity</h3>
        {activities.length === 0 ? (
          <p className="text-sm text-default-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.map((a) => (
              <div key={a.$id} className="flex items-start gap-3 text-sm">
                {getIcon(a.action)}
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-1"><span className="font-medium">{a.actorName}</span> {a.action} {a.entityType}</p>
                  <p className="text-xs text-default-400">{new Date(a.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
