import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { Query } from "appwrite";

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

export async function GET(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const limit = parseInt(searchParams.get("limit") || "100");

    const { databases } = createAdminClient();

    const queries = [Query.orderDesc("timestamp"), Query.limit(limit)];
    if (entityType) queries.push(Query.equal("entityType", [entityType]));
    if (entityId) queries.push(Query.equal("entityId", [entityId]));

    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.AUDIT_LOGS, queries);

    return NextResponse.json({ logs: response.documents });
  } catch (error) {
    console.error("Audit log fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
