import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { ID } from "appwrite";

export async function POST(request: NextRequest) {
  try {
    const { userId, promotion } = await request.json();

    if (!userId || !promotion) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId);

    await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
      status: promotion.newStatus,
    });

    await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
      userId,
      type: "role_promoted",
      title: "Role Promotion",
      body: `Congratulations! You have been promoted from ${promotion.previousRole} to ${promotion.newRole}.`,
      data: JSON.stringify({
        template: "promotion",
        previousRole: promotion.previousRole,
        newRole: promotion.newRole,
      }),
      read: false,
      createdAt: new Date().toISOString(),
    });

    await databases.createDocument(DATABASE_ID, COLLECTIONS.AUDIT_LOGS, ID.unique(), {
      actorId: promotion.approvedBy || "system",
      actorName: promotion.approverName || "System",
      actorRole: "admin",
      action: "role.promote",
      entityType: "user",
      entityId: userId,
      details: JSON.stringify({ from: promotion.previousRole, to: promotion.newStatus }),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Promotion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
