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

    const { userId, departmentId, departmentName } = await request.json();

    if (!userId || !departmentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    await databases.createDocument(DATABASE_ID, COLLECTIONS.USER_DEPARTMENTS, ID.unique(), {
      userId,
      departmentId,
      assignedAt: new Date().toISOString(),
      status: "active",
    });

    await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
      department: departmentName || departmentId,
    });

    await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
      userId,
      type: "department_assigned",
      title: "Department Assignment",
      body: `You have been assigned to ${departmentName || departmentId}.`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Department assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
