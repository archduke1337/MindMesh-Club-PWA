import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { ID, Query } from "appwrite";
import { sendEmail, designationEmailTemplate } from "@/lib/emailService";

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

    try {
      const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId);
      if (profile && profile.email) {
        const emailTemplate = designationEmailTemplate(
          profile.name,
          designationName,
          departmentId || "unassigned"
        );
        await sendEmail({ to: profile.email, ...emailTemplate });
      }
    } catch {
      // Profile may not exist yet; email is best-effort
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Designation assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
