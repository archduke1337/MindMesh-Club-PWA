import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTIONS } from "@/lib/database";
import { Query } from "appwrite";

export async function GET(request: NextRequest) {
  try {
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
