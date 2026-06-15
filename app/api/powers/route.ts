import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { ID } from "appwrite";

export async function POST(request: NextRequest) {
  try {
    const { userId, powerId, powerName, scope } = await request.json();

    if (!userId || !powerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    await databases.createDocument(DATABASE_ID, COLLECTIONS.USER_POWERS, ID.unique(), {
      userId,
      powerId,
      scope: scope || "global",
      grantedAt: new Date().toISOString(),
      status: "active",
    });

    await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
      userId,
      type: "power_granted",
      title: "Power Granted",
      body: `You have been granted the power: ${powerName}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Power grant error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, powerId } = await request.json();

    if (!userId || !powerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_POWERS, [
      (await import("appwrite")).Query.equal("userId", [userId]),
      (await import("appwrite")).Query.equal("powerId", [powerId]),
      (await import("appwrite")).Query.limit(1),
    ]);

    if (response.documents.length > 0) {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USER_POWERS, response.documents[0].$id);
    }

    await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
      userId,
      type: "power_revoked",
      title: "Power Revoked",
      body: `Your power has been revoked.`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Power revoke error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
