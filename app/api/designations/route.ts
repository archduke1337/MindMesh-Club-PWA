import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { ID } from "appwrite";

export async function POST(request: NextRequest) {
  try {
    const { userId, designationId, designationName, departmentId } = await request.json();

    if (!userId || !designationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    await databases.createDocument(DATABASE_ID, COLLECTIONS.USER_DESIGNATIONS, ID.unique(), {
      userId,
      designationId,
      assignedAt: new Date().toISOString(),
      status: "active",
    });

    await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
      userId,
      type: "designation_assigned",
      title: "Designation Assigned",
      body: `You have been assigned the designation: ${designationName}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    await databases.createDocument(DATABASE_ID, COLLECTIONS.AUDIT_LOGS, ID.unique(), {
      actorId: "system",
      actorName: "System",
      actorRole: "admin",
      action: "designation.assign",
      entityType: "designation",
      entityId: designationId,
      details: JSON.stringify({ userId, designationName, departmentId }),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Designation assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, designationId } = await request.json();

    if (!userId || !designationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_DESIGNATIONS, [
      (await import("appwrite")).Query.equal("userId", [userId]),
      (await import("appwrite")).Query.equal("designationId", [designationId]),
      (await import("appwrite")).Query.limit(1),
    ]);

    if (response.documents.length > 0) {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USER_DESIGNATIONS, response.documents[0].$id);
    }

    await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
      userId,
      type: "designation_revoked",
      title: "Designation Revoked",
      body: `Your designation has been revoked.`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Designation revoke error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
