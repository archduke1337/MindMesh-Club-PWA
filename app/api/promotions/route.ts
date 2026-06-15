import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { ID, Query } from "appwrite";

function hasSession(request: NextRequest): boolean {
  return Array.from(request.cookies).some(
    ([name]) => name.startsWith("a_session_") && name !== "a_session_" && name.length > "a_session_".length
  );
}

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  if (!hasSession(request)) return false;
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionMatch = cookieHeader.match(/a_session_[^=]+=([^;]+)/);
    if (!sessionMatch) return false;

    const client = new (await import("appwrite")).Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setSession(sessionMatch[1]);
    const account = new (await import("appwrite")).Account(client);
    const user = await account.get();
    const { databases } = createAdminClient();
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal("email", [user.email]),
      Query.equal("status", ["admin"]),
      Query.limit(1),
    ]);
    return response.documents.length > 0;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
